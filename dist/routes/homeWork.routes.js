"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeworkRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const homeWork_controller_1 = require("../controllers/homeWork.controller");
const multer_middleware_1 = require("../middlewares/multer.middleware");
const router = (0, express_1.Router)();
// Create homework (teacher only)
router.post("/create", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), multer_middleware_1.upload.array("file"), homeWork_controller_1.createHomework);
// Get homework by class (teacher only)
router.get("/class/:classId", homeWork_controller_1.getHomeworkByClass);
// Get homework by user (teacher or student)
router.get("/user/:userId", homeWork_controller_1.getHomeworkByUser);
// Get single homework by ID (teacher only)
router.get("/:id", homeWork_controller_1.getHomeworkById);
// Update homework (teacher only)
router.put("/update/:id", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), multer_middleware_1.upload.array("file"), homeWork_controller_1.updateHomework);
// Delete homework (teacher only)
router.delete("/delete/:id", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), homeWork_controller_1.deleteHomework);
// Archive homework (teacher only)
router.patch("/archive/:id", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), homeWork_controller_1.archiveHomework);
exports.homeworkRouter = router;
