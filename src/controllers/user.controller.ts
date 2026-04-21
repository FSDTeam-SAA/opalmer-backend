import bcrypt from "bcrypt";
import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import AppError from "../errors/AppError";
import { IUser } from "../interface/user.interface";
import school from "../models/school.model";
import { User } from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import { uploadToCloudinary } from "../utils/cloudinary";

import sendEmail from "../utils/sendEmail";
import sendResponse from "../utils/sendResponse";
import verificationCodeTemplate from "../utils/verificationCodeTemplate";

// Shared shape for auth + profile responses. Keep this in one place so the
// login, /me and update endpoints hand the client identical fields.
const toPublicUser = (user: IUser) => ({
  id: user._id,
  username: user.username,
  Id: user.Id,
  role: user.role,
  type: user.type,
  state: user.state,
  email: user.email,
  phoneNumber: user.phoneNumber,
  age: user.age,
  gradeLevel: user.gradeLevel,
  gender: user.gender,
  schoolId: user.schoolId,
  avatar: user.avatar,
  isActive: user.isActive,
  created_at: user.created_at,
  updated_at: user.updated_at,
  isTwoFactorAuthEnabled: user.isTwoFactorAuthEnabled,
});

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

  if (user.isTwoFactorAuthEnabled) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  user.hashedOtp = hashedOtp;
  user.otpExpires = otpExpires;
  await user.save();

  try {
    await sendEmail({
      to: user.email as string,
      subject: "Your 2FA Verification Code",
      html: verificationCodeTemplate(otp),
    });
  } catch (err: any) {
    throw new AppError(500, "Could not send 2FA verification email");
  }
  return res.status(200).json({
    success: true,
    message: "Verification code sent to your email",
    data: {
      accessToken: token,
      is2FA: true,
    },
  });
}

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: toPublicUser(user),
    },
  });
});

/*************************
 * GET CURRENT USER (ME) *
 *************************/
export const getMe = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as unknown as IUser | undefined;
  if (!authUser?._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const user = await User.findById(authUser._id).select(
    "-password -refreshToken -verificationInfo -password_reset_token"
  );
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Current user fetched successfully",
    data: toPublicUser(user),
  });
});

/*******************
 * CHANGE PASSWORD *
 *******************/
export const changePassword = catchAsync(
  async (req: Request, res: Response) => {
    const authUser = req.user as unknown as IUser | undefined;
    if (!authUser?._id) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const { oldPassword, newPassword } = req.body as {
      oldPassword?: string;
      newPassword?: string;
    };

    if (!oldPassword || !newPassword) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "oldPassword and newPassword are required."
      );
    }
    if (newPassword.length < 6) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "New password must be at least 6 characters long."
      );
    }
    if (oldPassword === newPassword) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "New password must be different from the old password."
      );
    }

    const user = await User.findById(authUser._id).select("+password");
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const matches = await User.isPasswordMatched(oldPassword, user.password);
    if (!matches) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Current password is incorrect."
      );
    }

    // The pre-save hook on User hashes this before persistence.
    user.password = newPassword;
    await user.save();

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password updated successfully",
    });
  }
);

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

/****************************
 * ASSIGN TEACHER TO SCHOOL *
 ****************************/
export const assignTeacherToSchool = catchAsync(
  async (req: Request, res: Response) => {
    const authUser = req.user as unknown as IUser | undefined;
    const { teacherId, schoolId } = req.body as {
      teacherId?: string;
      schoolId?: string;
    };

    if (!authUser?._id) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!teacherId || !schoolId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "teacherId and schoolId are required"
      );
    }

    const targetSchool = await school.findById(schoolId);
    if (!targetSchool) {
      throw new AppError(httpStatus.NOT_FOUND, "School not found");
    }

    if (
      authUser.role === "administrator" &&
      targetSchool.administrator?.toString() !== authUser._id.toString()
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only assign teachers to your own school"
      );
    }

    const teacher = await User.findById(teacherId);
    if (!teacher) {
      throw new AppError(httpStatus.NOT_FOUND, "Teacher not found");
    }

    if (teacher.type !== "teacher") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Selected user is not a teacher"
      );
    }

    teacher.schoolId = targetSchool._id;
    await teacher.save();

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Teacher assigned to school successfully",
      data: toPublicUser(teacher),
    });
  }
);

