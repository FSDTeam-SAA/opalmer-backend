import mongoose, { Schema } from 'mongoose'
import {
  INotification,
  NotificationModel,
} from '../interface/notification.interface'

const notificationSchema: Schema<INotification> = new Schema(
  {
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    isViewed: { type: Boolean, default: false },
    type: { type: String, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

export const Notification = mongoose.model<INotification, NotificationModel>(
  'Notification',
  notificationSchema
)
