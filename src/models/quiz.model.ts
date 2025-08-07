import mongoose, { Schema } from 'mongoose'
import { IQuiz, QuizModel } from '../interface/quiz.interface'

const quizSchema: Schema<IQuiz> = new Schema(
  {
    title: { type: String, required: true },
    image: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

// Static method: Find quizzes by title
quizSchema.statics.findByTitle = async function (title: string) {
  return await this.find({ title: { $regex: title, $options: 'i' } })
}

export const Quiz = mongoose.model<IQuiz, QuizModel>('Quiz', quizSchema)
