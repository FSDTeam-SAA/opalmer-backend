"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quizQA_controller_1 = require("../controllers/quizQA.controller");
const router = (0, express_1.Router)();
router.post('/generate', quizQA_controller_1.createAIQuestions);
exports.default = router;
