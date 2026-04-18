import { Request, Response } from "express";
import { User } from "../models/user.model";
import AppError from "../errors/AppError";
import catchAsync from "../utils/catchAsync";
import { uploadToCloudinary } from "../utils/cloudinary";
import jwt from "jsonwebtoken";
import school from "../models/school.model";
import sendResponse from "../utils/sendResponse";
import httpStatus from "http-status";

/*****************
 * REGISTER USER *
 *****************/
export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const {
    username,
    phoneNumber,
    type,
    gradeLevel,
    Id,
    age,
    password,
    email,
    role,
    schoolId,
    gender,
  } = req.body;

  // Validate required fields
  if (!username || !Id  || !password) {
    throw new AppError(
      400,
      "All fields (username, Id, age, state, password) are required."
    );
  }

  if (role === "admin") {
    throw new AppError(400, "You cannot register as an admin.");
  }

  // Check if username already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new AppError(409, "Username already exists");
  }

  // Handle image upload
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
  // Check if user is a student or teacher and schoolId is missing
  if (type === "student" || role === "teacher") {
    if (!schoolId) {
      throw new AppError(
        400,
        `School ID is required for ${type} registration.`
      );
    }

    const isSchoolExists = await school.findById(schoolId);
    if (!isSchoolExists) {
      throw new AppError(400, "School not found");
    }
  }

  // Create user
  const user = await User.create({
    username,
    Id,
    age,
    password,
    avatar,
    phoneNumber,
    type,
    gradeLevel,
    email,
    role,
    schoolId,
    gender,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      id: user._id,
      schoolId: user.schoolId,
      username: user.username,
      type: user.type,
      role: user.role,
      age: user.age,
      state: user.state,
      avatar: user.avatar,
      created_at: user.created_at,
    },
  });
});

/**************
 * LOGIN USER *
 **************/
export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { Id, password } = req.body;

  // Validate input
  if (!Id || !password) {
    throw new AppError(400, "Id and password are required.");
  }

  // Find user by Id
  const user = await User.findOne({ Id }).select("+password");
  if (!user) {
    throw new AppError(401, "Invalid Id or password.");
  }
  if (user.isActive === false) {
    throw new AppError(401, "Your account has been Deactivated.");
  }

  // Compare password
  const isPasswordMatched = await User.isPasswordMatched(
    password,
    user.password
  );
  if (!isPasswordMatched) {
    throw new AppError(401, "Invalid Id or password.");
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, role: user.role, type: user.type, Id: user.Id },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "7d" }
  );

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        Id: user.Id,
        role: user.role,
        type: user.type,
        state: user.state,
        avatar: user.avatar,
      },
    },
  });
});

// Search student by Id
export const searchStudentById = catchAsync(async (req: Request, res: Response) => {
  const { Id } = req.query;
  if (!Id || typeof Id !== "string") {
    throw new AppError(400, "Student Id query parameter is required.");
  }

  // Exact match (case insensitive) for the student 'Id'
  const students = await User.find({ Id: new RegExp(`^${Id}$`, "i"), type: "student" })
    .select("username Id gradeLevel age avatar");

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student search result",
    data: students,
  });
});

// Get all administrators
export const getAllAdministrators = catchAsync(
  async (_req: Request, res: Response) => {
    const admins = await User.find({ role: "administrator" }).select(
      "username email phoneNumber type state avatar created_at"
    );

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Administrators fetched successfully",
      data: admins,
    });
  }
);

export const getMySchoolAllStudents = catchAsync(
  async (req: Request, res: Response) => {
    const { _id: userId } = req.user as { _id: string; userId?: string };

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    const shoolExists = await school
      .find({ administrator: user._id })
      .select("_id");
    if (!shoolExists) {
      throw new AppError(404, "School not found");
    }

    const students = await User.find({
      schoolId: { $in: shoolExists.map((s) => s._id) },
      type: "student",
    }).select("username Id phoneNumber gradeLevel age");

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Students fetched successfully",
      data: students,
    });
  }
);

export const getMySchoolAllTeachers = catchAsync(
  async (req: Request, res: Response) => {
    const { _id: userId } = req.user as { _id: string; userId?: string };

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    const shoolExists = await school
      .find({ administrator: user._id })
      .select("_id");
    if (!shoolExists) {
      throw new AppError(404, "School not found");
    }

    const teachers = await User.find({
      schoolId: { $in: shoolExists.map((s) => s._id) },
      type: "teacher",
    }).select("username Id phoneNumber gradeLevel age");

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Teachers fetched successfully",
      data: teachers,
    });
  }
);

// Update user info
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: Record<string, any> = { ...req.body };

  // Disallow updating restricted fields
  const restrictedFields = [
    "password",
    "role",
    "refreshToken",
    "verificationInfo",
  ];
  restrictedFields.forEach((field) => delete updateData[field]);

  // If a new avatar image is uploaded, push it to Cloudinary and merge into avatar
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.path);
    if (uploadResult) {
      updateData.avatar = {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
      };
    }
  }

  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "User not found",
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully",
    data: user,
  });
});
