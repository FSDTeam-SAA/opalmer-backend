import AppError from "../errors/AppError";
import Parent from "../models/parent.model";
import school from "../models/school.model";
import { User } from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";

const addParent = catchAsync(async (req, res) => {
  try {
    const { childrenId } = req.body;

    const childrenExist = await User.findById(childrenId);
    if (!childrenExist) {
      throw new AppError(400, "Children not found");
    }

    const result = await Parent.create({
      ...req.body,
      children: childrenId,
      school: childrenExist.schoolId,
    });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Parent added successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const parentController = {
  addParent,
};

export default parentController;
