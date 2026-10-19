import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import { Homework } from '../models/homework.model';
import { Submission } from '../models/submission.model';
import { Class } from '../models/class.model';
import { StuAssignToClass } from '../models/stuAssignToClass.model';
import { assertClass, assertUser, sameId } from '../services/access.service';
import { uploadToCloudinary } from '../utils/cloudinary';
import { createNotification, notifyStudentFamily } from '../sockets/notification.service';

const assignment = async (actor: any, id: string, write = false) => {
  const homework = await Homework.findById(id);
  if (!homework) throw new AppError(404, 'Assignment not found');
  await assertClass(actor, homework.classId, write);
  if (actor.type === 'student' && homework.status === 'draft') throw new AppError(403, 'Assignment is not published');
  if (actor.type === 'student' && homework.studentIds?.length && !homework.studentIds.some(s => sameId(s, actor._id))) throw new AppError(403, 'Assignment is not assigned to you');
  return homework;
};
const safe = (record: any, actor: any) => {
  if (!record) return null;
  const data = record.toObject();
  if (['student', 'parent'].includes(actor.type) && data.status !== 'released') { delete data.score; delete data.feedback; delete data.history; }
  return data;
};
export const getSubmission = catchAsync(async (req, res) => {
  const homework = await assignment(req.user, req.params.id);
  const studentId = String(req.query.studentId ?? req.user!._id);
  await assertUser(req.user, studentId);
  const record = await Submission.findOne({ homeworkId: homework._id, studentId });
  res.json({ success: true, data: safe(record, req.user) });
});
export const saveSubmission = catchAsync(async (req, res) => {
  if (req.user?.type !== 'student') throw new AppError(403, 'Student access required');
  const homework = await assignment(req.user, req.params.id);
  const existing = await Submission.findOne({ homeworkId: homework._id, studentId: req.user!._id });
  if (existing && existing.status !== 'draft') throw new AppError(409, 'This assignment has already been submitted');
  const response = String(req.body.response ?? '').trim();
  const files: any[] = existing?.files.map(f => f.toObject()) ?? [];
  for (const file of (req.files as Express.Multer.File[] ?? [])) {
    const uploaded = await uploadToCloudinary(file.path);
    if (!uploaded) throw new AppError(502, 'Attachment upload failed. Try again.');
    files.push({ url: uploaded.secure_url, public_id: uploaded.public_id, filename: file.originalname });
  }
  const submit = req.body.submit === true || req.body.submit === 'true';
  if (submit && !response && !files.length) throw new AppError(400, 'Add a response or a file before submitting');
  const filter: any = existing ? { _id: existing._id, status: 'draft', updatedAt: existing.updatedAt } : { homeworkId: homework._id, studentId: req.user!._id };
  const record = await Submission.findOneAndUpdate(filter, { $set: { homeworkId: homework._id, classId: homework.classId, studentId: req.user!._id, response, files, status: submit ? 'submitted' : 'draft', ...(submit ? { submittedAt: new Date() } : {}) } }, { new: true, upsert: !existing, runValidators: true });
  if (!record) throw new AppError(409, 'Submission changed. Reload and retry.');
  if (submit) {
    const cls = await Class.findById(homework.classId);
    if (cls) await createNotification({ to: cls.teacherId, type: 'submission', id: homework._id, classId: homework.classId, studentId: req.user!._id, message: `A student submitted ${homework.title}.`, eventKey: `submission:${record._id}` });
  }
  res.json({ success: true, data: safe(record, req.user) });
});
export const assignmentSubmissions = catchAsync(async (req, res) => {
  const homework = await assignment(req.user, req.params.id, true);
  const records = await Submission.find({ homeworkId: homework._id }).populate('studentId', 'username Id avatar');
  const roster = await StuAssignToClass.find({ classId: homework.classId }).populate('studentId', 'username Id avatar');
  res.json({ success: true, data: { submissions: records, missing: roster.map(r => r.studentId).filter(s => !records.some(r => sameId(r.studentId, s) && r.status !== 'draft')) } });
});
export const reviewSubmission = catchAsync(async (req, res) => {
  const homework = await assignment(req.user, req.params.id, true);
  const record = await Submission.findOne({ _id: req.params.submissionId, homeworkId: homework._id });
  if (!record || record.status === 'draft') throw new AppError(404, 'Submitted assignment not found');
  const score = Number(req.body.score ?? record.score);
  if (!Number.isFinite(score) || score < 0 || score > (homework.pointsPossible ?? 100)) throw new AppError(400, 'Score is outside the available points');
  const release = req.body.release === true;
  const previousScore = record.score;
  const updated = await Submission.findOneAndUpdate({ _id: record._id, updatedAt: record.updatedAt }, { $set: { score, feedback: String(req.body.feedback ?? '').slice(0, 5000), status: release ? 'released' : 'reviewed', reviewedAt: new Date(), ...(release ? { releasedAt: new Date() } : {}) }, $push: { history: { actorId: req.user!._id, score, previousScore, date: new Date(), reason: String(req.body.reason ?? '') } } }, { new: true });
  if (!updated) throw new AppError(409, 'Submission changed. Reload and retry.');
  if (release) await notifyStudentFamily({ studentId: record.studentId, classId: homework.classId, type: 'assignment_grade', id: homework._id, message: `A grade for ${homework.title} is available.`, eventKey: `assignment-grade:${record._id}:${updated.updatedAt.toISOString()}`, notifyStudent: req.body.notifyStudent !== false, notifyParent: req.body.notifyParent !== false });
  res.json({ success: true, data: updated });
});
