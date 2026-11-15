const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const { District } = require('../src/models/district.model');
const { resolveSchoolDistrict } = require('../src/services/schoolDistrict.service');

test('typed district names reuse existing districts or create one with an automatic code', async () => {
  const originals = [District.findOne, District.findOneAndUpdate];
  try {
    let query;
    District.findOne = async value => { query = value; return { _id: 'existing' }; };
    const existing = { districtName: '  Dhaka  ' };
    await resolveSchoolDistrict(existing);
    assert.deepEqual(existing, { districtId: 'existing' });
    assert.equal(query.name.$regex, '^Dhaka$');
    assert.equal(query.name.$options, 'i');
    District.findOne = async () => null;
    let code;
    District.findOneAndUpdate = async (filter, update, options) => {
      assert.match(filter.code, /^DIST-[A-F0-9]{16}$/);
      assert.equal(update.$setOnInsert.name, 'North District');
      assert.equal(options.upsert, true);
      if (code) assert.equal(filter.code, code);
      code = filter.code;
      return { _id: 'created' };
    };
    for (const name of [' North   District ', 'North District']) {
      const payload = { districtName: name };
      await resolveSchoolDistrict(payload);
      assert.deepEqual(payload, { districtId: 'created' });
    }
    for (const districtName of ['', ' ', {}, 'x'.repeat(121)]) {
      await assert.rejects(resolveSchoolDistrict({ districtName }), error => error.statusCode === 400);
    }
    await assert.rejects(resolveSchoolDistrict({ districtId: 'existing', districtName: 'Dhaka' }), error => error.statusCode === 400);
    const blank = { districtId: '' };
    await resolveSchoolDistrict(blank);
    assert.equal(blank.districtId, null);
  } finally { [District.findOne, District.findOneAndUpdate] = originals; }
});
