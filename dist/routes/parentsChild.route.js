"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const parentsChild_controller_1 = require("../controllers/parentsChild.controller");
const router = express_1.default.Router();
router.post('/', parentsChild_controller_1.createParentsChild);
router.delete('/:id', parentsChild_controller_1.deleteParentsChild);
router.get('/parent/:parentId', parentsChild_controller_1.getChildrenByParentId);
router.get('/child/:childId', parentsChild_controller_1.getParentsByChildId);
exports.default = router;
