import { Document, Model, Types } from 'mongoose'

export interface ILearningTip extends Document {
  administratorId: Types.ObjectId
  img: string[]
  title: string
  description?: string
  schoolId: Types.ObjectId
  created_at?: Date
  updated_at?: Date
}


export interface LearningTipModel extends Model<ILearningTip> {
  findByUser(userId: string): Promise<ILearningTip[]>
}
