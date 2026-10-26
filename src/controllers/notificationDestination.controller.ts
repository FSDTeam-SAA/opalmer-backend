import catchAsync from '../utils/catchAsync';
import AppError from '../errors/AppError';
import { Notification } from '../models/notification.model';
import { Homework } from '../models/homework.model';
import { Quiz } from '../models/quiz.model';
import { QuizResult } from '../models/quizResult.model';
import { Room } from '../models/room.model';
import { Behavior } from '../models/behavior.model';
import { Attendance } from '../models/attendance.model';
import { Lesson } from '../models/lesson.model';
import { Announcement } from '../models/announcement.model';
import { AdminAnnouncement } from '../models/adminAnnouncement.model';
import { studentResult } from '../services/assessment.service';
import { assertClass, assertUser, sameId, visibleStudentIds } from '../services/access.service';
import { canAccessRoom } from '../utils/chatAccess';

export const notificationDestination = catchAsync(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.notificationId, to: req.user!._id });
  if (!notification) throw new AppError(404, 'Notification not found');
  if (req.user?.type === 'parent' && notification.studentId) {
    await assertUser(req.user, notification.studentId);
  }
  let data: any, kind = notification.type;
  if (['homework', 'assignment_grade', 'homework_help', 'submission'].includes(kind)) {
    data = await Homework.findById(notification.id);
    if (data) {
      await assertClass(req.user, data.classId);
      if (['parent', 'student'].includes(req.user!.type)) {
        if (data.status === 'draft') throw new AppError(404, 'Assignment is not published');
        const students = await visibleStudentIds(req.user);
        if (data.studentIds?.length && !students.some(student => data.studentIds.some((target: any) => sameId(target, student)))) throw new AppError(403, 'Assignment is not assigned to you');
      }
    }
    kind = 'homework';
  } else if (['grade', 'quiz_result'].includes(kind)) {
    const result = await QuizResult.findById(notification.id);
    if (result) {
      await assertUser(req.user, result.studentId);
      data = ['student', 'parent'].includes(req.user!.type) ? studentResult(result) : result;
    }
    kind = 'grade';
  } else if (kind === 'class') {
    data = await assertClass(req.user, notification.id);
  } else if (kind === 'quiz') {
    data = await Quiz.findById(notification.id);
    if (data) await assertClass(req.user, data.classId);
  } else if (kind === 'message') {
    await canAccessRoom(String(req.user!._id), String(notification.id));
    data = await Room.findById(notification.id).populate('participants.userId', 'username Id avatar type');
  } else if (kind === 'attendance') {
    data = await Attendance.findById(notification.id);
    if (data) await assertUser(req.user, data.userId);
  } else if (kind === 'behavior') {
    data = await Behavior.findById(notification.id);
    if (data) { await assertUser(req.user, data.studentId); if (req.user!.type === 'parent' && data.parentVisible === false) throw new AppError(403, 'This record is private'); }
  } else if (kind === 'admin_announcement') {
    // Notification ownership above proves this user was an intended recipient.
    data = await AdminAnnouncement.findById(notification.id).select('title message audiences createdAt');
    kind = 'announcement';
  } else if (kind === 'announcement') {
    data = await Announcement.findById(notification.id);
    if (data) await assertClass(req.user, data.classId);
  } else if (kind === 'lesson') {
    data = await Lesson.findById(notification.id);
    if (data) { await assertClass(req.user, data.classId); if (data.studentId) await assertUser(req.user, data.studentId); }
  }
  if (!data) throw new AppError(404, 'This item is no longer available');
  res.json({ success: true, data: { kind, record: data, studentId: notification.studentId, classId: notification.classId } });
});
