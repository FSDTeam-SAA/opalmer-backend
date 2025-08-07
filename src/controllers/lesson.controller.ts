import AppError from "../errors/AppError";
import { Lesson } from "../models/lesson.model";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";

const createLesson = catchAsync(async (req, res) => {
  try {
    const { teacherId } = req.user;
    console.log(req.user);
    const result = await Lesson.create(req.body);

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

const lessonController = {
  createLesson,
};

export default lessonController;
