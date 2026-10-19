import catchAsync from '../utils/catchAsync';
import { startAssessment, saveAssessment, studentResult } from '../services/assessment.service';
import { QuizResult } from '../models/quizResult.model';
import { assertUser, isAdministrator } from '../services/access.service';

export const startQuiz = catchAsync(async (req, res) => { res.json({ success: true, data: await startAssessment(req.user, req.body.quizId) }); });
export const saveQuizProgress = catchAsync(async (req, res) => { res.json({ success: true, data: await saveAssessment(req.user, req.body.quizId, [{ question: req.body.question, selectedAnswer: req.body.selectedAnswer }]) }); });
export const submitQuiz = catchAsync(async (req, res) => { res.json({ success: true, data: await saveAssessment(req.user, req.body.quizId, req.body.answers ?? [], true) }); });
export const getQuizAnswersByStudent = catchAsync(async (req, res) => {
 await assertUser(req.user, req.params.studentId);
 const results = await QuizResult.find({ studentId: req.params.studentId }).populate('quizId', 'title classId time').sort({ createdAt: -1 });
 res.json({ success: true, data: isAdministrator(req.user) || req.user?.type === 'teacher' ? results : results.filter(r => r.gradeStatus === 'released').map(studentResult) });
});
