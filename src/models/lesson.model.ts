import mongoose, { Schema } from 'mongoose'
import { ILesson, LessonModel } from '../interface/lesson.interface'

const lessonSchema: Schema<ILesson> = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    topic: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    task: { type: String, default: '' },
    document: { type: Number, default: 0 },
    archived: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

export const Lesson = mongoose.model<ILesson, LessonModel>(
  'Lesson',
  lessonSchema
)
