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

    const teacherSchool = await User.findById(user.schoolId);
    if (!teacherSchool) {
      throw new AppError(400, "You are not a teacher of any school");
    }

    const school = await User.findById(user.schoolId);
    if (!school) {
      throw new AppError(400, "You are not a student of any school");
    }

    if (user.schoolId !== student.schoolId) {
      throw new AppError(
        400,
        "You can't upload academic documents for a student from another school"
      );
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

    const academicDocument = await AcademicDocument.create({
      studentId,
      schoolId: user.schoolId,
      document,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Academic document created successfully",
      data: academicDocument,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const academicDocumentController = {
  createAcademicDocument,
};

export default academicDocumentController;
