import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import { Quiz } from '../models/quiz.model';
import { QuizResult } from '../models/quizResult.model';
import { Audit } from '../models/audit.model';
import { assertClass } from '../services/access.service';
import { notifyStudentFamily } from '../sockets/notification.service';

const resultForTeacher = async (actor: any, id: string) => {
  const result = await QuizResult.findById(id).populate('studentId', 'username Id avatar gradeLevel');
  if (!result) throw new AppError(404, 'Result not found');
  const quiz = await Quiz.findById(result.quizId);
  if (!quiz) throw new AppError(404, 'Assessment not found');
  await assertClass(actor, quiz.classId, true);
  if (result.progress.status !== 'completed') throw new AppError(409, 'Student has not submitted yet');
  return { result, quiz };
};
export const gradeDetail = catchAsync(async (req, res) => {
  const { result, quiz } = await resultForTeacher(req.user, req.params.resultId);
  res.json({ success: true, data: { result, quiz } });
});
export const reviewGrade = catchAsync(async (req, res) => {
  const { result, quiz } = await resultForTeacher(req.user, req.params.resultId);
  const score = Number(req.body.score ?? result.score);
  const total = result.progress.totalQuestions ?? result.answers.length;
  if (!Number.isFinite(score) || score < 0 || score > total) throw new AppError(400, 'Score is outside the available points');
  const reason = String(req.body.reason ?? '').trim();
  if (score !== result.score && reason.length < 3) throw new AppError(400, 'Explain the reason for overriding the grade');
  const entry = { actorId: req.user!._id, date: new Date(), previousScore: result.score, score, reason };
  const updated = await QuizResult.findOneAndUpdate({ _id: result._id, updatedAt: result.updatedAt }, { $set: {
    score, percentage: Math.round(score / total * 10000) / 100,
    gradeStatus: 'reviewed', feedback: String(req.body.feedback ?? '').slice(0, 5000), reviewedBy: req.user!._id,
  }, $push: { history: entry } }, { new: true });
  if (!updated) throw new AppError(409, 'Grade changed. Reload and review again.');
  await Audit.create({ actorId: req.user!._id, schoolId: req.user!.schoolId, action: 'grade.review', resource: String(result._id), studentId: result.studentId._id, detail: { ...entry, quizId: quiz._id } });
  res.json({ success: true, data: updated });
});
export const releaseGrade = catchAsync(async (req, res) => {
  const { result, quiz } = await resultForTeacher(req.user, req.params.resultId);
  if (result.gradeStatus !== 'reviewed' && result.gradeStatus !== 'released') throw new AppError(409, 'Review the grade before publishing it');
  const updated = result.gradeStatus === 'released' ? result : await QuizResult.findOneAndUpdate({ _id: result._id, gradeStatus: 'reviewed', updatedAt: result.updatedAt }, { gradeStatus: 'released', releasedAt: new Date() }, { new: true });
  if (!updated) throw new AppError(409, 'Grade changed. Reload and retry.');
  await notifyStudentFamily({ studentId: result.studentId._id, classId: quiz.classId, type: 'grade', id: result._id, message: `A grade for ${quiz.title} has been published.`, notifyStudent: req.body.notifyStudent !== false, notifyParent: req.body.notifyParent !== false, eventKey: `grade:${result._id}:${updated.updatedAt?.toISOString()}` });
  await Audit.create({ actorId: req.user!._id, schoolId: req.user!.schoolId, action: 'grade.release', resource: String(result._id), studentId: result.studentId._id });
  res.json({ success: true, data: updated });
});
