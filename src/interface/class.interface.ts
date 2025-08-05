import { Document, Model } from 'mongoose'

export interface IClass extends Document {
  grade: string
  subject: string
  section: string
  schedule: string
  teacherName: string
  created_at?: Date
  updated_at?: Date
}

// Static methods interface
export interface ClassModel extends Model<IClass> {
  findByGrade(grade: string): Promise<IClass[]>
}
