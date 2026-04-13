"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const behavior_controller_1 = __importDefault(require("../controllers/behavior.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post("/create", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), behavior_controller_1.default.createBehavior);
router.get("/teacher-behaviors", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), behavior_controller_1.default.getBehaviorByTeacher);
router.get("/student-behaviors", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("student"), behavior_controller_1.default.getBehaviorByStudent);
router.get("/", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), behavior_controller_1.default.getAllBehaviors);
router.get("/:behaviorId", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), behavior_controller_1.default.getSingleBehavior);
router.put("/update/:behaviorId", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), behavior_controller_1.default.updateBehavior);
router.delete("/delete/:behaviorId", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), behavior_controller_1.default.deleteBehavior);
const behaviorRouter = router;
exports.default = behaviorRouter;
