import crypto from 'node:crypto';
import { User } from '../models/user.model';
import { Types } from 'mongoose';
import catchAsync from '../utils/catchAsync';
import AppError from '../errors/AppError';
import { GuardianInvitation } from '../models/guardianInvitation.model';
import { activeAccount, assertUser, sameId } from '../services/access.service';
import sendEmail from '../utils/sendEmail';
import { guardianInvitationEmail } from '../utils/guardianInvitationTemplate';


export const inviteGuardian = catchAsync(async (req, res) => {
  const requested = String(req.body.childId ?? '');
  const id = Types.ObjectId.isValid(requested) ? requested : (await User.findOne({ Id: requested }))?._id;
  if (!id) throw new AppError(404, 'Student not found');
  const child = await assertUser(req.user, id, true);
  if (child.type !== 'student') throw new AppError(400, 'Choose a student');
  let email = String(req.body.parentEmail ?? '').trim().toLowerCase();
  if (req.body.parentId) {
    const parentId = String(req.body.parentId);
    if (!Types.ObjectId.isValid(parentId)) throw new AppError(400, 'Select a valid parent');
    const parent = await assertUser(req.user, parentId, true);
    if (parent.type !== 'parent' || !activeAccount(parent)) throw new AppError(400, 'Choose an active parent account');
    if (parent.schoolId && child.schoolId && !sameId(parent.schoolId, child.schoolId)) {
      throw new AppError(403, 'Parent and student must belong to the same school');
    }
    email = String(parent.email ?? '').trim().toLowerCase();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError(400, 'Guardian email is required');
  const code = crypto.randomBytes(6).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60_000);
  const invitation = await GuardianInvitation.create({ childId: child._id, codeHash: crypto.createHash('sha256').update(code).digest('hex'), parentEmail: email, createdBy: req.user!._id, expiresAt });
  try {
    const { html, text } = guardianInvitationEmail({ studentName: child.username, studentId: child.Id, code, expiresAt });
    await sendEmail({ to: email, subject: 'AchieverPlus guardian invitation', html, text });
  } catch {
    await GuardianInvitation.deleteOne({ _id: invitation._id, usedAt: { $exists: false } });
    throw new AppError(503, 'Unable to send invitation email. Please try again.');
  }
  res.status(201).json({ success: true, message: 'Invitation email sent successfully', data: { code, expiresAt, studentId: child.Id, parentEmail: email, emailSent: true } });
});
