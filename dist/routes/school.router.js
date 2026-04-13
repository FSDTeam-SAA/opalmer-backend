"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const school_controller_1 = __importDefault(require("../controllers/school.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post("/create", auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)("administrator"), school_controller_1.default.createSchool);
router.get("/my-school", auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)("administrator"), school_controller_1.default.getMySchool);
router.get("/", school_controller_1.default.getAllSchools);
router.get("/:id", school_controller_1.default.getSingleSchool);
router.put("/update/:id", auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)("administrator"), school_controller_1.default.updateSchool);
const schoolRouter = router;
exports.default = schoolRouter;
