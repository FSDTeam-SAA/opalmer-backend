"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeStudentFromClass = exports.getStudentByClass = exports.getClassesByStudent = exports.assignStudentToClass = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const stuAssignToClass_model_1 = require("../models/stuAssignToClass.model");
/******************************
 * ASSIGN STUDENT TO CLASS *
 ******************************/
exports.assignStudentToClass = (0, catchAsync_1.default)(async (req, res) => {
    const { studentId, classId } = req.body;
    if (!studentId || !classId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'studentId and classId are required');
    }
    // Check if already assigned
    const existingAssignment = await stuAssignToClass_model_1.StuAssignToClass.findOne({
        studentId,
        classId,
    });
    if (existingAssignment) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, 'Student already assigned to this class');
    }
    const newAssignment = await stuAssignToClass_model_1.StuAssignToClass.create({ studentId, classId });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Student assigned to class successfully',
        data: newAssignment,
    });
});
/******************************
 * GET CLASSES BY STUDENT ID *
 ******************************/
exports.getClassesByStudent = (0, catchAsync_1.default)(async (req, res) => {
    const { studentId } = req.params;
    const assignments = await stuAssignToClass_model_1.StuAssignToClass.find({ studentId })
        .populate('classId', 'grade subject section schedule')
        .populate('studentId', 'username email');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Classes for student fetched successfully',
        data: assignments,
    });
});
/******************************
 * GET STUDENTS BY CLASS ID *
 ******************************/
exports.getStudentByClass = (0, catchAsync_1.default)(async (req, res) => {
    const { classId } = req.params;
    const assignments = await stuAssignToClass_model_1.StuAssignToClass.find({ classId })
        .populate('classId', 'grade subject section schedule')
        .populate('studentId', '-password_reset_token -refreshToken -verificationInfo');
    if (!assignments) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No students found for this class');
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Students for class fetched successfully',
        data: assignments,
    });
});
/***************************
 * REMOVE STUDENT ASSIGNMENT *
 ***************************/
exports.removeStudentFromClass = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const deletedAssignment = await stuAssignToClass_model_1.StuAssignToClass.findByIdAndDelete(id);
    if (!deletedAssignment) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Assignment not found');
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Student removed from class successfully',
        data: null,
    });
});
