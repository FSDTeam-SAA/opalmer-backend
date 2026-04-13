"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const room_controller_1 = require("../controllers/room.controller");
const multer_middleware_1 = require("../middlewares/multer.middleware");
const router = express_1.default.Router();
router.post('/', multer_middleware_1.upload.single('avatar'), room_controller_1.createRoom);
router.patch('/:id', multer_middleware_1.upload.single('avatar'), room_controller_1.editRoom);
router.get('/user/:userId', room_controller_1.getRoomsByUserId);
exports.default = router;
