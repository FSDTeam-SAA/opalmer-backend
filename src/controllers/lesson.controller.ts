import AppError from "../errors/AppError";
import { Class } from "../models/class.model";
import { Lesson } from "../models/lesson.model";
import { StuAssignToClass } from "../models/stuAssignToClass.model";
import { User } from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import { uploadToCloudinary } from "../utils/cloudinary";
import sendResponse from "../utils/sendResponse";


const createLesson = catchAsync(async (req, res) => {
  try {
    const { _id: userId } = req.user as any;
    const { studentId, classId } = req.body;

    const teacher = await User.findById(userId);
    if (!teacher) {
      throw new AppError(400, "Teacher not found");
    }

    const student = await User.findById(studentId);
    if (!student) {
      throw new AppError(400, "Student not found");
    }

    const isClassExist = await Class.findById(classId);
    if (!isClassExist) {
      throw new AppError(400, "Class not found");
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
      classId,
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
      })
      .populate({
        path: "classId",
        select: "subject grade",
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
      })
      .populate({
        path: "classId",
        select: "subject grade",
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

const getAllLessons = catchAsync(async (req, res) => {
  try {
    const result = await Lesson.find()
      .populate({
        path: "studentId",
        select: "username email role type",
      })
      .populate({
        path: "teacherId",
        select: "username email role type",
      })
      .populate({
        path: "classId",
        select: "subject grade",
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

const getSingleLesson = catchAsync(async (req, res) => {
  try {
    const { lessonId } = req.params;

    const result = await Lesson.findById(lessonId)
      .populate({
        path: "studentId",
        select: "username email role type",
      })
      .populate({
        path: "teacherId",
        select: "username email role type",
      })
      .populate({
        path: "classId",
        select: "subject grade",
      });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Lesson fetched successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const updateLesson = catchAsync(async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { studentId, objective, note, classId } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new AppError(400, "Lesson not found");
    }

    const student = await User.findById(studentId);
    if (!student) {
      throw new AppError(400, "Student not found");
    }

    const isExistingClass = await Class.findById(classId);
    if (!isExistingClass) {
      throw new AppError(400, "Class not found");
    }

    let document = { public_id: "", url: "" };
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.path);

      if (uploadResult) {
        document = {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
        };
      }
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      {
        studentId,
        objective,
        note,
        document,
        classId
      },
      { new: true }
    );

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Lesson updated successfully",
      data: updatedLesson,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const deleteLesson = catchAsync(async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new AppError(400, "Lesson not found");
    }

    const deletedLesson = await Lesson.findByIdAndDelete(lessonId);
    if (!deletedLesson) {
      throw new AppError(404, "Lesson not found");
    }

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Lesson deleted successfully",
      data: null,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});


const getLessonsByClass = catchAsync(async (req, res) => {
  try {
    const { classId } = req.params;

    const result = await Lesson.find({ classId })
      .populate({
        path: "studentId",
        select: "username email role type",
      })
      .populate({
        path: "teacherId",
        select: "username email role type",
      })
      .populate({
        path: "classId",
        select: "subject grade",
      });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Class Lessons fetched successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});


const updateLessonStatus = catchAsync(async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new AppError(400, "Lesson not found");
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      [
        {
          $set: {
            isArchived: { $not: ["$isArchived"] },
          },
        },
      ],
      { new: true }
    );

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Lesson status updated to ${updatedLesson!.isArchived ? "archived" : "active"}`,
      data: updatedLesson,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});



const lessonController = {
  createLesson,
  getLessonsByTeacher,
  getLessonsByStudent,
  getAllLessons,
  getSingleLesson,
  updateLesson,
  deleteLesson,
  getLessonsByClass,
  updateLessonStatus
  getLessonsByClass
};

export default lessonController;
