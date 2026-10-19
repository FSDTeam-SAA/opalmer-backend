import mongoose, { Document } from 'mongoose'

export interface INotification extends Document {
  to: mongoose.Types.ObjectId
  message: string
  isViewed: boolean
  type: string
  id: mongoose.Types.ObjectId
  studentId?: mongoose.Types.ObjectId
  classId?: mongoose.Types.ObjectId
  eventKey?: string
  deliveryStatus?: string
  deliveryError?: string
  attempts?: number
  nextAttemptAt?: Date
  claimedAt?: Date
  deliveredAt?: Date
}
