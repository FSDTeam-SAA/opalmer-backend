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

const getSingleBehavior = catchAsync(async (req, res) => {
  try {
    const { behaviorId } = req.params;

    const behavior = await Behavior.findById(behaviorId);
    if (!behavior) {
      throw new AppError(400, "Behavior not found");
    }

    const result = await Behavior.findById(behaviorId)
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
      message: "Behavior fetched successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const getAllBehaviors = catchAsync(async (req, res) => {
  try {
    const result = await Behavior.find()
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
      message: "Behaviors fetched successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const behaviorController = {
  createBehavior,
  getSingleBehavior,
  getAllBehaviors,
};

export default behaviorController;
