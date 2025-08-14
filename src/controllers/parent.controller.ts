import AppError from "../errors/AppError";
import Parent from "../models/parent.model";
import school from "../models/school.model";
import { User } from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import { uploadToCloudinary } from "../utils/cloudinary";
import sendResponse from "../utils/sendResponse";

const addParent = catchAsync(async (req, res) => {
  try {
    const { childrenId } = req.body;

    const childrenExist = await User.findById(childrenId);
    if (!childrenExist) {
      throw new AppError(400, "Children not found");
    }

    let avatar = { public_id: "", url: "" };
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.path);
      if (uploadResult) {
        avatar = {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
        };
      }
    }

    const addParent = await Parent.create({
      ...req.body,
      avatar,
      childrenId: childrenId,
      schoolId: childrenExist.schoolId,
    });

    const result = await Parent.findById(addParent._id)
      .populate({
        path: "childrenId",
        select: "username Id gradeLevel schoolId",
      })
      .populate({
        path: "schoolId",
        select: "name",
      })
      .select("-password");

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
