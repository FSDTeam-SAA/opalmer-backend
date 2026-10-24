import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import { assertClass, objectId, sameId, visibleStudentIds } from '../services/access.service';
import { Homework } from '../models/homework.model';
import { StuAssignToClass } from '../models/stuAssignToClass.model';
import { TeacherResource } from '../models/teacherResource.model';
import { Announcement } from '../models/announcement.model';
import { notifyClass, notifyStudentFamily } from '../sockets/notification.service';
import { uploadToCloudinary } from '../utils/cloudinary';
import { Class } from '../models/class.model';
import { Quiz } from '../models/quiz.model';
import { QuizResult } from '../models/quizResult.model';
import { Submission } from '../models/submission.model';

export const requiredText = (value: unknown, name: string, max: number): string => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new AppError(400, `Enter ${name} (up to ${max} characters)`);
  }
  return value.trim();
};
export const safeResourceLink = (value: unknown): string | undefined => {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || value.length > 2000) throw new AppError(400, 'Enter a valid HTTPS resource link');
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
    return url.href;
  } catch { throw new AppError(400, 'Enter a valid HTTPS resource link'); }
};
const enabled = (value: unknown) => value !== false && value !== 'false';

// A resource cannot widen the audience of its assignment.
export const assertHelpAssignment = async (actor: any, homeworkId: string, write = false) => {
  const homework = await Homework.findById(objectId(homeworkId, 'assignment ID'));
  if (!homework) throw new AppError(404, 'Assignment not found');
  await assertClass(actor, homework.classId, write);
  if (['student', 'parent'].includes(actor.type)) {
    if (homework.status === 'draft') throw new AppError(404, 'Assignment is not published');
    const students = await visibleStudentIds(actor);
    const targets = homework.studentIds ?? [];
    if (targets.length && !students.some(id => targets.some(target => sameId(target, id)))) {
      throw new AppError(403, 'Assignment is not assigned to you');
    }
  }
  return homework;
};

export const listHomeworkHelp = catchAsync(async (req, res) => {
  const homework = await assertHelpAssignment(req.user, String(req.params.homeworkId));
  const query: any = { homeworkId: homework._id };
  if (['student', 'parent'].includes(req.user!.type)) {
    let students = await visibleStudentIds(req.user);
    // Parents can select a child, but cannot request another family's child.
    if (req.query.studentId) {
      const childId = objectId(req.query.studentId, 'student ID');
      if (!students.some(id => sameId(id, childId))) throw new AppError(403, 'Student access denied');
      students = students.filter(id => sameId(id, childId));
    }
    const targets = homework.studentIds ?? [];
    if (targets.length) students = students.filter(id => targets.some(target => sameId(target, id)));
    const enrolled = await StuAssignToClass.find({ classId: homework.classId, studentId: { $in: students } }).distinct('studentId');
    if (!enrolled.length) throw new AppError(403, 'This assignment is not available for the selected student');
    query.$or = [{ studentId: null }, { studentId: { $in: enrolled } }];
  }
  res.json({ success: true, data: await TeacherResource.find(query).sort({ createdAt: -1 }).lean() });
});

export const listResources = catchAsync(async (req, res) => {
  const classId = objectId(req.query.classId, 'class ID');
  await assertClass(req.user, classId, true);
  res.json({ success: true, data: await TeacherResource.find({ classId, teacherId: req.user!._id }).sort({ createdAt: -1 }).lean() });
});

