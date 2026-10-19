import { StuAssignToClass } from '../models/stuAssignToClass.model';
import { RequestHandler } from 'express';
import AppError from '../errors/AppError';
import { protect } from './auth.middleware';
import { assertClass, assertSchool, assertUser, deny, isAdministrator, sameId, visibleStudentIds } from '../services/access.service';
import { Quiz } from '../models/quiz.model';
import { Homework } from '../models/homework.model';
import { Lesson } from '../models/lesson.model';
import { Behavior } from '../models/behavior.model';
import { Attendance } from '../models/attendance.model';
import AcademicDocument from '../models/academicDocument.model';
import { Notification } from '../models/notification.model';
import { LearningTip } from '../models/learningTip.model';

// Attached to each route after its upload parser, before its controller.
export const resourceAccess = (module: string): RequestHandler => async (req, res, next) => {
  const run = async () => {
    req.body ??= {};
    const path = String(req.route.path);
    const write = !['GET', 'HEAD'].includes(req.method);
    if (module === 'users' && ['/login', '/register', '/forgot-password', '/reset-password', '/verify-otp', '/refresh-token'].includes(path)) return;
    if (['aboutAndTerm', 'featuresAndQuestions'].includes(module) && !write) return;
    if (module === 'school' && !write && ['/', '/:id'].includes(path)) return;
    await new Promise<void>((resolve, reject) => protect(req, res, error => error ? reject(error) : resolve()));
    const actor = req.user! as any;
    if (['aboutAndTerm', 'featuresAndQuestions'].includes(module)) { if (actor.role !== 'admin') deny(); return; }
    if (module === 'users') {
      if (['/me', '/logout', '/change-password', '/toggle', '/contacts'].includes(path)) return;
      if (req.params.id) { await assertUser(actor, req.params.id, write); return; }
      if (path.includes('administrators')) { if (actor.role !== 'admin') deny(); return; }
      if (path === '/search-student') {
        if (!isAdministrator(actor) && actor.type !== 'teacher') deny('Student lookup is restricted to school staff');
        return;
      }
      if (!isAdministrator(actor) && actor.type !== 'teacher') deny();
      return;
    }
    if (module === 'school') {
      if (!isAdministrator(actor)) deny();
      if (req.params.id) assertSchool(actor, req.params.id);
      return;
    }
    if (module === 'dashboard') { if (!isAdministrator(actor)) deny(); return; }
    if (['message', 'rooms', 'call-logs', 'parent/child'].includes(module)) return;
    if (module === 'grading') {
      if (req.query.classId) await assertClass(actor, req.query.classId);
      if (req.params.studentId) await assertUser(actor, req.params.studentId);
      return;
    }
    if (module === 'student-assign-to-class') {
      if (req.params.studentId) await assertUser(actor, req.params.studentId);
      const enrollment = req.params.id ? await StuAssignToClass.findById(req.params.id) : null;
      if (req.params.id && !enrollment) throw new AppError(404, 'Enrollment not found');
      const enrollmentClassId = req.params.classId ?? req.body.classId ?? enrollment?.classId;
      if (enrollmentClassId) await assertClass(actor, enrollmentClassId, write);
      return;
    }
    if (module === 'learning-tips') {
      if (write && !isAdministrator(actor)) deny();
      if (actor.role !== 'admin' && !path.includes('by-parent')) {
        const record: any = req.params.id ? await LearningTip.findById(req.params.id) : null;
        const schoolId = record?.schoolId ?? req.body.schoolId ?? req.query.schoolId;
        if (!schoolId) deny('School ID required');
        assertSchool(actor, schoolId);
      }
      return;
    }
    if (module === 'notifications') {
      const notification = req.params.notificationId ? await Notification.findById(req.params.notificationId) : null;
      if (!sameId(actor, notification?.to ?? req.params.userId)) deny();
      return;
    }
    if (module === 'classes') {
      if (req.params.studentId) { await assertUser(actor, req.params.studentId); return; }
      if (req.params.teacherId) { await assertUser(actor, req.params.teacherId); return; }
      if (req.params.id) { await assertClass(actor, req.params.id, write); return; }
      if (write) {
        if (actor.type !== 'teacher' && !isAdministrator(actor)) deny();
        req.body.teacherId = actor.type === 'teacher' ? actor._id : req.body.teacherId;
        await assertUser(actor, req.body.teacherId, true);
      }
      return;
    }
    if (module === 'test/quizzes') {
      if (req.params.studentId) await assertUser(actor, req.params.studentId);
      return;
    } // assessment service enforces result ownership
    let classId: any = req.params.classId ?? req.query.classId ?? req.body?.classId;
    const studentId = req.params.studentId ?? req.params.userId ?? req.query.studentId ?? req.query.userId ?? req.body?.studentId;
    if (studentId) await assertUser(actor, studentId);
    if (req.params.teacherId && !sameId(actor, req.params.teacherId)) await assertUser(actor, req.params.teacherId);
    if (module === 'quizzes' || module === 'quiz/qa') {
      const id = req.params.quizId ?? req.body?.quizId;
      if (id) {
        const record = await Quiz.findById(id);
        if (!record) throw new AppError(404, 'Assessment not found');
        classId = record.classId;
        if (!write && actor.type === 'student' && record.status !== 'published') deny('Assessment is not published');
      }
      if (write && !isAdministrator(actor) && actor.type !== 'teacher') deny();
      if (module === 'quizzes' && write && !id) req.body.teacherId = actor._id;
    }
    const models: Record<string, any> = { homework: Homework, lessons: Lesson, behavior: Behavior, attendances: Attendance, academicDocument: AcademicDocument };
    const id = req.params.id ?? req.params.lessonId ?? req.params.behaviorId ?? req.params.academicDocumentId;
    if (id && models[module]) {
      const record = await models[module].findById(id);
      if (!record) throw new AppError(404, 'Record not found');
      classId = record.classId ?? classId;
      const ownerStudent = record.studentId ?? (module === 'attendances' ? record.userId : null);
      if (ownerStudent) await assertUser(actor, ownerStudent);
      if (!write && module === 'homework' && ['student', 'parent'].includes(actor.type)) {
        if (record.status === 'draft') deny('Assignment is not published');
        if (record.studentIds?.length && !(await visibleStudentIds(actor)).some(student => record.studentIds.some((target: any) => sameId(target, student)))) deny('Assignment is not assigned to you');
      }
      if (!write && module === 'behavior' && actor.type === 'parent' && record.parentVisible === false) deny('This record is private');
      if (write && !classId && !sameId(record.teacherId, actor) && !isAdministrator(actor)) deny();
    }
    const studentSubmission = module === 'homework' && path === '/:id/submission';
    if (classId) await assertClass(actor, classId, write && !studentSubmission);
    if (write && req.body.classId && !sameId(req.body.classId, classId)) await assertClass(actor, req.body.classId, true);
    if (write && !studentSubmission && !isAdministrator(actor) && actor.type !== 'teacher') deny();
    if (module === 'homework' && write) req.body.userId = actor._id;
    if (module === 'quizzes' && write) req.body.teacherId = actor._id;
    if (['lessons', 'academicDocument', 'behavior'].includes(module) && write) req.body.teacherId = actor._id;
  };
  try { await run(); next(); } catch (error) { next(error); }
};
