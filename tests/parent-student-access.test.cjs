const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
require('ts-node/register/transpile-only');
const { User } = require('../src/models/user.model');
const { ParentsChild } = require('../src/models/parentsChild.model');
const { GuardianInvitation } = require('../src/models/guardianInvitation.model');
const { StuAssignToClass } = require('../src/models/stuAssignToClass.model');
const { Homework } = require('../src/models/homework.model');
const { GroupWork } = require('../src/models/groupWork.model');
const { Lesson } = require('../src/models/lesson.model');
const { Notification } = require('../src/models/notification.model');
const { assertUser } = require('../src/services/access.service');
const { resourceAccess } = require('../src/middlewares/resourceAccess.middleware');
const { createParentsChild } = require('../src/controllers/parentsChild.controller');
const { getHomeworkByClass } = require('../src/controllers/homeWork.controller');
const { getGroupWorkByClass } = require('../src/controllers/groupWork.controller');
const lessons = require('../src/controllers/lesson.controller').default;
const { getUserNotifications } = require('../src/controllers/notification.controller');
const { notificationDestination } = require('../src/controllers/notificationDestination.controller');
const { getContacts } = require('../src/controllers/user.controller');
const parent = { _id: '507f1f77bcf86cd799439001', type: 'parent', role: 'user', email: 'maya.parent@example.com', isActive: true, schoolId: '507f1f77bcf86cd799439002' };
const maya = { _id: '507f1f77bcf86cd799439003', Id: '6812047', username: 'Maya Thompson', type: 'student', isActive: true, schoolId: parent.schoolId };
const jordan = { ...maya, _id: '507f1f77bcf86cd799439004', Id: '6729463', username: 'Jordan Williams' };
const classId = '507f1f77bcf86cd799439005';
async function patched(entries, fn) {
  const originals = entries.map(([obj, key]) => obj[key]);
  entries.forEach(([obj, key, value]) => { obj[key] = value; });
  try { await fn(); } finally { entries.forEach(([obj, key], i) => { obj[key] = originals[i]; }); }
}
async function invoke(handler, overrides = {}) {
  const req = { user: parent, headers: {}, method: 'GET', params: {}, query: {}, body: {}, route: { path: '/' }, ...overrides };
  const result = {};
  const res = { status(n) { result.status = n; return this; }, json(body) { result.body = body; return this; } };
  await handler(req, res, error => { result.error = error; });
  return result;
}

test('actual HTTP routes deny Maya parent access to Jordan across all student record modules', async () => {
  await patched([
    [ParentsChild, 'exists', async () => null],
    [User, 'findById', async () => { throw Error('Student data must remain unread'); }],
  ], async () => {
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => { req.user = parent; next(); });
    app.use(require('../src/routes').default);
    app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ message: error.message }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
      const base = 'http://127.0.0.1:' + server.address().port;
      for (const path of [
        `/users/${jordan._id}`, `/users/${jordan.Id}`, `/users/search-student?Id=${jordan.Id}`,
        `/classes/student/${jordan._id}`, `/attendances/student?userId=${jordan._id}&classId=${classId}`,
        `/behavior/student-behaviors?childId=${jordan._id}`,
        `/academicDocument/child-documents?childId=${jordan._id}`,
        `/academicDocument/child-documents?childsid=${jordan._id}`,
        `/academicDocument/child-documents?childsId=${jordan._id}`,
        `/academicDocument/child-documents?studentId=${jordan._id}`,
        `/grading/child-progress?childId=${jordan._id}`,
        `/grading/child-progress?childsId=${jordan._id}`,
        `/grading/child-progress?studentId=${jordan._id}`,
        `/homework/class/${classId}?childId=${jordan._id}`,
        `/group-work/class/${classId}?childId=${jordan._id}`,
        `/lessons/class/${classId}?childId=${jordan._id}`,
        `/test/quizzes/answers/${jordan._id}`,
      ]) {
        const response = await fetch(base + path);
        const payload = await response.json();
        assert.equal(response.status, 403, path);
        assert.equal(payload.data, undefined);
        assert.doesNotMatch(JSON.stringify(payload), /Jordan|Williams|6729463/);
      }
    } finally { await new Promise(resolve => server.close(resolve)); }
  });
});

