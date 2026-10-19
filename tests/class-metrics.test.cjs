const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const { summarizePerformance, analysisRange } = require('../src/services/classMetrics.service');

test('performance distinguishes missing grades from real zero and averages valid results only', () => {
  const data = summarizePerformance([
    {studentId:'a',percentage:0}, {studentId:'a',percentage:80},
    {studentId:'b',percentage:100}, {studentId:'c',percentage:null},
    {studentId:'c',percentage:NaN}, {studentId:'c',percentage:101},
  ]);
  assert.deepEqual(data.get('a'), {percentage:40,resultCount:2,totalPercentage:80});
  assert.equal(data.get('b').percentage, 100);
  assert.equal(data.has('c'), false);
  assert.equal(summarizePerformance([]).size, 0);
});

test('day, week and month use actual date boundaries and reject unknown filters', () => {
  const now = new Date('2026-10-19T10:00:00Z');
  const day = analysisRange('daily', now);
  assert.equal(day.start.toISOString(), '2026-10-19T00:00:00.000Z');
  assert.equal(day.buckets.length, 1);
  const week = analysisRange('week', now);
  assert.equal(week.start.toISOString(), '2026-10-13T00:00:00.000Z');
  assert.equal(week.buckets.length, 7);
  const month = analysisRange('month', now);
  assert.equal(month.start.toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(month.buckets.length, 19);
  assert.equal(month.end.getTime(), now.getTime());
  assert.throws(() => analysisRange('invalid'), /Choose day/);
});

test('analysis scopes reviewed scores to the enrolled student and class and keeps missing days null', async () => {
  const { Attendance } = require('../src/models/attendance.model');
  const { Quiz } = require('../src/models/quiz.model');
  const { QuizResult } = require('../src/models/quizResult.model');
  const { StuAssignToClass } = require('../src/models/stuAssignToClass.model');
  const { getSingleStudentAnalysisController } = require('../src/controllers/analysis.controller');
  const originals = [Attendance.find, Quiz.find, QuizResult.find, StuAssignToClass.exists];
  let query;
  StuAssignToClass.exists = async () => true;
  Quiz.find = () => ({ distinct: async () => ['class-quiz'] });
  Attendance.find = () => ({ lean: async () => [] });
  QuizResult.find = q => { query = q; return { select: () => ({ lean: async () => [
    {percentage: 0, submittedAt: new Date()}, {percentage: 100, submittedAt: new Date()},
  ] }) }; };
  let output;
  try {
    await getSingleStudentAnalysisController({params:{classId:'class-a',studentId:'student-a'},query:{filter:'weekly'},user:{type:'teacher'}}, {json: value => {output = value.data;}}, error => {throw error;});
    assert.equal(query.studentId, 'student-a');
    assert.deepEqual(query.quizId, {$in:['class-quiz']});
    assert.deepEqual(query.gradeStatus, {$in:['reviewed','released']});
    assert.equal(query['progress.status'], 'completed');
    assert.equal(output.performanceSummary.percentage, 50);
    assert.equal(output.performanceSummary.resultCount, 2);
    assert.equal(output.performanceChartData.filter(point => point.percentage === null).length, 6);
    assert.equal(output.summary.percentage, null);
  } finally {
    [Attendance.find, Quiz.find, QuizResult.find, StuAssignToClass.exists] = originals;
  }
});
