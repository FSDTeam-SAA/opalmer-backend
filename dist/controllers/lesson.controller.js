"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../errors/AppError"));
const class_model_1 = require("../models/class.model");
const lesson_model_1 = require("../models/lesson.model");
const user_model_1 = require("../models/user.model");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const cloudinary_1 = require("../utils/cloudinary");
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const createLesson = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const { studentId, classId } = req.body;
        const teacher = await user_model_1.User.findById(userId);
        if (!teacher) {
            throw new AppError_1.default(400, "Teacher not found");
        }
        const student = await user_model_1.User.findById(studentId);
        if (!student) {
            throw new AppError_1.default(400, "Student not found");
        }
        const isClassExist = await class_model_1.Class.findById(classId);
        if (!isClassExist) {
            throw new AppError_1.default(400, "Class not found");
        }
        let document = { public_id: "", url: "" };
        if (req.file) {
            console.log(req.file);
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.path);
            console.log(12, uploadResult);
            if (uploadResult) {
                document = {
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                };
            }
        }
        const result = await lesson_model_1.Lesson.create({
            ...req.body,
            teacherId: userId,
            studentId,
            classId,
            document,
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Lesson created successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getLessonsByTeacher = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { _id: teacherId } = req.user;
        const teacher = await user_model_1.User.findById(teacherId);
        if (!teacher) {
            throw new AppError_1.default(400, "Teacher not found");
        }
        const result = await lesson_model_1.Lesson.find({ teacherId })
            .populate({
            path: "studentId",
            select: "username email role type",
        })
            .populate({
            path: "teacherId",
            select: "username email role type",
        })
            .populate({
            path: "classId",
            select: "subject grade",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Lessons fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getLessonsByStudent = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { _id: studentId } = req.user;
        const student = await user_model_1.User.findById(studentId);
        if (!student) {
            throw new AppError_1.default(400, "Student not found");
        }
        const result = await lesson_model_1.Lesson.find({ studentId })
            .populate({
            path: "studentId",
            select: "username email role type",
        })
            .populate({
            path: "teacherId",
            select: "username email role type",
        })
            .populate({
            path: "classId",
            select: "subject grade",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Lessons fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getAllLessons = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const result = await lesson_model_1.Lesson.find()
            .populate({
            path: "studentId",
            select: "username email role type",
        })
            .populate({
            path: "teacherId",
            select: "username email role type",
        })
            .populate({
            path: "classId",
            select: "subject grade",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Lessons fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getSingleLesson = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { lessonId } = req.params;
        const result = await lesson_model_1.Lesson.findById(lessonId)
            .populate({
            path: "studentId",
            select: "username email role type",
        })
            .populate({
            path: "teacherId",
            select: "username email role type",
        })
            .populate({
            path: "classId",
            select: "subject grade",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Lesson fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const updateLesson = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { studentId, objective, note, classId } = req.body;
        const lesson = await lesson_model_1.Lesson.findById(lessonId);
        if (!lesson) {
            throw new AppError_1.default(400, "Lesson not found");
        }
        const student = await user_model_1.User.findById(studentId);
        if (!student) {
            throw new AppError_1.default(400, "Student not found");
        }
        const isExistingClass = await class_model_1.Class.findById(classId);
        if (!isExistingClass) {
            throw new AppError_1.default(400, "Class not found");
        }
        let document = { public_id: "", url: "" };
        if (req.file) {
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.path);
            if (uploadResult) {
                document = {
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                };
            }
        }
        const updatedLesson = await lesson_model_1.Lesson.findByIdAndUpdate(lessonId, {
            studentId,
            objective,
            note,
            document,
            classId
        }, { new: true });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Lesson updated successfully",
            data: updatedLesson,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const deleteLesson = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { lessonId } = req.params;
        const lesson = await lesson_model_1.Lesson.findById(lessonId);
        if (!lesson) {
            throw new AppError_1.default(400, "Lesson not found");
        }
        const deletedLesson = await lesson_model_1.Lesson.findByIdAndDelete(lessonId);
        if (!deletedLesson) {
            throw new AppError_1.default(404, "Lesson not found");
        }
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Lesson deleted successfully",
            data: null,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getLessonsByClass = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { classId } = req.params;
        const result = await lesson_model_1.Lesson.find({ classId })
            .populate({
            path: "studentId",
            select: "username email role type",
        })
            .populate({
            path: "teacherId",
            select: "username email role type",
        })
            .populate({
            path: "classId",
            select: "subject grade",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Class Lessons fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const updateLessonStatus = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { lessonId } = req.params;
        const lesson = await lesson_model_1.Lesson.findById(lessonId);
        if (!lesson) {
            throw new AppError_1.default(400, "Lesson not found");
        }
        const updatedLesson = await lesson_model_1.Lesson.findByIdAndUpdate(lessonId, [
            {
                $set: {
                    isArchived: { $not: ["$isArchived"] },
                },
            },
        ], { new: true });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: `Lesson status updated to ${updatedLesson.isArchived ? "archived" : "active"}`,
            data: updatedLesson,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getArchivedLessons = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const result = await lesson_model_1.Lesson.find({ isArchived: true })
            .populate({
            path: "studentId",
            select: "username email role type",
        })
            .populate({
            path: "teacherId",
            select: "username email role type",
        })
            .populate({
            path: "classId",
            select: "subject grade",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Archived Lessons fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const lessonController = {
    createLesson,
    getLessonsByTeacher,
    getLessonsByStudent,
    getAllLessons,
    getSingleLesson,
    updateLesson,
    deleteLesson,
    getLessonsByClass,
    updateLessonStatus,
    getArchivedLessons
};
exports.default = lessonController;
