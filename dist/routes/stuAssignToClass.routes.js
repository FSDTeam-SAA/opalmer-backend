"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stuAssignToClass_controller_1 = require("../controllers/stuAssignToClass.controller");
const router = express_1.default.Router();
// Create assignment
router.post('/', stuAssignToClass_controller_1.assignStudentToClass);
// Get by studentId
router.get('/student/:studentId', stuAssignToClass_controller_1.getClassesByStudent);
// Get by classId
router.get('/class/:classId', stuAssignToClass_controller_1.getStudentByClass);
// Delete by assignment ID
router.delete('/:id', stuAssignToClass_controller_1.removeStudentFromClass);
exports.default = router;
