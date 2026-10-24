const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const { MulterError } = require('multer');
const { globalErrorHandler } = require('../src/middlewares/globalErrorHandler');
const { User } = require('../src/models/user.model');
const { Class } = require('../src/models/class.model');
const { Homework } = require('../src/models/homework.model');
const { Lesson } = require('../src/models/lesson.model');
const { StuAssignToClass } = require('../src/models/stuAssignToClass.model');
const { ParentsChild } = require('../src/models/parentsChild.model');
const { TeacherResource } = require('../src/models/teacherResource.model');
const { Announcement } = require('../src/models/announcement.model');
const tools = require('../src/controllers/teacherTools.controller');
const cloud = require('../src/utils/cloudinary');
const notifications = require('../src/sockets/notification.service');
const { createLesson } = require('../src/controllers/lesson.controller').default;

const ids = {
  teacher: '507f1f77bcf86cd799439011', school: '507f1f77bcf86cd799439012',
  class: '507f1f77bcf86cd799439013', student: '507f1f77bcf86cd799439014',
  homework: '507f1f77bcf86cd799439015', other: '507f1f77bcf86cd799439016',
};
const actor = { _id: ids.teacher, type: 'teacher', role: 'user', schoolId: ids.school };
const classRow = { _id: ids.class, teacherId: ids.teacher };
async function invoke(handler, req) {
  let error, body, status = 200;
  const res = { status(value) { status = value; return this; }, json(value) { body = value; return this; } };
  await handler({ query: {}, params: {}, body: {}, user: actor, ...req }, res, value => { error = value; });
  return { error, body, status };
}
function patch(object, key, value, restores) {
  const original = object[key]; object[key] = value; restores.push(() => { object[key] = original; });
}
function staffFixtures(restores) {
  patch(User, 'findById', () => ({ select: async () => ({ schoolId: ids.school }) }), restores);
  patch(Class, 'findById', async () => classRow, restores);
}

test('file size errors are actionable 413 responses and unexpected fields are 400', () => {
  for (const [code, expected] of [['LIMIT_FILE_SIZE', 413], ['LIMIT_UNEXPECTED_FILE', 400]]) {
    let status, body;
    globalErrorHandler(new MulterError(code, 'file'), {}, { status(value) { status = value; return this; }, json(value) { body = value; } }, () => {});
    assert.equal(status, expected);
    assert.equal(body.success, false);
    assert.equal(body.errorSources[0].path, 'file');
  }
});

test('resource links reject script/data URLs, credentials and overlong input', () => {
  assert.equal(tools.safeResourceLink('https://example.com/help'), 'https://example.com/help');
  for (const value of ['javascript:alert(1)', 'data:text/html,hello', 'https://user:pass@example.com', 'x'.repeat(2001)]) {
    assert.throws(() => tools.safeResourceLink(value), error => error.statusCode === 400);
  }
});

test('failed lesson attachment upload never creates a lesson or returns success', async () => {
  const restores = []; let creates = 0;
  try {
    patch(User, 'findById', async () => actor, restores);
    patch(Class, 'findById', async () => classRow, restores);
    patch(cloud, 'uploadToCloudinary', async () => null, restores);
    patch(Lesson, 'create', async () => { creates++; }, restores);
    const result = await invoke(createLesson, { body: { classId: ids.class, title: 'Lesson' }, file: { path: '/fixture.pdf' } });
    assert.equal(result.error.statusCode, 502);
    assert.equal(creates, 0);
    assert.equal(result.body, undefined);
  } finally { restores.reverse().forEach(restore => restore()); }
});

test('homework help rejects another class and unenrolled/untargeted students before uploading', async () => {
  const restores = []; let uploads = 0;
  try {
    staffFixtures(restores);
    patch(cloud, 'uploadToCloudinary', async () => { uploads++; }, restores);
    patch(Homework, 'findById', async () => ({ _id: ids.homework, classId: ids.other, status: 'published' }), restores);
    let result = await invoke(tools.createResource, { body: { classId: ids.class, homeworkId: ids.homework, title: 'Help' }, file: { path: '/fixture.pdf' } });
    assert.equal(result.error.statusCode, 400);
    Homework.findById = async () => ({ _id: ids.homework, classId: ids.class, status: 'published', studentIds: [ids.other] });
    patch(StuAssignToClass, 'exists', async () => null, restores);
    result = await invoke(tools.createResource, { body: { classId: ids.class, homeworkId: ids.homework, studentId: ids.student, title: 'Help' }, file: { path: '/fixture.pdf' } });
    assert.equal(result.error.statusCode, 403);
    StuAssignToClass.exists = async () => ({ _id: 'enrollment' });
    result = await invoke(tools.createResource, { body: { classId: ids.class, homeworkId: ids.homework, studentId: ids.student, title: 'Help' }, file: { path: '/fixture.pdf' } });
    assert.equal(result.error.statusCode, 400);
    assert.equal(uploads, 0);
  } finally { restores.reverse().forEach(restore => restore()); }
});

