"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../errors/AppError"));
const behavior_model_1 = require("../models/behavior.model");
const user_model_1 = require("../models/user.model");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const createBehavior = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const { studentId } = req.body;
        const teacher = await user_model_1.User.findById(userId);
        if (!teacher) {
            throw new AppError_1.default(400, "Teacher not found");
        }
        const student = await user_model_1.User.findById(studentId);
        if (!student) {
            throw new AppError_1.default(400, "Student not found");
        }
        const result = await behavior_model_1.Behavior.create({
            studentId,
            teacherId: userId,
            ...req.body,
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Behavior created successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getSingleBehavior = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { behaviorId } = req.params;
        const behavior = await behavior_model_1.Behavior.findById(behaviorId);
        if (!behavior) {
            throw new AppError_1.default(400, "Behavior not found");
        }
        const result = await behavior_model_1.Behavior.findById(behaviorId)
            .populate({
            path: "studentId",
            select: "username email role type",
        })
            .populate({
            path: "teacherId",
            select: "username email role type",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Behavior fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getAllBehaviors = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const result = await behavior_model_1.Behavior.find()
            .populate({
            path: "studentId",
            select: "username email role type",
        })
            .populate({
            path: "teacherId",
            select: "username email role type",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Behaviors fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getBehaviorByTeacher = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { _id: teacherId } = req.user;
        const teacher = await user_model_1.User.findById(teacherId);
        if (!teacher) {
            throw new AppError_1.default(400, "Teacher not found");
        }
        const result = await behavior_model_1.Behavior.find({ teacherId })
            .populate({
            path: "studentId",
            select: "username email role type",
        })
            .populate({
            path: "teacherId",
            select: "username email role type",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Behaviors fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getBehaviorByStudent = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { _id: studentId } = req.user;
        const student = await user_model_1.User.findById(studentId);
        if (!student) {
            throw new AppError_1.default(400, "Student not found");
        }
        const result = await behavior_model_1.Behavior.find({ studentId })
            .populate({
            path: "studentId",
            select: "username email role type",
        })
            .populate({
            path: "teacherId",
            select: "username email role type",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Behaviors fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const updateBehavior = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { behaviorId } = req.params;
        const behavior = await behavior_model_1.Behavior.findById(behaviorId);
        if (!behavior) {
            throw new AppError_1.default(400, "Behavior not found");
        }
        const { studentId } = req.body;
        const student = await user_model_1.User.findById(studentId);
        if (!student) {
            throw new AppError_1.default(400, "Student not found");
        }
        const result = await behavior_model_1.Behavior.findByIdAndUpdate(behaviorId, req.body, {
            new: true,
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Behavior updated successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const deleteBehavior = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { behaviorId } = req.params;
        const behavior = await behavior_model_1.Behavior.findById(behaviorId);
        if (!behavior) {
            throw new AppError_1.default(400, "Behavior not found");
        }
        const result = await behavior_model_1.Behavior.findByIdAndDelete(behaviorId);
        if (!result) {
            throw new AppError_1.default(400, "Behavior not found");
        }
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Behavior deleted successfully",
            data: null,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const behaviorController = {
    createBehavior,
    getSingleBehavior,
    getAllBehaviors,
    getBehaviorByTeacher,
    getBehaviorByStudent,
    updateBehavior,
    deleteBehavior,
};
exports.default = behaviorController;
