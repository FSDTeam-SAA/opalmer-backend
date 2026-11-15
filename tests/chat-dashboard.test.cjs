const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const { authorizeTypes } = require('../src/middlewares/auth.middleware');
const { Room } = require('../src/models/room.model');
const { getRoomsByUserId } = require('../src/controllers/room.controller');
const { getMessagesByRoom } = require('../src/controllers/message.controllers');
const { User } = require('../src/models/user.model');
const { getContacts } = require('../src/controllers/user.controller');
const { resourceAccess } = require('../src/middlewares/resourceAccess.middleware');
const { Notification } = require('../src/models/notification.model');
const { notificationDestination } = require('../src/controllers/notificationDestination.controller');
const administratorId = '507f1f77bcf86cd799439011';
const roomId = '507f1f77bcf86cd799439012';

test('each administrator can only list and mark their own notifications, including in the same school', async () => {
  const otherId = '507f1f77bcf86cd799439099';
  for (const actorId of [administratorId, otherId]) {
    for (const method of ['GET', 'PATCH']) {
      for (const targetId of [administratorId, otherId]) {
        let error;
        await resourceAccess('notifications')({ user: { _id: actorId, role: 'administrator', schoolId: roomId }, method, route: { path: method === 'GET' ? '/:userId' : '/read/:userId' }, params: { userId: targetId }, query: {} }, {}, value => { error = value; });
        assert.equal(error?.statusCode, actorId === targetId ? undefined : 403);
      }
    }
  }
});

test('administrator cannot open or mark a notification addressed to another administrator', async () => {
  const originals = [Notification.findById, Notification.findOne];
  try {
    Notification.findById = async () => ({ to: '507f1f77bcf86cd799439099' });
    let error;
    await resourceAccess('notifications')({ user: { _id: administratorId, role: 'administrator' }, method: 'PATCH', route: { path: '/:notificationId/read' }, params: { notificationId: roomId }, query: {} }, {}, value => { error = value; });
    assert.equal(error.statusCode, 403);
    Notification.findOne = async filter => {
      assert.deepEqual(filter, { _id: roomId, to: administratorId });
      return null;
    };
    await notificationDestination({ user: { _id: administratorId, role: 'administrator' }, params: { notificationId: roomId } }, {}, value => { error = value; });
    assert.equal(error.statusCode, 404);
  } finally { [Notification.findById, Notification.findOne] = originals; }
});

test('dashboard contacts search all schools for admin and enforce school scope for administrator', async () => {
  const originals = [User.findById, User.find, User.countDocuments];
  try {
    for (const role of ['admin', 'administrator']) {
      const actor = { _id: administratorId, role, schoolId: '507f1f77bcf86cd799439099' };
      User.findById = async () => actor;
      let filter, offset, body;
      const chain = { select: () => chain, sort: () => chain, skip: value => { offset = value; return chain; }, limit: async () => [{ _id: roomId, username: 'Parent', Id: 'P-1', role: 'user', type: 'parent' }] };
      User.find = value => { filter = value; return chain; };
      User.countDocuments = async () => 65;
      let error;
      await getContacts({ user: actor, query: { search: 'a.*', role: 'parent', page: '2', limit: '30', schoolId: 'untrusted' } }, { status() { return this; }, json(value) { body = value; } }, value => { error = value; });
      assert.equal(error, undefined);
      assert.equal(filter.$and[0].isActive, true);
      assert.equal(filter.$and[0].state, 'active');
      assert.deepEqual(filter.$and.find(item => item.schoolId), role === 'administrator' ? { schoolId: actor.schoolId } : undefined);
      assert.ok(filter.$and.some(item => item.role === 'user' && item.type === 'parent'));
      const search = filter.$and.find(item => item.$or?.[0]?.username);
      assert.equal(search.$or[0].username.$regex, 'a\\.\\*');
      assert.equal(offset, 30);
      assert.equal(body.meta.totalPages, 3);
      assert.equal(body.data[0].Id, 'P-1');
    }
    User.findById = async () => ({ _id: administratorId, role: 'administrator' });
    let error;
    await getContacts({ user: { _id: administratorId }, query: {} }, {}, value => { error = value; });
    assert.equal(error.statusCode, 403);
  } finally { [User.findById, User.find, User.countDocuments] = originals; }
});

test('administrator accounts can use messaging routes without a mobile user type', () => {
  let error;
  authorizeTypes('teacher', 'parent', 'student')({user:{role:'administrator'}}, {}, value => {error = value;});
  assert.equal(error, undefined);
});

test('inbox uses authenticated administrator identity and ignores a supplied other user ID', async () => {
  const original = Room.find;
  let filter, output;
  Room.find = value => {
    filter = value;
    const chain = { populate: () => chain, sort: async () => [] };
    return chain;
  };
  try {
    await getRoomsByUserId({user:{_id:administratorId,role:'administrator'},query:{userId:'another-user'}}, {status: () => ({json: value => {output=value;}})}, error => {throw error;});
    assert.deepEqual(filter, {'participants.userId':administratorId});
    assert.deepEqual(output.data, []);
  } finally { Room.find = original; }
});

test('administrator cannot read a room they do not participate in', async () => {
  const original = Room.findById;
  Room.findById = async () => ({participants:[{userId:'507f1f77bcf86cd799439099'}]});
  let error;
  try {
    await getMessagesByRoom({user:{_id:administratorId,role:'administrator'},params:{roomId},query:{}}, {}, value => {error=value;});
    assert.equal(error.statusCode, 403);
    assert.match(error.message, /not a participant/);
  } finally { Room.findById = original; }
});
