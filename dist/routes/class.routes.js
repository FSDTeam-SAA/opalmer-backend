"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const class_controller_1 = require("../controllers/class.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)('teacher'), class_controller_1.createClass);
router.get('/', class_controller_1.getAllClasses);
// Get All Classes
router.get('/teacher/:teacherId', class_controller_1.getClassesByTeacher);
// Get Classes by Teacher ID
router.put('/:id', class_controller_1.updateClass);
router.delete('/:id', class_controller_1.deleteClass);
// grade wise classes
router.get('/grade', auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)('student'), class_controller_1.getgradeWiseClasses);
// Get classes by student ID
router.get('/student/:studentId', auth_middleware_1.protect, class_controller_1.getClassesByStudent);
exports.default = router;
