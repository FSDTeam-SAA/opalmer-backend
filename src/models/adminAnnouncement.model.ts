import { Schema, model } from 'mongoose';

export const AdminAnnouncement = model('AdminAnnouncement', new Schema({
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 10000 },
  audiences: [{ type: String, enum: ['parent', 'student', 'teacher'], required: true }],
  // Snapshot the intended recipients. Retries keep the same audience and event key.
  recipientIds: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], select: false },
  recipientCount: { type: Number, required: true },
  deliveryStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
}, { timestamps: true }));
