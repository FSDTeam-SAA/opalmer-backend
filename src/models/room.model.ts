import mongoose, { Schema } from 'mongoose'
import { IRoom, RoomModel } from '../interface/room.interface'

const roomSchema: Schema<IRoom> = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    lastMessage: { type: String, default: '' },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

export const Room = mongoose.model<IRoom, RoomModel>('Room', roomSchema)
