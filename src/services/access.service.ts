import { Types } from 'mongoose';
import AppError from '../errors/AppError';
import { User } from '../models/user.model';
import { Class } from '../models/class.model';
import { ParentsChild } from '../models/parentsChild.model';
import { StuAssignToClass } from '../models/stuAssignToClass.model';

export const sameId = (a: any, b: any): boolean => Boolean(a && b && String(a._id ?? a) === String(b._id ?? b));
export const activeAccount = (user: any): boolean => Boolean(user && user.isActive !== false && (!user.state || user.state === 'active'));
export const isAdministrator = (user: any): boolean => ['admin', 'administrator'].includes(user?.role);
export const deny = (message = 'You do not have access to this record'): never => { throw new AppError(403, message); };
export const objectId = (value: any, label = 'ID'): string => {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) throw new AppError(400, `Invalid ${label}`);
  return value;
};
export const assertSchool = (actor: any, schoolId: any) => {
  if (actor.role === 'admin') return;
  if (!actor.schoolId || !sameId(actor.schoolId, schoolId)) deny('School access denied');
};
export const assertUser = async (actor: any, userId: any, write = false) => {
  const target = await User.findById(objectId(String(userId)));
  if (!target) throw new AppError(404, 'User not found');
  if (actor.role === 'admin' || sameId(actor, target)) return target;
  if (actor.role === 'administrator') { assertSchool(actor, target.schoolId); return target; }
  if (write) deny();
  if (target.type === 'student') {
    if (actor.type === 'parent' && await ParentsChild.exists({ parentId: actor._id, childId: target._id })) return target;
    assertSchool(actor, target.schoolId);
    if (actor.type === 'teacher') {
      const classes = await Class.find({ teacherId: actor._id }).distinct('_id');
      if (await StuAssignToClass.exists({ studentId: target._id, classId: { $in: classes } })) return target;
    }
  }
  return deny();
};
export const assertClass = async (actor: any, classId: any, write = false) => {
  const cls = await Class.findById(objectId(String(classId), 'class ID'));
  if (!cls) throw new AppError(404, 'Class not found');
  if (actor.type === 'parent' && !write) {
    const children = await ParentsChild.find({ parentId: actor._id }).distinct('childId');
    if (await StuAssignToClass.exists({ studentId: { $in: children }, classId: cls._id })) return cls;
    deny('Class enrollment required');
  }
  const teacher = await User.findById(cls.teacherId).select('schoolId');
  if (!teacher) throw new AppError(404, 'Class teacher not found');
  assertSchool(actor, teacher.schoolId);
  if (isAdministrator(actor)) return cls;
  if (actor.type === 'teacher' && sameId(actor, cls.teacherId)) return cls;
  if (!write && actor.type === 'student' && await StuAssignToClass.exists({ studentId: actor._id, classId: cls._id })) return cls;
  return deny('Class enrollment required');
};
export const visibleClassIds = async (actor: any) => {
  if (actor.role === 'admin') return Class.find().distinct('_id');
  if (actor.role === 'administrator') {
    if (!actor.schoolId) return [];
    const teachers = await User.find({ schoolId: actor.schoolId, type: 'teacher' }).distinct('_id');
    return Class.find({ teacherId: { $in: teachers } }).distinct('_id');
  }
  if (actor.type === 'teacher') return Class.find({ teacherId: actor._id }).distinct('_id');
  const students = actor.type === 'parent' ? await ParentsChild.find({ parentId: actor._id }).distinct('childId') : [actor._id];
  return StuAssignToClass.find({ studentId: { $in: students } }).distinct('classId');
};

export const visibleStudentIds = async (actor: any): Promise<any[]> => {
  if (actor.type === 'student') return [actor._id];
  if (actor.type === 'parent') return ParentsChild.find({ parentId: actor._id }).distinct('childId');
  return StuAssignToClass.find({ classId: { $in: await visibleClassIds(actor) } }).distinct('studentId');
};
export const lessonAudience = async (actor: any) => ['student', 'parent'].includes(actor.type)
  ? { $or: [{ studentId: { $in: await visibleStudentIds(actor) } }, { studentId: null }] } : {};
