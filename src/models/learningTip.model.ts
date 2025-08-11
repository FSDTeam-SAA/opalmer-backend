import mongoose, { Schema } from 'mongoose'
import {
  ILearningTip,
  LearningTipModel,
} from '../interface/learningTip.interface'

const learningTipSchema: Schema<ILearningTip> = new Schema(
  {
    administratorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    img: [{ type: String }],
    title: { type: String, required: true },
    description: { type: String },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)
export const LearningTip = mongoose.model<ILearningTip, LearningTipModel>(
  'LearningTip',
  learningTipSchema
)
