import { Document, Model, Types } from 'mongoose'

export interface IQuiz extends Document {
  classId: Types.ObjectId
  title: string
  image?: string
  time?: string
  created_at?: Date
  updated_at?: Date
}

export interface QuizModel extends Model<IQuiz> {
  findByTitle(title: string): Promise<IQuiz[]>
}
