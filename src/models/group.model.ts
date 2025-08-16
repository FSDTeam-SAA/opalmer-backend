import mongoose, { Schema } from 'mongoose'
import { IGroup } from '../interface/group'

const groupSchema = new Schema<IGroup>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  },
  { timestamps: true }
)

export const Group = mongoose.model<IGroup>('Group', groupSchema)