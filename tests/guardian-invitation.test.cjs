const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
require('ts-node/register/transpile-only');
const { User } = require('../src/models/user.model');
const { GuardianInvitation } = require('../src/models/guardianInvitation.model');
const mail = require('../src/utils/sendEmail');
const { inviteGuardian } = require('../src/controllers/guardianInvitation.controller');

const schoolId = '507f1f77bcf86cd799439010';
const actor = { _id: '507f1f77bcf86cd799439011', role: 'administrator', schoolId };
const child = { _id: '507f1f77bcf86cd799439012', username: 'Child <example>', Id: 'student-1', type: 'student', schoolId };
const parent = { _id: '507f1f77bcf86cd799439013', username: 'Parent', email: 'Guardian@Example.com', type: 'parent', state: 'active', isActive: true, schoolId };

async function fixture(overrides, check) {
  const originals = { findById: User.findById, create: GuardianInvitation.create, deleteOne: GuardianInvitation.deleteOne, sendEmail: mail.default };
  const calls = {};
  const selectedParent = { ...parent, ...overrides.parent };
  User.findById = async id => String(id) === child._id ? child : String(id) === parent._id ? selectedParent : null;
  GuardianInvitation.create = async data => { calls.record = data; return { ...data, _id: 'invitation-1' }; };
  GuardianInvitation.deleteOne = async filter => { calls.deleted = filter; return { deletedCount: 1 }; };
  mail.default = async message => { calls.mail = message; if (overrides.failEmail) throw new Error('SMTP unavailable'); };
  try {
    const req = { user: actor, body: { childId: child._id, parentId: parent._id, parentEmail: 'untrusted@example.com' } };
    const res = { status(code) { calls.status = code; return this; }, json(body) { calls.response = body; } };
    await inviteGuardian(req, res, error => { calls.error = error; });
    await check(calls);
  } finally {
    User.findById = originals.findById;
    GuardianInvitation.create = originals.create;
    GuardianInvitation.deleteOne = originals.deleteOne;
    mail.default = originals.sendEmail;
  }
}

test('invitation is emailed to the selected parent with student ID, single-use code and app instructions', async () => {
  await fixture({}, calls => {
    assert.equal(calls.error, undefined);
    assert.equal(calls.status, 201);
    assert.equal(calls.mail.to, 'guardian@example.com');
    assert.equal(calls.response.data.emailSent, true);
    assert.equal(calls.record.parentEmail, calls.mail.to);
    assert.match(calls.mail.html, /student-1/);
    assert.match(calls.mail.html, /Child &lt;example&gt;/);
    assert.match(calls.mail.html, /Link child/);
    assert.match(calls.mail.html, /72 hours/);
    const { code, expiresAt } = calls.response.data;
    assert.match(code, /^[A-F0-9]{12}$/);
    assert.ok(calls.mail.html.includes(code));
    assert.equal(calls.record.codeHash, crypto.createHash('sha256').update(code).digest('hex'));
    assert.equal(calls.record.code, undefined);
    assert.ok(expiresAt.getTime() > Date.now() + 71 * 60 * 60_000);
  });
});

test('SMTP failure removes the invitation and returns a retryable error instead of success', async () => {
  await fixture({ failEmail: true }, calls => {
    assert.equal(calls.error.statusCode, 503);
    assert.equal(calls.status, undefined);
    assert.deepEqual(calls.deleted, { _id: 'invitation-1', usedAt: { $exists: false } });
  });
});

test('parents outside the administrator school cannot receive an invitation', async () => {
  await fixture({ parent: { schoolId: '507f1f77bcf86cd799439099' } }, calls => {
    assert.equal(calls.error.statusCode, 403);
    assert.equal(calls.record, undefined);
    assert.equal(calls.mail, undefined);
  });
});

for (const [name, changes] of [['missing email', { email: '' }], ['inactive account', { isActive: false }], ['wrong user type', { type: 'teacher' }]]) {
  test(`selected parent with ${name} is rejected before email is sent`, async () => {
    await fixture({ parent: changes }, calls => {
      assert.equal(calls.error.statusCode, 400);
      assert.equal(calls.record, undefined);
      assert.equal(calls.mail, undefined);
    });
  });
}
