import mongoose from 'mongoose'

export interface IGroup {
  classId: mongoose.Types.ObjectId
  teacherId: mongoose.Types.ObjectId
  title: string
  studentIds: mongoose.Types.ObjectId[] // array of student IDs
  createdAt?: Date
  updatedAt?: Date
}