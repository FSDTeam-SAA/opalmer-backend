import { Document, Model, Types } from 'mongoose'

export interface IBehavior extends Document {
  teacherId: Types.ObjectId
  studentId: Types.ObjectId
  message: string
  tags?: string[]
  points?: number
  severity?: "normal" | "urgent"
  parentVisible?: boolean
  classId?: Types.ObjectId
  state: 'positive' | 'negative' | 'neutral' | 'corrective'
  created_at?: Date
  updated_at?: Date
}

export interface BehaviorModel extends Model<IBehavior> {
  findByStudent(studentId: string): Promise<IBehavior[]>
  findByTeacher(teacherId: string): Promise<IBehavior[]>
}
