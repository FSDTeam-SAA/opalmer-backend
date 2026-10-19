import { Router } from 'express';
import { protect, authorizeTypes } from '../middlewares/auth.middleware';
import catchAsync from '../utils/catchAsync';
import AppError from '../errors/AppError';
import { assertClass, assertUser } from '../services/access.service';
import { Class } from '../models/class.model';
import { Quiz } from '../models/quiz.model';
import { QuizQA } from '../models/quizQA.model';
import { QuizResult } from '../models/quizResult.model';
import { Attendance } from '../models/attendance.model';
import { StuAssignToClass } from '../models/stuAssignToClass.model';
import { User } from '../models/user.model';

const router = Router();
router.use(protect, authorizeTypes('teacher'));
const colors = ['red', 'yellow', 'green', 'teal', 'blue', 'amber'];

router.get('/teachers/:teacherId', catchAsync(async (req, res) => {
  const teacher = await assertUser(req.user, req.params.teacherId);
  if (teacher.type !== 'teacher') throw new AppError(404, 'Teacher not found');
  const classes = await Class.find({ teacherId: teacher._id });
  const grades = await Promise.all(classes.map(async (cls, index) => {
    const [students, attendance, quizzes] = await Promise.all([
      StuAssignToClass.countDocuments({ classId: cls._id }), Attendance.find({ classId: cls._id }), Quiz.find({ classId: cls._id }).distinct('_id'),
    ]);
    const results = await QuizResult.find({ quizId: { $in: quizzes }, gradeStatus: 'released', 'progress.status': 'completed' });
    const avg = results.length ? results.reduce((sum, r) => sum + (r.percentage ?? 0), 0) / results.length : null;
    const counted = attendance.filter(a => a.status.toLowerCase() !== 'holiday');
    const rate = counted.length ? counted.filter(a => a.status.toLowerCase() === 'present').length / counted.length * 100 : null;
    return { id: String(cls._id), name: `Grade ${cls.grade} ${cls.subject}`, subject: cls.subject, date: cls.get('created_at'), students, attendance: rate === null ? '' : `${Math.round(rate)}%`, performance: avg === null ? '' : `${Math.round(avg)}%`, color: colors[index % colors.length] };
  }));
  const quizzes = await Quiz.find({ teacherId: teacher._id });
  res.json({ success: true, data: {
    id: String(teacher._id), name: teacher.username, username: teacher.Id, email: teacher.email ?? '', image: teacher.avatar?.url ?? '', active: teacher.state === 'active', subjects: [...new Set(classes.map(c => c.subject))], grades,
    quizzes: await Promise.all(quizzes.map(async q => ({ id: String(q._id), title: q.title, questions: (await QuizQA.findOne({ quizId: q._id }))?.questions.length ?? 0, duration: `${q.time} min`, image: q.image ?? '' }))),
  } });
}));
router.get('/quizzes/:quizId/students', catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId);
  if (!quiz) throw new AppError(404, 'Assessment not found');
  await assertClass(req.user, quiz.classId, true);
  const results = await QuizResult.find({ quizId: quiz._id, 'progress.status': 'completed' }).populate('studentId', 'username Id gradeLevel age avatar');
  res.json({ success: true, data: results.map((r: any, index) => ({ id: String(r.studentId._id), resultId: String(r._id), name: r.studentId.username, studentId: r.studentId.Id, grade: `Grade ${r.studentId.gradeLevel ?? ''}`, age: r.studentId.age, startProgress: 0, endProgress: r.percentage, image: r.studentId.avatar?.url ?? '', color: colors[index % colors.length] })) });
}));
router.get('/quizzes/:quizId/students/:studentId', catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId);
  if (!quiz) throw new AppError(404, 'Assessment not found');
  await assertClass(req.user, quiz.classId, true);
  await assertUser(req.user, req.params.studentId);
  const result: any = await QuizResult.findOne({ quizId: quiz._id, studentId: req.params.studentId }).select('+questionSnapshot').populate('studentId', 'username Id gradeLevel age avatar phoneNumber');
  if (!result) throw new AppError(404, 'Submission not found');
  const questions = result.questionSnapshot?.length ? result.questionSnapshot : (await QuizQA.findOne({ quizId: quiz._id }))?.questions ?? [];
  res.json({ success: true, data: { resultId: result._id, gradeStatus: result.gradeStatus, feedback: result.feedback, student: { id: String(result.studentId._id), name: result.studentId.username, studentId: result.studentId.Id, grade: `Grade ${result.studentId.gradeLevel ?? ''}`, age: result.studentId.age, phone: result.studentId.phoneNumber ?? '', image: result.studentId.avatar?.url ?? '' }, totalQuestions: result.progress.totalQuestions, correctAnswers: result.score, progress: result.percentage, questions: result.answers.map((a: any, index: number) => ({ id: index, question: a.question, selectedAnswer: a.selectedAnswer, correctAnswer: questions.find((q: any) => q.question === a.question)?.answer ?? '', options: questions.find((q: any) => q.question === a.question)?.options ?? [], isCorrect: a.isCorrect })) } });
}));
export default router;
