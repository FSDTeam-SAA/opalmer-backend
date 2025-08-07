import { Document, Model, Types } from 'mongoose'

export interface IAttendance extends Document {
  classId: Types.ObjectId
  userId: Types.ObjectId[]
  present: boolean
  created_at?: Date
  updated_at?: Date
}

export interface AttendanceModel extends Model<IAttendance> {
  markPresent(classId: string, userIds: string[]): Promise<IAttendance | null>
}
