"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminDashboard_controller_1 = require("../controllers/adminDashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get("/stats", auth_middleware_1.protect, adminDashboard_controller_1.getUserStats);
router.get("/stats/student-gender", auth_middleware_1.protect, adminDashboard_controller_1.getStudentGenderStats);
exports.default = router;
