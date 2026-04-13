"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassesByStudent = exports.deleteClass = exports.getgradeWiseClasses = exports.updateClass = exports.getClassesByTeacher = exports.getAllClasses = exports.createClass = void 0;
const class_model_1 = require("../models/class.model");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const user_model_1 = require("../models/user.model");
/******************
 * CREATE CLASS *
 ******************/
exports.createClass = (0, catchAsync_1.default)(async (req, res) => {
    const { teacherId, grade, subject, section, schedule } = req.body;
    if (!teacherId || !grade || !subject) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'teacherId, grade, and subject are required');
    }
    const newClass = await class_model_1.Class.create({
        teacherId,
        grade,
        subject,
        section,
        schedule,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Class created successfully',
        data: newClass,
    });
});
/*********************
 * GET ALL CLASSES *
 *********************/
exports.getAllClasses = (0, catchAsync_1.default)(async (req, res) => {
    const classes = await class_model_1.Class.find().populate('teacherId', 'username email');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'All classes fetched successfully',
        data: classes,
    });
});
/******************************
 * GET CLASSES BY TEACHER ID *
 ******************************/
exports.getClassesByTeacher = (0, catchAsync_1.default)(async (req, res) => {
    const { teacherId } = req.params;
    const classes = await class_model_1.Class.find({ teacherId }).populate('teacherId', 'username email');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Classes fetched successfully',
        data: classes,
    });
});
/******************
 * UPDATE CLASS *
 ******************/
exports.updateClass = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const { grade, subject, section, schedule } = req.body;
    const updatedClass = await class_model_1.Class.findByIdAndUpdate(id, { grade, subject, section, schedule }, { new: true });
    if (!updatedClass) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Class not found');
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Class updated successfully',
        data: updatedClass,
    });
});
/**************************
 * GET GRADE WISE CLASSES *
 **************************/
exports.getgradeWiseClasses = (0, catchAsync_1.default)(async (req, res) => {
    const studentId = req.user?._id;
    const student = await user_model_1.User.findById(studentId).select('grade');
    console.log(1, student);
    if (!student) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Student not found');
    }
    const grade = student.gradeLevel;
    console.log(11, grade);
    const classes = await class_model_1.Class.find({ grade }).populate('teacherId', '-password_reset_token -refreshToken -verificationInfo');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Classes fetched successfully',
        data: classes,
    });
});
/******************
 * DELETE CLASS *
 ******************/
exports.deleteClass = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const deletedClass = await class_model_1.Class.findByIdAndDelete(id);
    if (!deletedClass) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Class not found');
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Class deleted successfully',
        data: null,
    });
});
/*********************************
 * GET CLASSES BY STUDENT ID *
 *********************************/
exports.getClassesByStudent = (0, catchAsync_1.default)(async (req, res) => {
    const { studentId } = req.params;
    // Find student and get their grade
    const student = await user_model_1.User.findById(studentId).select('gradeLevel username email');
    if (!student) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Student not found');
    }
    // Get classes matching student's grade
    const classes = await class_model_1.Class.find({ grade: student.gradeLevel }).populate('teacherId', 'username email');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Classes for student ${student.username} fetched successfully`,
        data: {
            student,
            classes,
        },
    });
});
