import mongoose, { Schema } from 'mongoose'
import { IQuizResult } from '../interface/quizResult.interface'

const quizResultSchema = new Schema<IQuizResult>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [
      {
        question: { type: String, required: true },
        selectedAnswer: { type: String, default: '' }, // empty if unanswered
        isCorrect: { type: Boolean, default: null }, // null until completed
      },
    ],
    progress: {
      answeredCount: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      remainingTime: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['ongoing', 'completed'],
        default: 'ongoing',
      },
    },
    startedAt: { type: Date },
    deadline: { type: Date },
    submittedAt: { type: Date },
    questionSnapshot: { type: [Schema.Types.Mixed], select: false },
    gradeStatus: { type: String, enum: ['pending_review', 'reviewed', 'released'], default: 'pending_review' },
    feedback: { type: String, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    releasedAt: { type: Date },
    history: { type: [Schema.Types.Mixed], default: [] },
    score: { type: Number, default: 0 }, // correct answers count
    percentage: { type: Number, default: 0 },
  },
  { timestamps: true }
)

quizResultSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export const QuizResult = mongoose.model(
  'QuizResult',
  quizResultSchema
)
