import { disconnectUser } from '../services/realtime.service';
import crypto from 'node:crypto';
import { User } from '../models/user.model';
import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import sendEmail from '../utils/sendEmail';

export const forgotPassword = catchAsync(async (req, res) => {
  const identifier = String(req.body.email ?? req.body.Id ?? '').trim();
  if (!identifier) throw new AppError(400, 'Email or student ID is required');
  const user = await User.findOne({ $or: [{ Id: identifier }, { email: identifier.toLowerCase() }] });
  if (user?.email) {
    const code = crypto.randomInt(10000000, 100000000).toString();
    const digest = crypto.createHash('sha256').update(code).digest('hex');
    await User.updateOne({ _id: user._id }, { password_reset_token: digest, passwordResetExpires: new Date(Date.now() + 15 * 60_000) });
    try {
      await sendEmail({ to: user.email, subject: 'Classpulse password reset', html: `<p>Your password reset code is <strong>${code}</strong>. It expires in 15 minutes. If you did not request this, ignore this email.</p>` });
    } catch { /* Keep the response identical to avoid account enumeration. */ }
  }
  res.json({ success: true, message: 'If that account has an email address, a reset code has been sent.' });
});
export const resetPassword = catchAsync(async (req, res) => {
  const identifier = String(req.body.email ?? req.body.Id ?? '').trim();
  const password = String(req.body.newPassword ?? '');
  if (password.length < 8 || password.length > 128) throw new AppError(400, 'Use a password between 8 and 128 characters');
  const token = crypto.createHash('sha256').update(String(req.body.code ?? '')).digest('hex');
  const user = await User.findOneAndUpdate({ $or: [{ Id: identifier }, { email: identifier.toLowerCase() }], password_reset_token: token, passwordResetExpires: { $gt: new Date() } }, { $unset: { password_reset_token: '', passwordResetExpires: '' }, $inc: { tokenVersion: 1 } }, { new: true });
  if (!user) throw new AppError(400, 'Invalid or expired reset code');
  user.password = password;
  await user.save();
  disconnectUser(String(user._id));
  res.json({ success: true, message: 'Password reset. Sign in with your new password.' });
});
