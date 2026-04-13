"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAIQuestions = void 0;
const quizQA_model_1 = require("../models/quizQA.model");
const quizAI_service_1 = require("../services/quizAI.service");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const AppError_1 = __importDefault(require("../errors/AppError"));
/************************
 * CREATE AI QUIESTIONS *
 ************************/
exports.createAIQuestions = (0, catchAsync_1.default)(async (req, res) => {
    const { quizId, topic } = req.body;
    if (!quizId || !topic)
        throw new AppError_1.default(400, 'quizId and topic are required');
    const questions = await (0, quizAI_service_1.generateQuizQuestions)(topic, 10);
    if (!questions.length)
        throw new AppError_1.default(500, 'AI failed to generate questions');
    const savedQA = await quizQA_model_1.QuizQA.create({
        quizId,
        questions,
    });
    res.status(201).json({
        success: true,
        message: 'Questions generated and saved successfully',
        data: savedQA,
    });
});
