import { Schema, model } from 'mongoose';
export const GuardianInvitation = model('GuardianInvitation', new Schema({
  childId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  codeHash: { type: String, unique: true, required: true, select: false },
  parentEmail: { type: String, required: true, lowercase: true, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true }, usedAt: Date,
  usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }));
