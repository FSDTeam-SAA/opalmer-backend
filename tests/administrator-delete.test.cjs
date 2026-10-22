const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const { User } = require('../src/models/user.model');
const school = require('../src/models/school.model').default;
const { deleteAdministrator } = require('../src/controllers/administrator.controller');

async function invoke(role, id) {
  let failure, response;
  const res = { status() { return this; }, json(value) { response = value; } };
  await deleteAdministrator({ user: { role }, params: { id } }, res, error => { failure = error; });
  return { failure, response };
}

test('administrator deletion enforces admin role, validates IDs and targets only administrators', async () => {
  assert.equal((await invoke('administrator', '507f1f77bcf86cd799439011')).failure.statusCode, 403);
  assert.equal((await invoke('admin', 'invalid')).failure.statusCode, 400);
  const original = User.findOne;
  try {
    User.findOne = async query => { assert.equal(query.role, 'administrator'); return null; };
    assert.equal((await invoke('admin', '507f1f77bcf86cd799439011')).failure.statusCode, 404);
  } finally { User.findOne = original; }
});

test('deleting an administrator releases its school assignment and deletes the account', async () => {
  const originals = [User.findOne, User.findOneAndDelete, school.updateMany];
  const id = '507f1f77bcf86cd799439011';
  const actions = [];
  try {
    User.findOne = async () => ({ _id: id });
    school.updateMany = async (query, update) => { actions.push('unassign'); assert.deepEqual(query, { administrator: id }); assert.deepEqual(update, { $unset: { administrator: '' } }); };
    User.findOneAndDelete = async query => { actions.push('delete'); assert.deepEqual(query, { _id: id, role: 'administrator' }); return { _id: id }; };
    const result = await invoke('admin', id);
    assert.equal(result.failure, undefined);
    assert.equal(result.response.success, true);
    assert.deepEqual(actions, ['unassign', 'delete']);
  } finally { [User.findOne, User.findOneAndDelete, school.updateMany] = originals; }
});
