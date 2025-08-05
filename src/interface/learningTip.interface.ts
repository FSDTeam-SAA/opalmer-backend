import { Document, Model, Types } from 'mongoose'

export interface ILearningTip extends Document {
  userId: Types.ObjectId
  img: string
  name: string
  created_at?: Date
  updated_at?: Date
}

export interface LearningTipModel extends Model<ILearningTip> {
  findByUser(userId: string): Promise<ILearningTip[]>
}
