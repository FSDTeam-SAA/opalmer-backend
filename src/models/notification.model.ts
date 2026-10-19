import mongoose, { Schema, Model } from 'mongoose'
import { INotification } from '../interface/notification.interface'

const notificationSchema: Schema<INotification> = new Schema(
  {
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    eventKey: { type: String },
    deliveryStatus: { type: String, enum: ['pending', 'delivered', 'failed', 'in_app'], default: 'pending' },
    deliveryError: String,
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now },
    claimedAt: Date,
    deliveredAt: Date,
    isViewed: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      required: true,
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
)

notificationSchema.index({ eventKey: 1 }, { unique: true, sparse: true });

export const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  notificationSchema
)
