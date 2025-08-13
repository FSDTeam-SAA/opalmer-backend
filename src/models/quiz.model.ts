import mongoose, { Schema } from 'mongoose'
import { IQuiz, QuizModel } from '../interface/quiz.interface'

const quizSchema: Schema<IQuiz> = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // who created it
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    time: { type: Number, default: 0 }, // in minutes
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

quizSchema.statics.findByTitle = async function (title: string) {
  return await this.find({ title: { $regex: title, $options: 'i' } })
}

export const Quiz = mongoose.model<IQuiz, QuizModel>('Quiz', quizSchema)
