import AppError from '../errors/AppError';
import { Quiz } from '../models/quiz.model';
import { QuizQA } from '../models/quizQA.model';
import { QuizResult } from '../models/quizResult.model';
import { assertClass } from './access.service';
import { quizDeadline, remainingSeconds, scoreAnswers } from './scoring.service';

const assessment = async (actor: any, quizId: string) => {
  if (actor.type !== 'student') throw new AppError(403, 'A student account is required');
  const quiz = await Quiz.findById(quizId);
  if (!quiz || quiz.status !== 'published') throw new AppError(404, 'Published assessment not found');
  await assertClass(actor, quiz.classId);
  const qa = await QuizQA.findOne({ quizId });
  if (!qa?.questions.length) throw new AppError(400, 'Assessment has no questions');
  return { quiz, questions: qa.questions };
};
export const studentResult = (result: any) => {
  const released = result.gradeStatus === 'released';
  return {
    _id: result._id, quizId: result.quizId, sessionId: result.quizId, studentId: result.studentId,
    progress: result.progress, startedAt: result.startedAt, deadline: result.deadline,
    gradeStatus: result.gradeStatus ?? 'pending_review',
    score: released ? result.score : undefined, correctCount: released ? result.score : undefined,
    percentage: released ? result.percentage : undefined, totalQuestions: result.progress.totalQuestions,
    feedback: released ? result.feedback : '',
    answers: result.answers.map((a: any) => ({ question: a.question, selectedAnswer: a.selectedAnswer, ...(released ? { isCorrect: a.isCorrect } : {}) })),
  };
};
export const startAssessment = async (actor: any, quizId: string) => {
  const { quiz, questions } = await assessment(actor, quizId);
  const startedAt = new Date();
  const deadline = quizDeadline(startedAt, quiz.time);
  const result = await QuizResult.findOneAndUpdate({ quizId, studentId: actor._id }, { $setOnInsert: {
    quizId, studentId: actor._id, startedAt, deadline,
    questionSnapshot: questions.map(q => ({ question: q.question, options: q.options, answer: q.answer })),
    answers: questions.map(q => ({ question: q.question, selectedAnswer: '', isCorrect: null })),
    gradeStatus: 'pending_review', progress: { answeredCount: 0, totalQuestions: questions.length, remainingTime: quiz.time * 60, status: 'ongoing' },
  } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  return studentResult(result);
};
export const saveAssessment = async (actor: any, quizId: string, submitted: any[], submit = false) => {
  await assessment(actor, quizId);
  const result: any = await QuizResult.findOne({ quizId, studentId: actor._id }).select('+questionSnapshot');
  if (!result) throw new AppError(409, 'Start the assessment first');
  if (result.progress.status === 'completed') {
    if (submit) return studentResult(result);
    throw new AppError(409, 'Assessment is already submitted');
  }
  const deadline = result.deadline ?? quizDeadline(result.createdAt, (await Quiz.findById(quizId))!.time);
  if (!Array.isArray(submitted)) throw new AppError(400, 'Invalid answers');
  if (remainingSeconds(deadline) === 0) {
    if (!submit) throw new AppError(409, 'Assessment time has expired. Submit saved answers.');
    submitted = []; // After the fixed deadline, only previously saved responses can be submitted.
  }
  const qa = result.questionSnapshot?.length ? result.questionSnapshot : (await QuizQA.findOne({ quizId }))!.questions;
  const merged = result.answers.map((a: any) => ({ question: a.question, selectedAnswer: a.selectedAnswer }));
  if (!Array.isArray(submitted) || new Set(submitted.map(a => a.question)).size !== submitted.length) throw new AppError(400, 'Invalid answers');
  for (const answer of submitted) {
    const existing = merged.find((a: any) => a.question === answer.question);
    if (!existing) throw new AppError(400, 'Unknown question');
    existing.selectedAnswer = String(answer.selectedAnswer ?? '');
  }
  const graded = scoreAnswers(qa, merged);
  const progress = { ...result.toObject().progress, answeredCount: graded.answers.filter(a => a.selectedAnswer).length, totalQuestions: graded.totalQuestions, remainingTime: remainingSeconds(deadline), status: submit ? 'completed' : 'ongoing' };
  const update = submit ? { answers: graded.answers, score: graded.score, percentage: graded.percentage, progress, submittedAt: new Date() } : { answers: merged, progress };
  const saved = await QuizResult.findOneAndUpdate({ _id: result._id, 'progress.status': 'ongoing', updatedAt: result.updatedAt }, { $set: update }, { new: true });
  if (!saved) throw new AppError(409, 'Progress changed. Reload the assessment and retry.');
  return studentResult(saved);
};
