import crypto from 'node:crypto';
import { User } from '../models/user.model';
import { Types } from 'mongoose';
import catchAsync from '../utils/catchAsync';
import AppError from '../errors/AppError';
import { GuardianInvitation } from '../models/guardianInvitation.model';
import { assertUser } from '../services/access.service';

export const inviteGuardian = catchAsync(async (req, res) => {
  const requested = String(req.body.childId ?? '');
  const id = Types.ObjectId.isValid(requested) ? requested : (await User.findOne({ Id: requested }))?._id;
  if (!id) throw new AppError(404, 'Student not found');
  const child = await assertUser(req.user, id, true);
  if (child.type !== 'student') throw new AppError(400, 'Choose a student');
  const email = String(req.body.parentEmail ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError(400, 'Guardian email is required');
  const code = crypto.randomBytes(6).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60_000);
  await GuardianInvitation.create({ childId: child._id, codeHash: crypto.createHash('sha256').update(code).digest('hex'), parentEmail: email, createdBy: req.user!._id, expiresAt });
  res.status(201).json({ success: true, data: { code, expiresAt, studentId: child.Id, parentEmail: email } });
});
