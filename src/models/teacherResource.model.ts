import { Schema, model } from 'mongoose';
import { mediaCleanupPlugin } from '../utils/mediaCleanup.plugin';

const schema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  homeworkId: { type: Schema.Types.ObjectId, ref: 'Homework', index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true, maxlength: 200 },
  file: { url: String, public_id: String, filename: String },
  link: { type: String, maxlength: 2000 },
}, { timestamps: true });
schema.plugin(mediaCleanupPlugin, { model: 'TeacherResource' });
export const TeacherResource = model('TeacherResource', schema);
