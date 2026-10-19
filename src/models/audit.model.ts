import { Schema, model } from 'mongoose';
export const Audit = model('Audit', new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', index: true },
  action: { type: String, required: true }, resource: String,
  studentId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  detail: Schema.Types.Mixed,
}, { timestamps: true }));
