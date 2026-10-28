const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const { User } = require('../src/models/user.model');
const { Class } = require('../src/models/class.model');
const { StuAssignToClass } = require('../src/models/stuAssignToClass.model');
const { ParentsChild } = require('../src/models/parentsChild.model');
const { Attendance } = require('../src/models/attendance.model');
const { assertUser, assertClass } = require('../src/services/access.service');
const { getClassAttendanceStats } = require('../src/controllers/attendance.controller');
const school = '507f1f77bcf86cd799439001', classId = '507f1f77bcf86cd799439002', studentId = '507f1f77bcf86cd799439003', teacherId = '507f1f77bcf86cd799439004';
async function patched(entries, fn) {
  const originals = entries.map(([obj, key]) => obj[key]);
  entries.forEach(([obj, key, value]) => { obj[key] = value; });
  try { await fn(); } finally { entries.forEach(([obj, key], i) => { obj[key] = originals[i]; }); }
}

test('students cannot probe another account and teachers lose student/class access when assignment is removed', async () => {
  const student = { _id: studentId, type: 'student', role: 'user', schoolId: school };
  const teacher = { _id: teacherId, type: 'teacher', role: 'user', schoolId: school };
  let assigned = true;
  await patched([
    [User, 'findById', id => { assert.equal(String(id), studentId); return student; }],
    [Class, 'find', () => ({ distinct: async () => assigned ? [classId] : [] })],
    [StuAssignToClass, 'exists', async filter => filter.classId.$in.length ? {} : null],
  ], async () => {
    await assert.rejects(assertUser(student, teacherId), error => error.statusCode === 403);
    assert.equal(await assertUser(student, studentId), student);
    assert.equal(await assertUser(teacher, studentId), student);
    assigned = false;
    await assert.rejects(assertUser(teacher, studentId), error => error.statusCode === 403);
  });
  await patched([
    [Class, 'findById', async () => ({ _id: classId, teacherId: studentId })],
    [User, 'findById', () => ({ select: async () => ({ schoolId: school }) })],
  ], async () => { await assert.rejects(assertClass(teacher, classId), error => error.statusCode === 403); });
});

test('class attendance summary scopes parent and student counts to their visible records', async () => {
  for (const type of ['parent', 'student']) {
    const filters = [];
    const actor = { _id: type === 'student' ? studentId : teacherId, type, role: 'user' };
    await patched([
      [Class, 'findById', async () => ({ _id: classId })],
      [ParentsChild, 'find', () => ({ distinct: async () => [studentId] })],
      [StuAssignToClass, 'countDocuments', async filter => { assert.deepEqual(filter.studentId.$in, [studentId]); return 1; }],
      [Attendance, 'distinct', async (_field, filter) => { filters.push(filter); return [new Date()]; }],
      [Attendance, 'countDocuments', async filter => { filters.push(filter); return 1; }],
    ], async () => {
      let body, error;
      await getClassAttendanceStats({ user: actor, params: { classId }, query: {} }, { status() { return this; }, json(value) { body = value; } }, err => { error = err; });
      assert.equal(error, undefined); assert.equal(body.data.percentage, 100); assert.equal(body.data.studentCount, 1);
      for (const filter of filters) assert.deepEqual(filter.userId.$in, [studentId]);
    });
  }
});
