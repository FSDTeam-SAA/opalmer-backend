import { model, Schema } from 'mongoose';

export const District = model('District', new Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true, unique: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
}, { timestamps: true }));
