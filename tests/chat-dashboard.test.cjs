const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const { authorizeTypes } = require('../src/middlewares/auth.middleware');
const { Room } = require('../src/models/room.model');
const { getRoomsByUserId } = require('../src/controllers/room.controller');
const { getMessagesByRoom } = require('../src/controllers/message.controllers');
const administratorId = '507f1f77bcf86cd799439011';
const roomId = '507f1f77bcf86cd799439012';

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
