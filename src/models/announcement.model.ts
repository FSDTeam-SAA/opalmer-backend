import { Schema, model } from 'mongoose';

const schema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  title: { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 10000 },
  notifyStudent: { type: Boolean, default: true },
  notifyParent: { type: Boolean, default: true },
  deliveryStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
}, { timestamps: true });
export const Announcement = model('Announcement', schema);
