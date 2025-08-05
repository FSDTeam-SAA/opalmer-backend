import mongoose, { Schema } from 'mongoose'
import { IClass, ClassModel } from '../interface/class.interface'

const classSchema: Schema<IClass> = new Schema(
  {
    grade: { type: String, required: true },
    subject: { type: String, required: true },
    section: { type: String },
    schedule: { type: String },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

export const Class = mongoose.model<IClass, ClassModel>('Class', classSchema)
