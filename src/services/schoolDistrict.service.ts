import { createHash } from 'crypto';
import { Types } from 'mongoose';
import AppError from '../errors/AppError';
import { District } from '../models/district.model';

export async function resolveSchoolDistrict(payload: Record<string, any>) {
  if (payload.districtName !== undefined) {
    if (typeof payload.districtName !== 'string' || !payload.districtName.trim() || payload.districtName.trim().length > 120) {
      throw new AppError(400, 'Enter a district name between 1 and 120 characters');
    }
    if (payload.districtId) throw new AppError(400, 'Choose an existing district or enter a new district name');
    const name = payload.districtName.trim().replace(/\s+/g, ' ');
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let district = await District.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' } });
    if (!district) {
      const code = `DIST-${createHash('sha256').update(name.toLowerCase()).digest('hex').slice(0, 16).toUpperCase()}`;
      try {
        district = await District.findOneAndUpdate({ code }, { $setOnInsert: { name, code } }, { upsert: true, new: true, runValidators: true });
      } catch (error: any) {
        if (error.code !== 11000) throw error;
        district = await District.findOne({ code });
        if (!district) throw error;
      }
    }
    payload.districtId = district!._id;
    delete payload.districtName;
  } else if (payload.districtId !== undefined) {
    if (payload.districtId === '') payload.districtId = null;
    else if (typeof payload.districtId !== 'string' || !Types.ObjectId.isValid(payload.districtId) || !await District.exists({ _id: payload.districtId })) {
      throw new AppError(400, 'Choose a valid district');
    }
  }
}
