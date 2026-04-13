"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const attendance_controller_1 = require("../controllers/attendance.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Create attendance for all students in a class
router.post('/class', attendance_controller_1.createClassAttendance);
//  * CHANGE ATTENDANCE STATUS *
router.patch('/class/:id', attendance_controller_1.changeAttendanceStatus);
//  * GET ALL ATTENDANCE *
router.get('/class', auth_middleware_1.protect, attendance_controller_1.getAllAttendance);
// * GET ALL ATTENDANCE FOR A STUDENT *
router.get('/student', auth_middleware_1.protect, attendance_controller_1.getStudentAttendance);
exports.default = router;
