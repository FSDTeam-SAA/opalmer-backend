const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test-only-secret-not-for-deployment';
process.env.OPENAI_API_KEY = 'test-only-key';
require('ts-node/register/transpile-only');
const { scoreAnswers, quizDeadline, remainingSeconds } = require('../src/services/scoring.service');
const { activeAccount, sameId, assertClass } = require('../src/services/access.service');
const { protect, protectChallenge } = require('../src/middlewares/auth.middleware');
const { User } = require('../src/models/user.model');
const { Class } = require('../src/models/class.model');
const { StuAssignToClass } = require('../src/models/stuAssignToClass.model');
const { resourceAccess } = require('../src/middlewares/resourceAccess.middleware');
const actor = { _id: '507f1f77bcf86cd799439011', schoolId: '507f1f77bcf86cd799439012', type: 'student', role: 'user', state: 'active', isActive: true, tokenVersion: 0 };
const run = (handler, req) => new Promise(resolve => handler(req, {}, resolve));

test('objective scoring preserves 8 of 10 = 80%', () => {
  const questions = Array.from({ length: 10 }, (_, i) => ({ question: `Question ${i}`, answer: 'A', options: ['A', 'B'] }));
  const answers = questions.map((q, i) => ({ question: q.question, selectedAnswer: i < 8 ? 'A' : 'B' }));
  const result = scoreAnswers(questions, answers);
  assert.equal(result.score, 8); assert.equal(result.percentage, 80);
  assert.equal(result.answers.filter(a => a.isCorrect).length, 8);
});
test('invalid options, duplicate questions and unknown responses are rejected', () => {
  const q = { question: 'Q', answer: 'A', options: ['A', 'B'] };
  assert.throws(() => scoreAnswers([q], [{ question: 'Q', selectedAnswer: 'C' }]));
  assert.throws(() => scoreAnswers([q, q], []));
  assert.throws(() => scoreAnswers([q], [{ question: 'Other', selectedAnswer: 'A' }]));
  assert.throws(() => scoreAnswers([], []));
  assert.equal(scoreAnswers([q], []).score, 0);
});
test('quiz time uses minutes and a fixed deadline', () => {
  const start = new Date('2026-01-01T00:00:00Z');
  const deadline = quizDeadline(start, 5);
  assert.equal(deadline.toISOString(), '2026-01-01T00:05:00.000Z');
  assert.equal(remainingSeconds(deadline, new Date('2026-01-01T00:01:00Z')), 240);
  assert.equal(remainingSeconds(deadline, new Date('2026-01-01T00:06:00Z')), 0);
});
test('both inactive flags and suspended state disable an account', () => {
  assert.equal(activeAccount(actor), true);
  assert.equal(activeAccount({ ...actor, state: 'inactive' }), false);
  assert.equal(activeAccount({ ...actor, state: 'suspended' }), false);
  assert.equal(activeAccount({ ...actor, isActive: false }), false);
  assert.equal(activeAccount(null), false);
  assert.equal(sameId(null, null), false);
});
test('2FA challenge cannot authorize a private API', async () => {
  const token = jwt.sign({ userId: actor._id, purpose: '2fa', tokenVersion: 0 }, process.env.JWT_SECRET);
  const error = await run(protect, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(error.statusCode, 401);
});
test('valid OTP challenge is restricted to challenge middleware and old token version is revoked', async () => {
  const original = User.findById;
  User.findById = async () => actor;
  try {
    const token = jwt.sign({ userId: actor._id, purpose: '2fa', tokenVersion: 0 }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    assert.equal(await run(protectChallenge, req), undefined);
    assert.equal(req.user._id, actor._id);
    const old = jwt.sign({ userId: actor._id, purpose: 'access', tokenVersion: 1 }, process.env.JWT_SECRET);
    assert.equal((await run(protect, { headers: { authorization: `Bearer ${old}` } })).statusCode, 401);
  } finally { User.findById = original; }
});
test('same-grade student without explicit enrollment is denied', async () => {
  const originals = [User.findById, Class.findById, StuAssignToClass.exists];
  Class.findById = async () => ({ _id: '507f1f77bcf86cd799439013', teacherId: '507f1f77bcf86cd799439014', grade: 6 });
  User.findById = () => ({ select: async () => ({ schoolId: actor.schoolId }) });
  StuAssignToClass.exists = async () => null;
  try { await assert.rejects(assertClass({ ...actor, gradeLevel: 6 }, '507f1f77bcf86cd799439013'), /enrollment/); }
  finally { [User.findById, Class.findById, StuAssignToClass.exists] = originals; }
});
test('legacy private routes reject anonymous requests before controller access', async () => {
  for (const module of ['notifications', 'classes', 'attendances', 'quizzes', 'grading', 'academicDocument', 'behavior', 'learning-tips']) {
    const req = { route: { path: '/' }, method: 'GET', headers: {}, params: {}, query: {} };
    const error = await run(resourceAccess(module), req);
    assert.equal(error.statusCode, 401, module);
  }
});

const { studentResult } = require('../src/services/assessment.service');
const { Homework } = require('../src/models/homework.model');
const { QuizResult } = require('../src/models/quizResult.model');
test('student payload hides correctness, score and feedback until teacher release', () => {
  const result = { _id: 'result', quizId: 'quiz', studentId: actor._id, gradeStatus: 'reviewed', score: 8, percentage: 80, feedback: 'Teacher feedback', progress: { totalQuestions: 10, status: 'completed' }, answers: [{ question: 'Q', selectedAnswer: 'A', isCorrect: true }] };
  const pending = studentResult(result);
  assert.equal(pending.score, undefined); assert.equal(pending.percentage, undefined);
  assert.equal(pending.answers[0].isCorrect, undefined); assert.equal(pending.feedback, '');
  const released = studentResult({ ...result, gradeStatus: 'released' });
  assert.equal(released.score, 8); assert.equal(released.percentage, 80);
  assert.equal(released.answers[0].isCorrect, true); assert.equal(released.feedback, 'Teacher feedback');
});
test('assessment snapshot is private and attempts are unique per student', () => {
  assert.equal(QuizResult.schema.path('questionSnapshot').options.select, false);
  assert.ok(QuizResult.schema.indexes().some(([fields, options]) => fields.quizId === 1 && fields.studentId === 1 && options.unique));
});
test('enrolled student can submit homework but cannot edit the assignment', async () => {
  const originals = [Homework.findById, User.findById, Class.findById, StuAssignToClass.exists];
  const classId = '507f1f77bcf86cd799439013';
  Homework.findById = async () => ({ _id: 'homework', classId, status: 'published', studentIds: [] });
  Class.findById = async () => ({ _id: classId, teacherId: '507f1f77bcf86cd799439014' });
  User.findById = () => ({ select: async () => ({ schoolId: actor.schoolId }) });
  StuAssignToClass.exists = async () => ({ _id: 'enrollment' });
  try {
    const req = { user: actor, headers: {}, method: 'POST', route: { path: '/:id/submission' }, params: { id: 'homework' }, query: {}, body: { response: 'My answer' } };
    assert.equal(await run(resourceAccess('homework'), req), undefined);
    const error = await run(resourceAccess('homework'), { ...req, method: 'PUT', route: { path: '/update/:id' } });
    assert.equal(error.statusCode, 403);
  } finally { [Homework.findById, User.findById, Class.findById, StuAssignToClass.exists] = originals; }
});
test('draft homework cannot be opened by a student with a known ID', async () => {
  const original = Homework.findById;
  Homework.findById = async () => ({ _id: 'homework', classId: '507f1f77bcf86cd799439013', status: 'draft' });
  try {
    const error = await run(resourceAccess('homework'), { user: actor, headers: {}, method: 'GET', route: { path: '/:id' }, params: { id: 'homework' }, query: {} });
    assert.equal(error.statusCode, 403);
  } finally { Homework.findById = original; }
});

const { policyHtml, policyType } = require('../src/services/policyContent.service');
test('policy content preserves formatting while removing unsafe HTML and links', () => {
  const html = policyHtml('<h2>Mission</h2><p class="ql-align-center"><strong>Learn</strong> <a href="javascript:alert(1)" onclick="alert(2)">link</a></p><script>alert(3)</script><img src=x onerror=alert(4)>');
  assert.match(html, /<h2>Mission<\/h2>/); assert.match(html, /<strong>Learn<\/strong>/); assert.match(html, /text-align:center/);
  assert.doesNotMatch(html, /script|onclick|onerror|javascript|<img/);
  assert.equal(policyHtml('First & second\nNext'), '<p>First &amp; second<br />Next</p>');
  assert.throws(() => policyHtml('<p><br></p>'), /Add content/);
  assert.throws(() => policyHtml('x'.repeat(100001)), /100,000/);
  assert.throws(() => policyType('faq'), /Choose/);
});
test('policy writes require the global admin while reads remain public', async () => {
  assert.equal(await run(resourceAccess('aboutAndTerm'), { method: 'GET', route: { path: '/about' }, headers: {}, params: {}, query: {} }), undefined);
  for (const role of ['user', 'administrator']) {
    const error = await run(resourceAccess('aboutAndTerm'), { user: { ...actor, role }, method: 'POST', route: { path: '/create' }, headers: {}, params: {}, query: {} });
    assert.equal(error.statusCode, 403);
  }
  assert.equal(await run(resourceAccess('aboutAndTerm'), { user: { ...actor, role: 'admin' }, method: 'POST', route: { path: '/create' }, headers: {}, params: {}, query: {} }), undefined);
});
test('CMS saves formatted content and serves the published document through its HTTP routes', async () => {
  const express = require('express');
  const model = require('../src/models/aboutAndTerm').default;
  const { aboutAndTermRouter } = require('../src/routes/aboutAndTerm.router');
  const originals = [model.findOneAndUpdate, model.findOne, model.findByIdAndUpdate, model.findById];
  let stored = null;
  model.findOneAndUpdate = async (query, update) => { stored = { _id: '507f1f77bcf86cd799439099', ...update.$set, updatedAt: new Date() }; return stored; };
  model.findOne = (query) => ({ sort: async () => stored?.docType === query.docType ? stored : null });
  model.findById = async () => stored;
  model.findByIdAndUpdate = async (id, update) => { stored = { ...stored, ...update.$set }; return stored; };
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.user = { ...actor, role: 'admin' }; next(); });
  app.use('/aboutAndTerm', aboutAndTermRouter);
  app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ message: error.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + '/aboutAndTerm';
  try {
    const created = await fetch(base + '/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docType: 'about', description: '<h2>Our school</h2><p><strong>Welcome</strong></p><script>bad()</script>', role: 'admin' }) });
    assert.equal(created.status, 200); assert.equal(stored.role, undefined);
    const read = await (await fetch(base + '/about')).json();
    assert.equal(read.data.length, 1); assert.equal(read.data[0].contentFormat, 'html'); assert.match(read.data[0].description, /<strong>Welcome/); assert.doesNotMatch(read.data[0].description, /script/);
    const terms = await (await fetch(base + '/terms')).json(); assert.deepEqual(terms.data, []);
    const updated = await fetch(base + '/update/' + stored._id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: '<p>Updated content</p>' }) });
    assert.equal(updated.status, 200); assert.equal(stored.description, '<p>Updated content</p>');
    const switchType = await fetch(base + '/update/' + stored._id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docType: 'terms', description: 'Invalid switch' }) }); assert.equal(switchType.status, 400);
  } finally { await new Promise(resolve => server.close(resolve)); [model.findOneAndUpdate, model.findOne, model.findByIdAndUpdate, model.findById] = originals; }
});