test('Maya parent receives Access Denied with zero student data for Jordan, nonexistent IDs and changed request IDs', async () => {
  await patched([
    [ParentsChild, 'exists', async ({ childId }) => String(childId) === maya._id ? {} : null],
    [User, 'findById', async () => { throw Error('Unauthorized student must not be looked up'); }],
  ], async () => {
    for (const id of [jordan._id, jordan.Id, '507f1f77bcf86cd799439099']) {
      await assert.rejects(assertUser(parent, id), error => error.statusCode === 403);
    }
    for (const module of ['grading', 'classes', 'attendances', 'behavior', 'academicDocument', 'homework', 'lessons', 'test/quizzes']) {
      const result = await invoke(resourceAccess(module), { params: { studentId: jordan._id } });
      assert.equal(result.error?.statusCode, 403, module);
      assert.equal(result.body, undefined);
    }
    for (const location of ['params', 'query', 'body']) {
      const result = await invoke(resourceAccess('attendances'), { [location]: { studentId: jordan._id } });
      assert.equal(result.error?.statusCode, 403);
    }
    const lookup = await invoke(resourceAccess('users'), { route: { path: '/search-student' } });
    assert.equal(lookup.error?.statusCode, 403);
  });
});

test('selected child scopes homework, group members and lessons even when a parent has two children in one class', async () => {
  const filters = {};
  const chain = key => filter => {
    filters[key] = filter;
    const query = { populate(options) { if (key === 'group') filters.members = options; return this; }, sort() { return this; }, then(resolve) { return Promise.resolve([]).then(resolve); } };
    return query;
  };
  await patched([
    [ParentsChild, 'exists', async () => ({})],
    [ParentsChild, 'find', () => ({ distinct: async () => [maya._id, jordan._id] })],
    [User, 'findById', async id => id === maya._id ? maya : jordan],
    [StuAssignToClass, 'exists', async () => ({})],
    [Homework, 'find', chain('homework')], [GroupWork, 'find', chain('group')], [Lesson, 'find', chain('lessons')],
  ], async () => {
    for (const handler of [getHomeworkByClass, getGroupWorkByClass, lessons.getLessonsByClass]) {
      const result = await invoke(handler, { params: { classId }, query: { childId: maya._id } });
      assert.equal(result.error, undefined);
      assert.equal(result.body.success, true);
    }
    assert.deepEqual(filters.homework.$or.at(-1).studentIds.$in, [maya._id]);
    assert.deepEqual(filters.group.userId.$in, [maya._id]);
    assert.deepEqual(filters.members.match._id.$in, [maya._id]);
    assert.deepEqual(filters.lessons.$or[0].studentId.$in, [maya._id]);
    assert.ok(filters.homework.status.$ne === 'draft');
  });
});

test('unlinked child and linked child in an unrelated class are denied before lists are queried', async () => {
  await patched([
    [ParentsChild, 'exists', async ({ childId }) => childId === maya._id ? {} : null],
    [User, 'findById', async () => maya],
    [StuAssignToClass, 'exists', async () => null],
  ], async () => {
    for (const childId of [maya._id, jordan._id, { $ne: null }]) {
      for (const handler of [getHomeworkByClass, getGroupWorkByClass, lessons.getLessonsByClass]) {
        const result = await invoke(handler, { params: { classId }, query: { childId } });
        assert.equal(result.error?.statusCode, 403);
        assert.equal(result.body, undefined);
      }
    }
  });
});

test('linking requires a matching, unused, unexpired invitation for the signed-in parent email', async () => {
  const code = 'ABC123DEF456';
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  for (const scenario of ['valid', 'missing', 'wrong', 'expired', 'used', 'other-email', 'unknown-student', 'inactive-student', 'other-school']) {
    let created = false;
    await patched([
      [User, 'findOne', async () => scenario === 'unknown-student' ? null : maya],
      [User, 'findById', id => ({ select: async () => id === parent._id ? parent : { ...maya, isActive: scenario !== 'inactive-student', schoolId: scenario === 'other-school' ? jordan._id : parent.schoolId } })],
      [ParentsChild, 'findOne', async () => null],
      [GuardianInvitation, 'findOneAndUpdate', async filter => {
        const invitation = { childId: maya._id, codeHash: hash, parentEmail: scenario === 'other-email' ? 'someone@example.com' : parent.email, expiresAt: new Date(Date.now() + (scenario === 'expired' ? -1000 : 10000)), usedAt: scenario === 'used' ? new Date() : undefined };
        return String(filter.childId) === invitation.childId && filter.codeHash === invitation.codeHash && filter.parentEmail === invitation.parentEmail && invitation.expiresAt > filter.expiresAt.$gt && filter.usedAt.$exists === false && !invitation.usedAt ? invitation : null;
      }],
      [ParentsChild, 'findOneAndUpdate', async () => { created = true; return { parentId: parent._id, childId: maya._id }; }],
    ], async () => {
      const result = await invoke(createParentsChild, { method: 'POST', body: { childId: maya.Id, invitationCode: scenario === 'missing' ? undefined : scenario === 'wrong' ? 'wrong' : code } });
      assert.equal(created, scenario === 'valid', scenario);
      if (scenario === 'valid') assert.equal(result.status, 201);
      else { assert.equal(result.error?.statusCode, 403, scenario); assert.equal(result.error.message, 'Unable to link student. Check your student ID and school invitation.'); assert.equal(result.body, undefined); }
    });
  }
});

