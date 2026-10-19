import mongoose, { Schema } from 'mongoose'
import {
  IParentsChild,
  ParentsChildModel,
} from '../interface/parentsChild.interface'

const parentsChildSchema = new Schema<IParentsChild>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

parentsChildSchema.index({ parentId: 1, childId: 1 }, { unique: true });

export const ParentsChild = mongoose.model<IParentsChild, ParentsChildModel>(
  'ParentsChild',
  parentsChildSchema
)
