import { Document, Model, Types } from 'mongoose'

export interface IRoom extends Document {
  teacherId: Types.ObjectId
  studentId: Types.ObjectId
  parentId: Types.ObjectId
  lastMessage?: string
  isBlocked: boolean
  created_at?: Date
  updated_at?: Date
}

export interface RoomModel extends Model<IRoom> {
  findByTeacher(teacherId: string): Promise<IRoom[]>
  findByStudent(studentId: string): Promise<IRoom[]>
}
