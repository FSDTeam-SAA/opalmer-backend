"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quiz_controller_1 = require("../controllers/quiz.controller");
const multer_middleware_1 = require("../middlewares/multer.middleware");
const router = (0, express_1.Router)();
router.post('/', multer_middleware_1.upload.single('image'), quiz_controller_1.createQuiz);
router.put('/:quizId', multer_middleware_1.upload.single('image'), quiz_controller_1.updateQuiz);
router.get('/', quiz_controller_1.getAllQuizzes);
// Get quizzes by classId
router.get('/class/:classId', quiz_controller_1.getQuizzesByClass);
router.get('/teacher/:teacherId', quiz_controller_1.getQuizzesByTeacher);
router.delete('/:quizId', quiz_controller_1.deleteQuiz);
exports.default = router;
