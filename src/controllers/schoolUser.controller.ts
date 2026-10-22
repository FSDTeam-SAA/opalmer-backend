import AppError from "../errors/AppError";
import { User } from "../models/user.model";
import { Class } from "../models/class.model";
import { StuAssignToClass } from "../models/stuAssignToClass.model";
import { ParentsChild } from "../models/parentsChild.model";
import { Attendance } from "../models/attendance.model";
import { QuizResult } from "../models/quizResult.model";
import { Quiz } from "../models/quiz.model";
import { Lesson } from "../models/lesson.model";
import { Homework } from "../models/homework.model";
import { Submission } from "../models/submission.model";
import AcademicDocument from "../models/academicDocument.model";
import { Behavior } from "../models/behavior.model";
import { GuardianInvitation } from "../models/guardianInvitation.model";
import { GroupWork } from "../models/groupWork.model";
import { Room } from "../models/room.model";
import { assertSchool, objectId } from "../services/access.service";
import { disconnectUser } from "../services/realtime.service";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";

export const deleteSchoolUser = catchAsync(async (req, res) => {
  const actor = req.user!;
  if (!["admin", "administrator"].includes(actor.role)) throw new AppError(403, "Only administrators can delete school users");
  const { type, id } = req.params;
  if (!["students", "teachers", "parents"].includes(String(type))) throw new AppError(400, "Invalid user type");
  const userType = String(type).slice(0, -1);
  const target = await User.findOne({ _id: objectId(id, "user ID"), role: "user", type: userType });
  if (!target) throw new AppError(404, "User not found");
  assertSchool(actor, target.schoolId);

  // Preserve existing academic history. Unused/imported accounts can be deleted;
  // established accounts should be deactivated until their records are resolved.
  const references = await Promise.all([
    Class.exists({ teacherId: target._id }),
    StuAssignToClass.exists({ studentId: target._id }),
    ParentsChild.exists({ $or: [{ parentId: target._id }, { childId: target._id }] }),
    Attendance.exists({ userId: target._id }),
    QuizResult.exists({ studentId: target._id }),
    Quiz.exists({ teacherId: target._id }),
    Lesson.exists({ $or: [{ teacherId: target._id }, { studentId: target._id }] }),
    Homework.exists({ $or: [{ userId: target._id }, { studentIds: target._id }] }),
    Submission.exists({ studentId: target._id }),
    AcademicDocument.exists({ $or: [{ teacherId: target._id }, { studentId: target._id }] }),
    Behavior.exists({ $or: [{ teacherId: target._id }, { studentId: target._id }] }),
    GroupWork.exists({ userId: target._id }),
    Room.exists({ $or: [{ "participants.userId": target._id }, { createdBy: target._id }] }),
  ]);
  if (references.some(Boolean)) throw new AppError(409, "This account has linked class, child, academic or chat records. Resolve those records first, or deactivate the account.");

  await GuardianInvitation.deleteMany({ $or: [{ childId: target._id }, { usedBy: target._id }] });
  await User.findOneAndDelete({ _id: target._id, role: "user", type: userType, schoolId: target.schoolId });
  disconnectUser(String(target._id));
  return sendResponse(res, { statusCode: 200, success: true, message: "User deleted successfully", data: null });
});
