"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const multer_middleware_1 = require("../middlewares/multer.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.post('/register', multer_middleware_1.upload.single('image'), user_controller_1.registerUser);
router.post('/login', user_controller_1.loginUser);
router.get("/administrators", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("administrator"), user_controller_1.getAllAdministrators);
router.get("/my-students", auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)("administrator"), user_controller_1.getMySchoolAllStudents);
router.get("/my-teachers", auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)("administrator"), user_controller_1.getMySchoolAllTeachers);
router.put("/:id", 
// protect,
user_controller_1.updateUser);
exports.default = router;
