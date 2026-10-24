import { Schema, model } from 'mongoose';

// Confidential staff reports never share a collection with student behavior.
export const TeacherBehaviorReport = model('TeacherBehaviorReport', new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 10000 },
  occurredOn: { type: Date, required: true },
  severity: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
}, { timestamps: true }));