test('student-specific help saves assignment context and only notifies the selected family', async () => {
  const restores = []; let saved, event;
  try {
    staffFixtures(restores);
    patch(Homework, 'findById', async () => ({ _id: ids.homework, classId: ids.class, status: 'published', title: 'Fractions', studentIds: [] }), restores);
    patch(StuAssignToClass, 'exists', async () => ({ _id: 'enrolled' }), restores);
    patch(TeacherResource, 'create', async row => { saved = row; return { ...row, _id: 'resource' }; }, restores);
    patch(notifications, 'notifyStudentFamily', async value => { event = value; }, restores);
    const result = await invoke(tools.createResource, { body: { classId: ids.class, homeworkId: ids.homework, studentId: ids.student, title: 'Example', link: 'https://example.com/help', notifyStudent: 'false', notifyParent: 'true' } });
    assert.equal(result.status, 201);
    assert.equal(saved.homeworkId, ids.homework);
    assert.equal(saved.studentId, ids.student);
    assert.equal(event.studentId, ids.student);
    assert.equal(event.notifyStudent, false);
    assert.equal(event.notifyParent, true);
    assert.equal(event.id, ids.homework);
  } finally { restores.reverse().forEach(restore => restore()); }
});

test('parent help queries contain only class resources and help for their enrolled child', async () => {
  const restores = []; let query;
  try {
    patch(Homework, 'findById', async () => ({ _id: ids.homework, classId: ids.class, status: 'published', studentIds: [] }), restores);
    patch(Class, 'findById', async () => classRow, restores);
    patch(ParentsChild, 'find', () => ({ distinct: async () => [ids.student] }), restores);
    patch(StuAssignToClass, 'exists', async () => ({ _id: 'enrolled' }), restores);
    patch(StuAssignToClass, 'find', () => ({ distinct: async () => [ids.student] }), restores);
    patch(TeacherResource, 'find', value => { query = value; return { sort() { return this; }, lean: async () => [] }; }, restores);
    let result = await invoke(tools.listHomeworkHelp, { user: { _id: ids.other, type: 'parent' }, params: { homeworkId: ids.homework }, query: { studentId: ids.student } });
    assert.equal(result.error, undefined);
    assert.deepEqual(query.$or, [{ studentId: null }, { studentId: { $in: [ids.student] } }]);
    result = await invoke(tools.listHomeworkHelp, { user: { _id: ids.other, type: 'parent' }, params: { homeworkId: ids.homework }, query: { studentId: ids.teacher } });
    assert.equal(result.error.statusCode, 403);
  } finally { restores.reverse().forEach(restore => restore()); }
});

test('announcements persist delivery failure and retry with the same deduplication key', async () => {
  const restores = []; const keys = []; let record;
  try {
    staffFixtures(restores);
    patch(Announcement, 'create', async value => { record = { ...value, _id: ids.homework, async save() {} }; return record; }, restores);
    patch(notifications, 'notifyClass', async event => { keys.push(event.eventKey); throw new Error('offline'); }, restores);
    let result = await invoke(tools.createAnnouncement, { body: { classId: ids.class, title: 'Update', message: 'Class tomorrow', notifyStudent: true, notifyParent: false } });
    assert.equal(result.status, 201);
    assert.equal(record.deliveryStatus, 'failed');
    assert.ok(result.body.notificationWarning);
    patch(Announcement, 'findOne', async () => record, restores);
    notifications.notifyClass = async event => { keys.push(event.eventKey); };
    result = await invoke(tools.retryAnnouncement, { params: { id: ids.homework } });
    assert.equal(result.error, undefined);
    assert.equal(record.deliveryStatus, 'sent');
    assert.equal(keys[0], keys[1]);
  } finally { restores.reverse().forEach(restore => restore()); }
});
