import { Document, Model, Types } from 'mongoose'

interface IParticipant {
  userId: Types.ObjectId
}
export interface IRoom extends Document {
  name?: string
  avatar?: string
  lastMessage?: string
  isBlocked: boolean
  created_at?: Date
  updated_at?: Date
  participants: IParticipant[]
}

export interface RoomModel extends Model<IRoom> {
  findByTeacher(teacherId: string): Promise<IRoom[]>
  findByStudent(studentId: string): Promise<IRoom[]>
}
