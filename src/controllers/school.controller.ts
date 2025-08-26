import AppError from "../errors/AppError";
import school from "../models/school.model";
import { User } from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";

const createSchool = catchAsync(async (req, res) => {
  try {
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
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const getAllSchools = catchAsync(async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    // Filters
    const filter: any = {};
    if (search) {
      filter.name = { $regex: search as string, $options: "i" }; // case-insensitive search
    }

    // Pagination values
    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Get total count
    const total = await school.countDocuments(filter);

    // Fetch with filter, pagination & populate
    const result = await school
      .find(filter)
      .populate({
        path: "administrator",
        select: "username Id role type",
      })
      .skip(skip)
      .limit(pageSize)
      .sort({ created_at: -1 });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Schools fetched successfully",
      data: result,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const getMySchool = catchAsync(async (req, res) => {
  try {
    const { _id: userId } = req.user as any;
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(400, "User not found");
    }

    const result = await school.findOne({ administrator: user._id }).populate({
      path: "administrator",
      select: "username Id role type",
    });
    if (!result) {
      throw new AppError(404, "School not found");
    }

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "School fetched successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const getSingleSchool = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await school.findById(id);
    if (!result) {
      throw new AppError(404, "School not found");
    }
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "School get successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const updateSchool = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await school.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!result) {
      throw new AppError(404, "School not found");
    }
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "School updated successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const schoolController = {
  createSchool,
  getAllSchools,
  getMySchool,
  getSingleSchool,
  updateSchool,
};

export default schoolController;
