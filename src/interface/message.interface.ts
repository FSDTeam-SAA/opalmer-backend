import { Document, Model, Types } from 'mongoose'

export interface IMessage extends Document {
  roomId: Types.ObjectId
  userId: Types.ObjectId
  message: string
  file: string[] 
  ans?: string
  created_at?: Date
  updated_at?: Date
}

export interface MessageModel extends Model<IMessage> {
  findByRoom(roomId: string): Promise<IMessage[]>
}
