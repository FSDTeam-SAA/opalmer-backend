const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const { validateImportCsv, parseImportCsv, importSchoolData } = require('../src/services/schoolImport.service');
const { District } = require('../src/models/district.model');
const School = require('../src/models/school.model').default;
async function patched(entries, fn) {
  const originals = entries.map(([obj, key]) => obj[key]);
  entries.forEach(([obj, key, value]) => { obj[key] = value; });
  try { await fn(); } finally { entries.forEach(([obj, key], i) => { obj[key] = originals[i]; }); }
}

test('CSV validation reports physical lines, quoted content, all duplicate rows and field errors', () => {
  const rows = validateImportCsv('\uFEFFname,code,districtCode,email\r\n"School, A",A,D,a@example.com\r\n"School\nB",B,D,bad\r\nSchool C,a,D,\r\n', 'schools');
  assert.equal(rows[0].values.name, 'School, A');
  assert.match(rows[0].error, /Duplicate code/);
  assert.equal(rows[1].row, 3);
  assert.match(rows[1].error, /Invalid email/);
  assert.equal(rows[2].row, 5);
  assert.match(rows[2].error, /Duplicate code/);
  assert.throws(() => parseImportCsv('name,code\n"unclosed,A'), /Unclosed/);
  assert.throws(() => parseImportCsv('name,code\n"closed"bad,A'), /quoting/);
  assert.throws(() => validateImportCsv('name,name\nA,A', 'districts'), /template/);
  assert.throws(() => validateImportCsv('name,code\n' + 'A,A\n'.repeat(501), 'districts'), /500/);
  assert.match(validateImportCsv('name,code,districtCode\nA,A,', 'schools')[0].error, /District code/);
});

test('school preview checks database duplicates and district codes without saving anything', async () => {
  await patched([
    [District, 'findOne', async filter => filter.code.test('D-1') ? { _id: 'district' } : null],
    [School, 'exists', async filter => filter.$or[0].name.test('Existing') ? {} : null],
    [School, 'create', async () => { throw Error('Preview must never save'); }],
  ], async () => {
    const result = await importSchoolData('name,code,districtCode\nNew,N,d-1\nExisting,E,D-1\nUnknown,U,missing', 'schools', false);
    assert.equal(result.ready, 1);
    assert.equal(result.created, 0);
    assert.equal(result.failed, 2);
    assert.match(result.rows[1].error, /already exists/);
    assert.match(result.rows[2].error, /Unknown district/);
  });
});

test('commit rechecks duplicates, links schools to districts and safely reports partial failures and retry', async () => {
  const saved = [];
  await patched([
    [District, 'findOne', async () => ({ _id: 'district-id' })],
    [School, 'exists', async filter => saved.some(s => filter.$or[1].code.test(s.code)) ? {} : null],
    [School, 'create', async payload => { if (payload.code === 'FAIL') throw Object.assign(Error('duplicate'), { code: 11000 }); saved.push(payload); return payload; }],
  ], async () => {
    const csv = 'name,code,districtCode,establishedYear\nNew,new,D,2000\nRace,FAIL,D,';
    const result = await importSchoolData(csv, 'schools', true);
    assert.equal(result.created, 1); assert.equal(result.failed, 1);
    assert.equal(saved[0].districtId, 'district-id'); assert.equal(saved[0].establishedYear, 2000);
    assert.equal(saved[0].code, 'NEW');
    const retry = await importSchoolData(csv, 'schools', true);
    assert.equal(retry.created, 0); assert.equal(saved.length, 1);
  });
});

test('district imports normalize codes and do not overwrite existing districts', async () => {
  const saved = [];
  await patched([
    [District, 'exists', async filter => filter.code.test('OLD') ? {} : null],
    [District, 'create', async payload => { saved.push(payload); return payload; }],
  ], async () => {
    const result = await importSchoolData('name,code\nNew District,d-1\nExisting,old', 'districts', true);
    assert.equal(result.created, 1); assert.equal(result.failed, 1);
    assert.equal(saved[0].code, 'D-1');
  });
});

test('HTTP import route denies anonymous, administrator and mobile accounts before database work', async () => {
  const express = require('express');
  const app = express(); app.use(express.json());
  app.use((req, _res, next) => {
    if (req.headers['x-test-role']) req.user = { role: req.headers['x-test-role'], type: req.headers['x-test-type'] };
    next();
  });
  app.use('/school', require('../src/routes/school.router').default);
  app.use((err, _req, res, _next) => res.status(err.statusCode || 500).json({ message: err.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    for (const [role, type, status] of [['', '', 401], ['administrator', '', 403], ['user', 'parent', 403], ['user', 'student', 403], ['user', 'teacher', 403], ['admin', '', 400]]) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/school/import`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-test-role': role, 'x-test-type': type }, body: JSON.stringify({ kind: 'invalid' }),
      });
      assert.equal(response.status, status, role + ':' + type);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});
