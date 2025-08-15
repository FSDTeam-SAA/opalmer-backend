import { Model, Types } from 'mongoose'

export interface IQuiz {
  _id?: Types.ObjectId
  teacherId: Types.ObjectId // reference to User
  classId: Types.ObjectId // reference to Class
  title: string
  description?: string
  image?: string
  time?: number // in minutes
  created_at?: Date
  updated_at?: Date
}

// Static methods interface
export interface QuizModel extends Model<IQuiz> {
  findByTitle(title: string): Promise<IQuiz[]>
}
