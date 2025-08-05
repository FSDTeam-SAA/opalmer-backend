import { Document, Model, Types } from 'mongoose'

export interface IQuizQA extends Document {
  quizId: Types.ObjectId
  questions: string
  options: string[] 
  ans: string
  created_at?: Date
  updated_at?: Date
}

export interface QuizQAModel extends Model<IQuizQA> {
  findByQuiz(quizId: string): Promise<IQuizQA[]>
}
