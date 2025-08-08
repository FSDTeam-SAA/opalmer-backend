import AppError from "../errors/AppError";
import { Lesson } from "../models/lesson.model";
import { User } from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import { uploadToCloudinary } from "../utils/cloudinary";
import sendResponse from "../utils/sendResponse";

const createLesson = catchAsync(async (req, res) => {
  try {
    const { _id: userId } = req.user as any;
    const { studentId } = req.body;

    const teacher = await User.findById(userId);
    if (!teacher) {
      throw new AppError(400, "Teacher not found");
    }

    const student = await User.findById(studentId);
    if (!student) {
      throw new AppError(400, "Student not found");
    }

    let document = { public_id: "", url: "" };
    if (req.file) {
      console.log(req.file);
      const uploadResult = await uploadToCloudinary(req.file.path);
      console.log(12, uploadResult);

      if (uploadResult) {
        document = {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
        };
      }
    }

    const result = await Lesson.create({
      ...req.body,
      teacherId: userId,
      studentId,
      document,
    });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Lesson created successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const getLessonsByTeacher = catchAsync(async (req, res) => {
  try {
    const { _id: teacherId } = req.user as any;

    const teacher = await User.findById(teacherId);
    if (!teacher) {
      throw new AppError(400, "Teacher not found");
    }

    const result = await Lesson.find({ teacherId })
      .populate({
        path: "studentId",
        select: "username email role type",
      })
      .populate({
        path: "teacherId",
        select: "username email role type",
      });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Lessons fetched successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const getLessonsByStudent = catchAsync(async (req, res) => {
  try {
    const { _id: studentId } = req.user as any;

    const student = await User.findById(studentId);
    if (!student) {
      throw new AppError(400, "Student not found");
    }

    const result = await Lesson.find({ studentId })
      .populate({
        path: "studentId",
        select: "username email role type",
      })
      .populate({
        path: "teacherId",
        select: "username email role type",
      });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Lessons fetched successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const lessonController = {
  createLesson,
  getLessonsByTeacher,
  getLessonsByStudent,
};

export default lessonController;
