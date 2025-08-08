import AppError from "../errors/AppError";
import { Behavior } from "../models/behavior.model";
import { User } from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";

const createBehavior = catchAsync(async (req, res) => {
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

    const result = await Behavior.create({
      studentId,
      teacherId: userId,
      ...req.body,
    });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Behavior created successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const behaviorController = {
  createBehavior,
};

export default behaviorController;
