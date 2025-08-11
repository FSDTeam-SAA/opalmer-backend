import AppError from "../errors/AppError";
import school from "../models/school.model";
import { User } from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";

const createSchool = catchAsync(async (req, res) => {
  const { _id: userId } = req.user as any;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(400, "User not found");
  }

  if (user.role !== "administrator") {
    throw new AppError(400, "Only administrators can create a school");
  }

  const result = await school.create({
    administrator: userId,
    ...req.body,
  });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "School created successfully",
    data: result,
  });
});

const schoolController = {
  createSchool,
};

export default schoolController;
