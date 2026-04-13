"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuizzesByTeacher = exports.deleteQuiz = exports.getQuizzesByClass = exports.getAllQuizzes = exports.updateQuiz = exports.createQuiz = void 0;
const quiz_model_1 = require("../models/quiz.model");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const cloudinary_1 = require("../utils/cloudinary");
// Create a new quiz
exports.createQuiz = (0, catchAsync_1.default)(async (req, res) => {
    const { teacherId, classId, title, description, time } = req.body;
    let imageUrl = '';
    if (req.file) {
        const result = await (0, cloudinary_1.uploadToCloudinary)(req.file.path);
        if (result)
            imageUrl = result.secure_url;
    }
    const newQuiz = await quiz_model_1.Quiz.create({
        teacherId,
        classId,
        title,
        description,
        image: imageUrl,
        time,
    });
    res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        data: newQuiz,
    });
});
// Edit/update a quiz
exports.updateQuiz = (0, catchAsync_1.default)(async (req, res) => {
    const { quizId } = req.params;
    const updates = { ...req.body };
    // Handle image upload if file exists
    if (req.file) {
        const result = await (0, cloudinary_1.uploadToCloudinary)(req.file.path);
        if (result)
            updates.image = result.secure_url;
    }
    const updatedQuiz = await quiz_model_1.Quiz.findByIdAndUpdate(quizId, updates, {
        new: true,
    });
    if (!updatedQuiz)
        throw new AppError_1.default(404, 'Quiz not found');
    res.status(200).json({
        success: true,
        message: 'Quiz updated successfully',
        data: updatedQuiz,
    });
});
// Get all quizzes
exports.getAllQuizzes = (0, catchAsync_1.default)(async (_req, res) => {
    const quizzes = await quiz_model_1.Quiz.find().sort({ created_at: -1 });
    res.status(200).json({
        success: true,
        data: quizzes,
    });
});
// Get quizzes by classId
exports.getQuizzesByClass = (0, catchAsync_1.default)(async (req, res) => {
    const { classId } = req.params;
    const quizzes = await quiz_model_1.Quiz.find({ classId }).sort({ created_at: -1 });
    res.status(200).json({
        success: true,
        data: quizzes,
    });
});
// Delete a quiz
exports.deleteQuiz = (0, catchAsync_1.default)(async (req, res) => {
    const { quizId } = req.params;
    const deletedQuiz = await quiz_model_1.Quiz.findByIdAndDelete(quizId);
    if (!deletedQuiz)
        throw new AppError_1.default(404, 'Quiz not found');
    res.status(200).json({
        success: true,
        message: 'Quiz deleted successfully',
    });
});
// Get quizzes by teacherId
exports.getQuizzesByTeacher = (0, catchAsync_1.default)(async (req, res) => {
    const { teacherId } = req.params;
    const quizzes = await quiz_model_1.Quiz.find({ teacherId }).sort({ created_at: -1 });
    res.status(200).json({
        success: true,
        data: quizzes,
    });
});
