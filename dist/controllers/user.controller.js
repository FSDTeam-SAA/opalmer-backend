"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.getMySchoolAllTeachers = exports.getMySchoolAllStudents = exports.getAllAdministrators = exports.loginUser = exports.registerUser = void 0;
const user_model_1 = require("../models/user.model");
const AppError_1 = __importDefault(require("../errors/AppError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const cloudinary_1 = require("../utils/cloudinary");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const school_model_1 = __importDefault(require("../models/school.model"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
/*****************
 * REGISTER USER *
 *****************/
exports.registerUser = (0, catchAsync_1.default)(async (req, res) => {
    const { username, phoneNumber, type, gradeLevel, Id, age, password, email, role, schoolId, gender, } = req.body;
    // Validate required fields
    if (!username || !Id || !age || !password) {
        throw new AppError_1.default(400, "All fields (username, Id, age, state, password) are required.");
    }
    if (role === "admin") {
        throw new AppError_1.default(400, "You cannot register as an admin.");
    }
    // Check if username already exists
    const existingUser = await user_model_1.User.findOne({ username });
    if (existingUser) {
        throw new AppError_1.default(409, "Username already exists");
    }
    // Handle image upload
    let avatar = { public_id: "", url: "" };
    if (req.file) {
        const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.path);
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
            throw new AppError_1.default(400, `School ID is required for ${type} registration.`);
        }
        const isSchoolExists = await school_model_1.default.findById(schoolId);
        if (!isSchoolExists) {
            throw new AppError_1.default(400, "School not found");
        }
    }
    // Create user
    const user = await user_model_1.User.create({
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
exports.loginUser = (0, catchAsync_1.default)(async (req, res) => {
    const { Id, password } = req.body;
    // Validate input
    if (!Id || !password) {
        throw new AppError_1.default(400, "Id and password are required.");
    }
    // Find user by Id
    const user = await user_model_1.User.findOne({ Id }).select("+password");
    if (!user) {
        throw new AppError_1.default(401, "Invalid Id or password.");
    }
    if (user.isActive === false) {
        throw new AppError_1.default(401, "Your account has been Deactivated.");
    }
    // Compare password
    const isPasswordMatched = await user_model_1.User.isPasswordMatched(password, user.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(401, "Invalid Id or password.");
    }
    // Generate JWT token
    const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role, type: user.type, Id: user.Id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "7d" });
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
                state: user.state,
                avatar: user.avatar,
            },
        },
    });
});
// Get all administrators
exports.getAllAdministrators = (0, catchAsync_1.default)(async (_req, res) => {
    const admins = await user_model_1.User.find({ role: "administrator" }).select("username email phoneNumber type state avatar created_at");
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Administrators fetched successfully",
        data: admins,
    });
});
exports.getMySchoolAllStudents = (0, catchAsync_1.default)(async (req, res) => {
    const { _id: userId } = req.user;
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(404, "User not found");
    }
    const shoolExists = await school_model_1.default
        .find({ administrator: user._id })
        .select("_id");
    if (!shoolExists) {
        throw new AppError_1.default(404, "School not found");
    }
    const students = await user_model_1.User.find({
        schoolId: { $in: shoolExists.map((s) => s._id) },
        type: "student",
    }).select("username Id phoneNumber gradeLevel age");
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Students fetched successfully",
        data: students,
    });
});
exports.getMySchoolAllTeachers = (0, catchAsync_1.default)(async (req, res) => {
    const { _id: userId } = req.user;
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(404, "User not found");
    }
    const shoolExists = await school_model_1.default
        .find({ administrator: user._id })
        .select("_id");
    if (!shoolExists) {
        throw new AppError_1.default(404, "School not found");
    }
    const teachers = await user_model_1.User.find({
        schoolId: { $in: shoolExists.map((s) => s._id) },
        type: "teacher",
    }).select("username Id phoneNumber gradeLevel age");
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Teachers fetched successfully",
        data: teachers,
    });
});
// Update user info
exports.updateUser = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    // Disallow updating restricted fields
    const restrictedFields = [
        "password",
        "role",
        "refreshToken",
        "verificationInfo",
    ];
    restrictedFields.forEach((field) => delete updateData[field]);
    const user = await user_model_1.User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    }).select("-password -refreshToken");
    if (!user) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: "User not found",
        });
    }
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User updated successfully",
        data: user,
    });
});