test('unlinking removes student notifications from lists and denies existing notification destinations', async () => {
  let linked = true;
  let filter;
  await patched([
    [ParentsChild, 'exists', async () => linked ? {} : null],
    [ParentsChild, 'find', () => ({ distinct: async () => linked ? [maya._id] : [] })],
    [User, 'findById', async () => maya],
    [Notification, 'find', query => { filter = query; return { limit() { return this; }, sort: async () => [] }; }],
    [Notification, 'findOne', async () => ({ to: parent._id, studentId: maya._id, type: 'grade', id: maya._id })],
  ], async () => {
    await assertUser(parent, maya._id);
    linked = false;
    await assert.rejects(assertUser(parent, maya._id), error => error.statusCode === 403);
    await invoke(getUserNotifications, { params: { userId: parent._id } });
    assert.deepEqual(filter.$or[0].studentId.$in, []);
    const result = await invoke(notificationDestination, { params: { notificationId: maya._id } });
    assert.equal(result.error?.statusCode, 403);
    assert.equal(result.body, undefined);
  });
});

test('parent call contacts never query a general student directory', async () => {
  let query;
  await patched([
    [User, 'findById', async () => parent],
    [ParentsChild, 'find', () => ({ select: async () => [{ childId: maya._id }] })],
    [StuAssignToClass, 'find', () => ({ select: async () => [] })],
    [require('../src/models/class.model').Class, 'find', () => ({ select: async () => [] })],
    [User, 'find', filter => { query = filter; return { select() { return this; }, limit: async () => [] }; }],
  ], async () => {
    const result = await invoke(getContacts, { query: { mode: 'call' } });
    assert.equal(result.error, undefined);
    assert.deepEqual(query.$or, [{ _id: { $in: [] }, type: 'teacher' }, { role: 'administrator' }]);
  });
});

test('class attendance and document endpoints cannot return classmates to a parent', async () => {
  const { Attendance } = require('../src/models/attendance.model');
  const AcademicDocument = require('../src/models/academicDocument.model').default;
  const documents = require('../src/controllers/academicDocument.controller').default;
  const { getAllAttendance } = require('../src/controllers/attendance.controller');
  const filters = {};
  await patched([
    [ParentsChild, 'exists', async () => ({})],
    [User, 'findById', async () => maya],
    [StuAssignToClass, 'exists', async () => ({})],
    [Attendance, 'find', async query => { filters.attendance = query; return []; }],
    [AcademicDocument, 'find', query => {
      filters.documents = query;
      return { populate() { return this; }, then(resolve) { return Promise.resolve([]).then(resolve); } };
    }],
  ], async () => {
    const attendance = await invoke(getAllAttendance, { query: { classId, childId: maya._id } });
    const result = await invoke(documents.getDocumentByClass, { params: { classId }, query: { childId: maya._id } });
    assert.equal(attendance.error, undefined);
    assert.equal(result.error, undefined);
    assert.deepEqual(filters.attendance.userId.$in, [maya._id]);
    assert.deepEqual(filters.documents.studentId.$in, [maya._id]);
  });
});

test('new notifications are not stored or emitted for an unlinked student', async () => {
  const { createNotification } = require('../src/sockets/notification.service');
  await patched([
    [User, 'findById', () => ({ select: async () => ({ ...parent, state: 'active' }) })],
    [ParentsChild, 'exists', async () => null],
    [Notification, 'create', async () => { throw Error('Unlinked notification must not be created'); }],
  ], async () => {
    assert.equal(await createNotification({ to: parent._id, studentId: jordan._id, message: 'Private student update', type: 'attendance', id: jordan._id }), null);
  });
});

test('beta roster contains the ten supplied unique Grade 6 students', () => {
  const { betaStudents } = require('../src/data/betaStudents');
  assert.equal(betaStudents.length, 10);
  assert.equal(new Set(betaStudents.map(student => student.Id)).size, 10);
  assert.equal(betaStudents.find(student => student.Id === '6812047').username, 'Maya Thompson');
  assert.equal(betaStudents.find(student => student.Id === '6729463').username, 'Jordan Williams');
  assert.ok(betaStudents.every(student => student.gradeLevel === 6 && /^\d{7}$/.test(student.Id)));
});
