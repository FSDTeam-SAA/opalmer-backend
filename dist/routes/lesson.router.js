"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lesson_controller_1 = __importDefault(require("../controllers/lesson.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_middleware_1 = require("../middlewares/multer.middleware");
const router = (0, express_1.Router)();
router.post("/create", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), multer_middleware_1.upload.single("document"), lesson_controller_1.default.createLesson);
router.get("/teacher-lessons", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), lesson_controller_1.default.getLessonsByTeacher);
router.get("/student-lessons", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("student"), lesson_controller_1.default.getLessonsByStudent);
router.get("/", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("student"), 
// authorizeTypes("teacher"),
lesson_controller_1.default.getAllLessons);
router.get("/archived", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), lesson_controller_1.default.getArchivedLessons);
router.get("/:lessonId", auth_middleware_1.protect, 
// authorizeTypes("student"),
(0, auth_middleware_1.authorizeTypes)("teacher"), lesson_controller_1.default.getSingleLesson);
router.get("/class/:classId", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), lesson_controller_1.default.getLessonsByClass);
router.put("/update/:lessonId", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), multer_middleware_1.upload.single("document"), lesson_controller_1.default.updateLesson);
router.delete("/delete/:lessonId", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), lesson_controller_1.default.deleteLesson);
router.put("/update-status/:lessonId", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), lesson_controller_1.default.updateLessonStatus);
const lessonRouter = router;
exports.default = lessonRouter;
