import AppError from '../errors/AppError';

export const normalizeAnswer = (value: unknown) => String(value ?? '').normalize('NFKC').trim();
export const scoreAnswers = (questions: any[], answers: any[]) => {
  if (!questions.length) throw new AppError(400, 'Assessment has no questions');
  if (new Set(questions.map(q => q.question)).size !== questions.length) throw new AppError(409, 'Assessment has duplicate question identifiers');
  const allowed = new Set(questions.map(q => q.question));
  if (answers.some(a => !allowed.has(a.question)) || new Set(answers.map(a => a.question)).size !== answers.length) throw new AppError(400, 'Invalid or duplicate submitted question');
  let score = 0;
  const graded = questions.map(question => {
    const selectedAnswer = normalizeAnswer(answers.find(a => a.question === question.question)?.selectedAnswer);
    if (selectedAnswer && !question.options.includes(selectedAnswer)) throw new AppError(400, 'Answer is not an available option');
    const isCorrect = selectedAnswer !== '' && selectedAnswer === normalizeAnswer(question.answer);
    if (isCorrect) score++;
    return { question: question.question, selectedAnswer, isCorrect };
  });
  return { answers: graded, score, percentage: Math.round(score / questions.length * 10000) / 100, totalQuestions: questions.length };
};

export const quizDeadline = (startedAt: Date, minutes: number) => new Date(startedAt.getTime() + minutes * 60_000);
export const remainingSeconds = (deadline: Date, now = new Date()) => Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 1000));
