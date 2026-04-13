"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentGenderStats = exports.getUserStats = void 0;
const user_model_1 = require("../models/user.model");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
exports.getUserStats = (0, catchAsync_1.default)(async (_req, res) => {
    // Count each type
    const totalStudents = await user_model_1.User.countDocuments({ type: 'student' });
    const totalParents = await user_model_1.User.countDocuments({ type: 'parent' });
    const totalTeachers = await user_model_1.User.countDocuments({ type: 'teacher' });
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User stats fetched successfully',
        data: {
            totalStudents,
            totalParents,
            totalTeachers,
        },
    });
});
// student count by gender
exports.getStudentGenderStats = (0, catchAsync_1.default)(async (_req, res) => {
    const result = await user_model_1.User.aggregate([
        { $match: { type: 'student' } }, // Only students
        {
            $group: {
                _id: '$gender',
                count: { $sum: 1 },
            },
        },
    ]);
    // Format result as an object for pie chart
    const genderStats = { male: 0, female: 0, other: 0 };
    result.forEach((item) => {
        genderStats[item._id] = item.count;
    });
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Student gender stats fetched successfully',
        data: genderStats,
    });
});
