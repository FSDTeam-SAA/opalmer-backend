import { mediaCleanupPlugin } from '../utils/mediaCleanup.plugin';
import { Schema, model } from 'mongoose';
const schema = new Schema({
  homeworkId: { type: Schema.Types.ObjectId, ref: 'Homework', required: true, index: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  response: { type: String, default: '', maxlength: 50000 },
  files: [{ url: String, public_id: String, filename: String }],
  status: { type: String, enum: ['draft', 'submitted', 'reviewed', 'released'], default: 'draft' },
  submittedAt: Date, reviewedAt: Date, releasedAt: Date,
  score: { type: Number, min: 0 }, feedback: String,
  history: { type: [Schema.Types.Mixed], default: [] },
}, { timestamps: true });
schema.index({ homeworkId: 1, studentId: 1 }, { unique: true });
schema.plugin(mediaCleanupPlugin, { model: 'Submission' });

export const Submission = model('Submission', schema);
