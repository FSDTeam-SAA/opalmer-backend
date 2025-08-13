import AppError from "../errors/AppError";
import AcademicDocument from "../models/academicDocument.model";
import { User } from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import { uploadToCloudinary } from "../utils/cloudinary";
import sendResponse from "../utils/sendResponse";

const createAcademicDocument = catchAsync(async (req, res) => {
  try {
    const { studentId } = req.body;
    const { _id: userId } = req.user as any;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(400, "Teacher not found");
    }

    if (user.schoolId === null) {
      throw new AppError(400, "You are not a teacher of any school");
    }

    const student = await User.findById(studentId);
    if (!student) {
      throw new AppError(400, "Student not found");
    }

    if (student.type !== "student") {
      throw new AppError(
        400,
        "You can only upload academic documents for students"
      );
    }

    if (student.schoolId === null) {
      throw new AppError(400, "Student is not enrolled in any school");
    }

    if (String(user.schoolId) !== String(student.schoolId)) {
      throw new AppError(
        400,
        "You can't upload academic documents for a student from another school"
      );
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

    const academicDocument = await AcademicDocument.create({
      teacherId: user._id,
      studentId,
      schoolId: user.schoolId,
      document,
    });

    const populatedDocument = await AcademicDocument.findById(
      academicDocument._id
    )
      .populate({
        path: "studentId",
        select: "username Id gradeLevel schoolId",
        populate: {
          path: "schoolId",
          select: "name",
        },
      })
      .populate({
        path: "schoolId",
        select: "name",
      });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Academic document created successfully",
      data: populatedDocument,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const getAcademicDocumentForStudent = catchAsync(async (req, res) => {
  try {
    const { _id: userId } = req.user as any;
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(400, "Student not found");
    }

    const result = await AcademicDocument.find({ studentId: user._id });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Academic documents fetched successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const getAcademicDocumentForTeacher = catchAsync(async (req, res) => {
  try {
    const { _id: userId } = req.user as any;
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(400, "Teacher not found");
    }

    const result = await AcademicDocument.find({
      teacherId: user._id,
    })
      .populate({
        path: "studentId",
        select: "username Id gradeLevel",
      })
      .populate({
        path: "schoolId",
        select: "name",
      });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Academic documents fetched successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const academicDocumentController = {
  createAcademicDocument,
  getAcademicDocumentForStudent,
  getAcademicDocumentForTeacher,
};

export default academicDocumentController;
