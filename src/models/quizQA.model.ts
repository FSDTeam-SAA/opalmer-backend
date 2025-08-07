import mongoose, { Schema } from 'mongoose'
import { IQuizQA, QuizQAModel } from '../interface/quizQA.interface'

const quizQASchema: Schema<IQuizQA> = new Schema(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    questions: { type: String, required: true },
    options: { type: [String], required: true }, 
    ans: { type: String, required: true }, 
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

export const QuizQA = mongoose.model<IQuizQA, QuizQAModel>(
  'QuizQA',
  quizQASchema
)
