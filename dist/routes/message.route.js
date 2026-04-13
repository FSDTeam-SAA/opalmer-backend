"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_middleware_1 = require("../middlewares/multer.middleware");
const message_controllers_1 = require("../controllers/message.controllers");
const router = express_1.default.Router();
router.post('/', multer_middleware_1.upload.array('files'), message_controllers_1.createMessage);
router.get('/:roomId', message_controllers_1.getMessagesByRoom);
router.patch('/:messageId', message_controllers_1.updateMessage);
router.delete('/:messageId', message_controllers_1.deleteMessage);
exports.default = router;