export const createResource = catchAsync(async (req, res) => {
  const classId = objectId(req.body.classId, 'class ID');
  const cls = await assertClass(req.user, classId, true);
  if (!sameId(cls.teacherId, req.user)) throw new AppError(403, 'Only the class teacher can add resources');
  const title = requiredText(req.body.title, 'a resource title', 200);
  const link = safeResourceLink(req.body.link);
  if (!req.file && !link) throw new AppError(400, 'Choose a file or enter a resource link');
  let homework;
  if (req.body.homeworkId) {
    homework = await assertHelpAssignment(req.user, req.body.homeworkId, true);
    if (!sameId(homework.classId, classId)) throw new AppError(400, 'Assignment belongs to another class');
    if (homework.status === 'draft') throw new AppError(400, 'Publish the assignment before adding homework help');
  }
  const studentId = req.body.studentId ? objectId(req.body.studentId, 'student ID') : undefined;
  if (studentId) {
    if (!homework) throw new AppError(400, 'Select an assignment for student-specific help');
    if (!await StuAssignToClass.exists({ classId, studentId })) throw new AppError(403, 'Student is not enrolled in this class');
    if (homework.studentIds?.length && !homework.studentIds.some(id => sameId(id, studentId))) throw new AppError(400, 'Assignment is not assigned to this student');
  }
  let file;
  if (req.file) {
    const uploaded = await uploadToCloudinary(req.file.path);
    if (!uploaded) throw new AppError(502, 'Resource upload failed. Please retry.');
    file = { url: uploaded.secure_url, public_id: uploaded.public_id, filename: req.file.originalname };
  }
  const resource = await TeacherResource.create({ classId, teacherId: req.user!._id, title, link, file, homeworkId: homework?._id, studentId });
  // Saving is distinct from delivery: never ask users to re-upload a saved file.
  let notificationWarning: string | undefined;
  if (homework) {
    const event = { classId, type: 'homework_help', id: homework._id, message: `Homework help for ${homework.title}: ${title}`, eventKey: `help:${resource._id}`, notifyStudent: enabled(req.body.notifyStudent), notifyParent: enabled(req.body.notifyParent) };
    try {
      const targets = studentId ? [studentId] : homework.studentIds;
      if (targets?.length) await Promise.all(targets.map(id => notifyStudentFamily({ ...event, studentId: id })));
      else await notifyClass(event);
    } catch { notificationWarning = 'Resource saved, but some notifications could not be sent.'; }
  }
  res.status(201).json({ success: true, data: resource, notificationWarning });
});

export const listAnnouncements = catchAsync(async (req, res) => {
  const classId = objectId(req.query.classId, 'class ID');
  await assertClass(req.user, classId, true);
  res.json({ success: true, data: await Announcement.find({ classId, teacherId: req.user!._id }).sort({ createdAt: -1 }).lean() });
});

export const createAnnouncement = catchAsync(async (req, res) => {
  const classId = objectId(req.body.classId, 'class ID');
  const cls = await assertClass(req.user, classId, true);
  if (!sameId(cls.teacherId, req.user)) throw new AppError(403, 'Only the class teacher can send announcements');
  const title = requiredText(req.body.title, 'a title', 200);
  const message = requiredText(req.body.message, 'a message', 10000);
  const notifyStudent = enabled(req.body.notifyStudent), notifyParent = enabled(req.body.notifyParent);
  if (!notifyStudent && !notifyParent) throw new AppError(400, 'Select students, parents or both');
  const announcement = await Announcement.create({ teacherId: req.user!._id, classId, title, message, notifyStudent, notifyParent });
  const sent = await deliverAnnouncement(announcement);
  res.status(201).json({ success: true, data: announcement, notificationWarning: sent ? undefined : 'Announcement saved. Some notifications failed; retry from announcement history.' });
});

async function deliverAnnouncement(announcement: any) {
  try {
    await notifyClass({ classId: announcement.classId, type: 'announcement', id: announcement._id, message: `${announcement.title}: ${announcement.message}`, eventKey: `announcement:${announcement._id}`, notifyStudent: announcement.notifyStudent, notifyParent: announcement.notifyParent });
    announcement.deliveryStatus = 'sent';
  } catch { announcement.deliveryStatus = 'failed'; }
  await announcement.save();
  return announcement.deliveryStatus === 'sent';
}

export const retryAnnouncement = catchAsync(async (req, res) => {
  const announcement = await Announcement.findOne({ _id: objectId(String(req.params.id)), teacherId: req.user!._id });
  if (!announcement) throw new AppError(404, 'Announcement not found');
  await assertClass(req.user, announcement.classId, true);
  const sent = await deliverAnnouncement(announcement);
  res.json({ success: true, data: announcement, notificationWarning: sent ? undefined : 'Some notifications still could not be sent. Please retry later.' });
});

export const teacherActivity = catchAsync(async (req, res) => {
  const classIds = await Class.find({ teacherId: req.user!._id }).distinct('_id');
  const quizzes = await Quiz.find({ classId: { $in: classIds } }).distinct('_id');
  const [submissions, reviews, autoGraded] = await Promise.all([
    Submission.find({ classId: { $in: classIds }, status: { $ne: 'draft' } }).sort({ submittedAt: -1 }).limit(5).populate('studentId', 'username Id').populate('homeworkId', 'title classId').lean(),
    QuizResult.find({ quizId: { $in: quizzes }, 'progress.status': 'completed', gradeStatus: 'pending_review' }).sort({ submittedAt: -1 }).limit(5).populate('studentId', 'username Id').populate('quizId', 'title classId').lean(),
    QuizResult.find({ quizId: { $in: quizzes }, 'progress.status': 'completed' }).sort({ submittedAt: -1 }).limit(5).populate('studentId', 'username Id').populate('quizId', 'title classId').lean(),
  ]);
  res.json({ success: true, data: { submissions, reviews, autoGraded } });
});
