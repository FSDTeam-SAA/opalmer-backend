"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const learningTip_controller_1 = require("../controllers/learningTip.controller");
const router = express_1.default.Router();
// Create
router.post('/', 
// protect, authorizeRoles('administrator'), 
learningTip_controller_1.createLearningTip);
// Get by adminId (paginated)
router.get('/by-admin', learningTip_controller_1.getLearningTipsByAdmin);
// Get by schoolId
router.get('/by-school', learningTip_controller_1.getLearningTipsBySchool);
// Single
router.get('/:id', learningTip_controller_1.getSingleLearningTip);
// Update
router.patch('/:id', learningTip_controller_1.updateLearningTip);
// Delete
router.delete('/:id', learningTip_controller_1.deleteLearningTip);
exports.default = router;
