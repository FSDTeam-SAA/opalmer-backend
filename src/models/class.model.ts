import mongoose, { Schema } from 'mongoose'
import { IClass, ClassModel } from '../interfaces/class.interface'

const classSchema: Schema<IClass> = new Schema(
  {
    grade: { type: String, required: true },
    subject: { type: String, required: true },
    section: { type: String, required: true },
    schedule: { type: String, required: true },
    teacherName: { type: String, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

// Static method example
classSchema.statics.findByGrade = async function (grade: string) {
  return await this.find({ grade })
}

export const Class = mongoose.model<IClass, ClassModel>('Class', classSchema)
