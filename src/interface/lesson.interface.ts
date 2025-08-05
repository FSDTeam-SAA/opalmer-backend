import { Document, Model, Types } from 'mongoose'

export interface ILesson extends Document {
  classId: Types.ObjectId
  topic: number
  title: string
  description: string
  task?: string
  document?: number
  archived: boolean
  created_at?: Date
  updated_at?: Date
}

export interface LessonModel extends Model<ILesson> {
  findByClass(classId: string): Promise<ILesson[]>
}
