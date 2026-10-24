import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import { assertClass, assertSchool, objectId, sameId } from '../services/access.service';
import { requiredText } from './teacherTools.controller';
import { Class } from '../models/class.model';
import { User } from '../models/user.model';
import { StuAssignToClass } from '../models/stuAssignToClass.model';
import { Behavior } from '../models/behavior.model';
import { Submission } from '../models/submission.model';
import { QuizResult } from '../models/quizResult.model';
import { TeacherBehaviorReport } from '../models/teacherBehaviorReport.model';
import { AdminAnnouncement } from '../models/adminAnnouncement.model';
import { Audit } from '../models/audit.model';
import { createNotification, notifyClass } from '../sockets/notification.service';

export const announcementAudiences = (raw: unknown): string[] => {
  if (!Array.isArray(raw) || !raw.length || raw.some(type => !['parent', 'student', 'teacher'].includes(type))) {
    throw new AppError(400, 'Select parents, students, teachers, or a combination');
  }
  return [...new Set(raw)];
};
export const validDay = (raw: unknown) => {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new AppError(400, 'Choose a valid date');
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== raw) throw new AppError(400, 'Choose a valid date');
  return date;
};
const audit = (actor: any, action: string, resource: any) => Audit.create({ actorId: actor._id, action, resource: String(resource) });

export const workspaceClasses = catchAsync(async (_req, res) => {
  const rows = await Class.find().sort({ grade: 1, subject: 1 }).populate({ path: 'teacherId', select: 'username Id schoolId', populate: { path: 'schoolId', select: 'name schoolName' } }).lean();
  res.json({ success: true, data: rows });
});

export const workspaceDirectory = catchAsync(async (req, res) => {
  const query: any = { isActive: true, state: 'active', _id: { $ne: req.user!._id } };
  if (req.user!.role === 'administrator') {
    delete query.isActive;
    delete query.state;
    if (!req.user!.schoolId) throw new AppError(403, 'School access required');
    query.schoolId = req.user!.schoolId;
    query.type = 'teacher';
    query.role = 'user';
  } else if (req.query.type) {
    if (!['parent', 'student', 'teacher'].includes(String(req.query.type))) throw new AppError(400, 'Invalid user type');
    query.type = req.query.type;
  }
  const search = String(req.query.search ?? '').trim().slice(0, 100);
  if (search) {
    const literal = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = ['username', 'Id', 'email'].map(field => ({ [field]: { $regex: literal, $options: 'i' } }));
  }
  const page = Math.max(1, Math.min(10000, Number(req.query.page) || 1));
  const [rows, total] = await Promise.all([
    User.find(query).select('username Id type role schoolId').sort({ username: 1, _id: 1 }).skip((page - 1) * 30).limit(30).lean(),
    User.countDocuments(query),
  ]);
  res.json({ success: true, data: rows, meta: { page, total, totalPages: Math.ceil(total / 30) } });
});

export const workspaceRoster = catchAsync(async (req, res) => {
  const classId = objectId(req.params.classId, 'class ID');
  await assertClass(req.user, classId);
  const roster = await StuAssignToClass.find({ classId }).populate('studentId', 'username Id').lean();
  res.json({ success: true, data: { students: roster.map(row => row.studentId).filter(Boolean) } });
});

export const addWorkspaceBehavior = catchAsync(async (req, res) => {
  const classId = objectId(req.body.classId, 'class ID');
  await assertClass(req.user, classId, true);
  const studentId = objectId(req.body.studentId, 'student ID');
  if (!await StuAssignToClass.exists({ classId, studentId })) throw new AppError(403, 'Student is not enrolled in this class');
  if (!['positive', 'neutral', 'corrective', 'negative'].includes(req.body.state)) throw new AppError(400, 'Choose a behavior type');
  const record = await Behavior.create({ classId, studentId, teacherId: req.user!._id, state: req.body.state,
    message: requiredText(req.body.message, 'a behavior note', 10000), parentVisible: req.body.parentVisible === true });
  await audit(req.user, 'admin.student-behavior.create', record._id);
  res.status(201).json({ success: true, data: record });
});

