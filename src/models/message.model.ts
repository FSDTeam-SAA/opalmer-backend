import mongoose, { Schema } from 'mongoose'
import { IMessage, MessageModel } from '../interface/message.interface'

const messageSchema: Schema<IMessage> = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, default: '' },
    file: { type: [String], default: [] }, 
    ans: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

export const Message = mongoose.model<IMessage, MessageModel>(
  'Message',
  messageSchema
)
