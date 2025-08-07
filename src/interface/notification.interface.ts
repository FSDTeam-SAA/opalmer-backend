import { Document, Model, Types } from 'mongoose'

export interface INotification extends Document {
  to: Types.ObjectId
  message: string
  isViewed: boolean
  type: string
  created_at?: Date
  updated_at?: Date
}

export interface NotificationModel extends Model<INotification> {
  markAsViewed(id: string): Promise<INotification | null>
}
