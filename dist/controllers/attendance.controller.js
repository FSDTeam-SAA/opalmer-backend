"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentAttendance = exports.changeAttendanceStatus = exports.getAllAttendance = exports.createClassAttendance = void 0;
const AppError_1 = __importDefault(require("../errors/AppError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const attendance_model_1 = require("../models/attendance.model");
const stuAssignToClass_model_1 = require("../models/stuAssignToClass.model");
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const pagination_1 = require("../utils/pagination");
/**************************************
 * CREATE ATTENDANCE FOR ENTIRE CLASS *
 **************************************/
exports.createClassAttendance = (0, catchAsync_1.default)(async (req, res) => {
    const { classId, date } = req.body;
    if (!classId)
        throw new AppError_1.default(400, 'Class Id is required');
    // find all the student in the class
    const assignStudent = await stuAssignToClass_model_1.StuAssignToClass.find({ classId }).populate('studentId', '_id');
    if (assignStudent.length === 0) {
        throw new AppError_1.default(404, 'No students found for this class');
    }
    const attendanceDate = date ? new Date(date) : new Date();
    // Provent duplicate attendance for same date and class
    const existingRecords = await attendance_model_1.Attendance.find({
        classId,
        date: {
            $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
            $lt: new Date(attendanceDate.setHours(23, 59, 59, 999)),
        },
    });
    if (existingRecords.length > 0) {
        throw new AppError_1.default(409, 'Attendance for this class on this date already exists');
    }
    // Prepare attendance documents
    const attendanceDocument = assignStudent.map((stu) => ({
        classId,
        userId: stu.studentId._id,
        present: 'absent',
        date: attendanceDate,
    }));
    // Insert all data
    await attendance_model_1.Attendance.insertMany(attendanceDocument);
    res.status(201).json({
        success: true,
        message: 'Attendance created for all students in class',
        data: attendanceDocument,
    });
});
/*************************
 * // GET ALL ATTENDANCE *
 *************************/
exports.getAllAttendance = (0, catchAsync_1.default)(async (req, res) => {
    const { classId, date } = req.query;
    const targetDate = date ? new Date(date.toString()) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    const attendance = await attendance_model_1.Attendance.find({
        classId,
        date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (attendance.length === 0) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No attendance found for this date');
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Attendance fetched successfully',
        data: attendance,
    });
});
/****************************
 * CHANGE ATTENDANCE STATUS *
 ****************************/
exports.changeAttendanceStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const { present } = req.body;
    if (id === undefined) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Attendance Id is required');
    }
    const updatedAttendance = await attendance_model_1.Attendance.findByIdAndUpdate(id, { present }, { new: true });
    if (!updatedAttendance) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Attendance not found');
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Attendance status updated successfully',
        data: updatedAttendance,
    });
});
/*********************************
 * GET ATTENDANCE FOR A STUDENT  *
 *********************************/
exports.getStudentAttendance = (0, catchAsync_1.default)(async (req, res) => {
    const { userId, classId } = req.query;
    if (!userId || !classId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'userId and classId are required');
    }
    // Pagination params
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req.query);
    // Fetch total count for pagination
    const totalItems = await attendance_model_1.Attendance.countDocuments({ userId, classId });
    // Fetch paginated data (latest first)
    const attendanceRecords = await attendance_model_1.Attendance.find({ userId, classId })
        .sort({ date: -1 }) // latest first
        .skip(skip)
        .limit(limit);
    if (attendanceRecords.length === 0) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No attendance records found');
    }
    const meta = (0, pagination_1.buildMetaPagination)(totalItems, page, limit);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Student attendance fetched successfully',
        data: { attendanceRecords, meta },
    });
});