// Update user info
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const authUser = req.user as unknown as IUser | undefined;

  if (!authUser?._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  // Owner-only: a user may update their own profile; administrators may
  // update anyone's. This guards against the historical "any token updates
  // any user" bug when the route had no protect middleware.
  const isOwner = authUser._id.toString() === id;
  const isAdmin = authUser.role === "administrator" || authUser.role === "admin";
  if (!isOwner && !isAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not allowed to update this user."
    );
  }

  const updateData: Record<string, any> = { ...req.body };

  // Fields clients must never mutate through this endpoint.
  const restrictedFields = [
    "password",
    "role",
    "refreshToken",
    "verificationInfo",
    "password_reset_token",
    "isActive",
    "Id",
    "schoolId",
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
  }).select("-password -refreshToken -verificationInfo -password_reset_token");

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
    data: toPublicUser(user),
  });
});

/*********************************
 * GET STUDENT COUNT BY GRADE LEVEL *
 *********************************/
export const getStudentCountByGrade = catchAsync(async (req: Request, res: Response) => {
  const { grade } = req.params;
  
  const count = await User.countDocuments({
    type: "student",
    gradeLevel: Number(grade),
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student count fetched successfully",
    data: { count },
  });
});

/*********************************
 * GET STUDENTS BY GRADE LEVEL *
 *********************************/
export const getStudentsByGrade = catchAsync(async (req: Request, res: Response) => {
  const { grade } = req.params;

  const students = await User.find({
    type: "student",
    gradeLevel: Number(grade),
  }).select("username Id phoneNumber gradeLevel age avatar");

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Students fetched successfully",
    data: students,
  });
});



export const toggleTwoFactorAuth = catchAsync(async (req: Request, res: Response) => {
  const { _id: userId } = req.user as any;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  user.isTwoFactorAuthEnabled = !user.isTwoFactorAuthEnabled;
  const updatedUser = await user.save();

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Two factor authentication ${updatedUser.isTwoFactorAuthEnabled ? "enabled" : "disabled"} successfully`,
  });
});


export const verifyOTP = catchAsync(async (req: Request, res: Response) => {
  const { _id: userId } = req.user as any;
  const { otp } = req.body;

  console.log("req", userId)

  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized user");
  }

  if (!otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP is required");
  }

  const user = await User.findById(userId).select("+hashedOtp +otpExpires");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // ❌ No OTP requested
  if (!user.hashedOtp || !user.otpExpires) {
    throw new AppError(400, "OTP not requested");
  }

  // ⏰ Expiry check
  if (user.otpExpires < new Date()) {
    throw new AppError(400, "OTP expired");
  }

  // 🔐 Match OTP
  const isOtpMatched = await bcrypt.compare(otp.toString(), user.hashedOtp);

  if (!isOtpMatched) {
    throw new AppError(400, "Invalid OTP");
  }

  // ✅ Clear OTP after success
  user.hashedOtp = undefined;
  user.otpExpires = undefined;

  await user.save();

  // 🎯 FINAL ACCESS TOKEN (IMPORTANT)
  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      type: user.type,
      Id: user.Id,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: {
      token,
      user: toPublicUser(user),
    },
  });
});

/****************
 * GET CONTACTS *
 ****************/
export const getContacts = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as unknown as IUser | undefined;
  if (!authUser?._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const currentUser = await User.findById(authUser._id);
  if (!currentUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let query: any = { 
    _id: { $ne: currentUser._id },
    isActive: true 
  };

  // If user belongs to a school, prioritize school contacts
  if (currentUser.schoolId) {
    query.schoolId = currentUser.schoolId;
  }

  // Role-based filtering logic
  if (currentUser.role === 'teacher') {
    // Teachers can message everyone in their school (students, parents, other teachers)
    // No extra filtering needed for now
  } else if (currentUser.type === 'student') {
    // Students message teachers and other students
    query.$or = [{ role: 'teacher' }, { type: 'student' }];
  } else if (currentUser.role === 'parent') {
    // Parents message teachers
    query.role = 'teacher';
  }

  const contacts = await User.find(query)
    .select("username Id role type avatar phoneNumber email gradeLevel")
    .limit(50);

  const formattedContacts = contacts.map(c => ({
    id: c._id,
    username: c.username,
    role: c.role,
    type: c.type,
    avatar: c.avatar?.url || "",
    phoneNumber: c.phoneNumber,
    email: c.email,
    gradeLevel: c.gradeLevel
  }));

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Contacts fetched successfully",
    data: formattedContacts,
  });
});