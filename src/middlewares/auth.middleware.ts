import { RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import AppError from '../errors/AppError';
import { User } from '../models/user.model';
import { activeAccount } from '../services/access.service';
import { getRequiredEnv } from '../config/env';

export const jwtSecret = () => getRequiredEnv('JWT_SECRET');
export const authenticate = (purpose: 'access' | '2fa' = 'access'): RequestHandler => async (req, _res, next) => {
  try {
    if (purpose === 'access' && req.user) return next();
    const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw new AppError(401, 'Authentication required');
    const decoded = jwt.verify(token, jwtSecret(), { algorithms: ['HS256'] }) as JwtPayload;
    if (!decoded.userId || (decoded.purpose ?? 'access') !== purpose) throw new AppError(401, 'Invalid session');
    const user = await User.findById(decoded.userId);
    if (!activeAccount(user) || (user!.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) throw new AppError(401, 'Session expired');
    req.user = user!;
    next();
  } catch (error) { next(error instanceof AppError ? error : new AppError(401, 'Invalid or expired session')); }
};
export const protect = authenticate();
export const protectChallenge = authenticate('2fa');
export const authorizeTeacherOrAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(new AppError(401, 'Authentication required'));
  if (req.user.role !== 'admin' && !(req.user.role === 'user' && req.user.type === 'teacher')) {
    return next(new AppError(403, 'Only Admin or teachers can perform this action'));
  }
  next();
};
export const authorizeRoles = (...roles: string[]): RequestHandler => (req, _res, next) => {
  if (!req.user) return next(new AppError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(new AppError(403, 'Role access denied'));
  next();
};
export const authorizeTypes = (...types: string[]): RequestHandler => (req, _res, next) => {
  if (!req.user) return next(new AppError(401, 'Authentication required'));
  if (!['admin', 'administrator'].includes(req.user.role) && !types.includes(req.user.type)) return next(new AppError(403, 'Role access denied'));
  next();
};
