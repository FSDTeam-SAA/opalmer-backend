import { Document, Model } from 'mongoose'

export interface IQuiz extends Document {
  title: string
  image?: string
  created_at?: Date
  updated_at?: Date
}

export interface QuizModel extends Model<IQuiz> {
  findByTitle(title: string): Promise<IQuiz[]>
}
