import mongoose, { Schema } from 'mongoose'
import {
  ILearningTip,
  LearningTipModel,
} from '../interface/learningTip.interface'

const learningTipSchema: Schema<ILearningTip> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    img: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

export const LearningTip = mongoose.model<ILearningTip, LearningTipModel>(
  'LearningTip',
  learningTipSchema
)