export const submitTeacherBehavior = catchAsync(async (req, res) => {
  const teacher = await User.findById(objectId(req.body.teacherId, 'teacher ID'));
  if (!teacher || teacher.type !== 'teacher' || teacher.role !== 'user') throw new AppError(404, 'Teacher not found');
  assertSchool(req.user, teacher.schoolId);
  if (!teacher.schoolId) throw new AppError(400, 'Teacher must belong to a school');
  const record = await TeacherBehaviorReport.create({
    teacherId: teacher._id, schoolId: teacher.schoolId, submittedBy: req.user!._id,
    subject: requiredText(req.body.subject, 'a subject', 200), message: requiredText(req.body.message, 'report details', 10000),
    occurredOn: validDay(req.body.occurredOn), severity: req.body.severity === 'urgent' ? 'urgent' : 'normal',
  });
  // Submitters receive a receipt, never a readable report or report history.
  res.status(201).json({ success: true, data: { id: record._id }, message: 'Report submitted to Admin' });
});
export const listTeacherBehavior = catchAsync(async (req, res) => {
  const page = Math.max(1, Math.min(10000, Number(req.query.page) || 1));
  const [rows, total] = await Promise.all([
    TeacherBehaviorReport.find().sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20)
      .populate('teacherId', 'username Id').populate('submittedBy', 'username Id').populate('schoolId', 'name schoolName').lean(),
    TeacherBehaviorReport.countDocuments(),
  ]);
  res.json({ success: true, data: rows, meta: { page, totalPages: Math.ceil(total / 20) } });
});

export const workspaceActivity = catchAsync(async (_req, res) => {
  const [submissions, reviews, autoGraded] = await Promise.all([
    Submission.find({ status: { $ne: 'draft' } }).sort({ submittedAt: -1 }).limit(5).populate('studentId', 'username Id').populate('homeworkId', 'title pointsPossible classId').lean(),
    QuizResult.find({ 'progress.status': 'completed', gradeStatus: 'pending_review' }).sort({ submittedAt: -1 }).limit(5).populate('studentId', 'username Id').populate('quizId', 'title classId').lean(),
    QuizResult.find({ 'progress.status': 'completed' }).sort({ submittedAt: -1 }).limit(5).populate('studentId', 'username Id').populate('quizId', 'title classId').lean(),
  ]);
  res.json({ success: true, data: { submissions, reviews, autoGraded: autoGraded.map(row => ({ ...row, autoScore: row.answers.filter(answer => answer.isCorrect === true).length })) } });
});
export const workspaceSubmission = catchAsync(async (req, res) => {
  const record = await Submission.findById(objectId(req.params.id)).populate('studentId', 'username Id').populate('homeworkId', 'title pointsPossible classId file');
  if (!record || record.status === 'draft') throw new AppError(404, 'Submitted assignment not found');
  res.json({ success: true, data: record });
});

export async function deliverAdminAnnouncement(record: any) {
  let failed = false;
  for (let i = 0; i < record.recipientIds.length; i += 40) {
    const results = await Promise.allSettled(record.recipientIds.slice(i, i + 40).map((to: any) => createNotification({
      to, type: 'admin_announcement', id: record._id, message: `${record.title}: ${record.message}`, eventKey: `admin-announcement:${record._id}`,
    })));
    if (results.some(result => result.status === 'rejected')) failed = true;
  }
  record.deliveryStatus = failed ? 'failed' : 'sent';
  await record.save();
  return !failed;
}
export const sendAdminAnnouncement = catchAsync(async (req, res) => {
  const audiences = announcementAudiences(req.body.audiences);
  const title = requiredText(req.body.title, 'a title', 200), message = requiredText(req.body.message, 'a message', 10000);
  const recipientIds = await User.find({ role: 'user', type: { $in: audiences }, isActive: true, state: 'active' }).distinct('_id');
  if (!recipientIds.length) throw new AppError(400, 'No active users match the selected audience');
  const record = await AdminAnnouncement.create({ createdBy: req.user!._id, title, message, audiences, recipientIds, recipientCount: recipientIds.length });
  const sent = await deliverAdminAnnouncement(record);
  res.status(201).json({ success: true, data: { id: record._id, deliveryStatus: record.deliveryStatus, recipientCount: record.recipientCount }, notificationWarning: sent ? undefined : 'Announcement saved. Retry failed deliveries from announcement history.' });
});
export const adminAnnouncements = catchAsync(async (_req, res) => {
  res.json({ success: true, data: await AdminAnnouncement.find().sort({ createdAt: -1 }).limit(30).lean() });
});
export const retryAdminAnnouncement = catchAsync(async (req, res) => {
  const record = await AdminAnnouncement.findById(objectId(req.params.id)).select('+recipientIds');
  if (!record) throw new AppError(404, 'Announcement not found');
  const sent = await deliverAdminAnnouncement(record);
  res.json({ success: true, data: { id: record._id, deliveryStatus: record.deliveryStatus }, notificationWarning: sent ? undefined : 'Some notifications could not be sent. Retry later.' });
});
