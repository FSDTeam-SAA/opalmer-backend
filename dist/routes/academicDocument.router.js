"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academicDocument_controller_1 = __importDefault(require("../controllers/academicDocument.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_middleware_1 = require("../middlewares/multer.middleware");
const router = (0, express_1.Router)();
router.post("/create", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), multer_middleware_1.upload.single("document"), academicDocument_controller_1.default.createAcademicDocument);
router.get("/student-documents", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("student"), academicDocument_controller_1.default.getAcademicDocumentForStudent);
router.get("/teacher-documents", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), academicDocument_controller_1.default.getAcademicDocumentForTeacher);
router.get("/:academicDocumentId", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), academicDocument_controller_1.default.getSingleAcademicDocument);
router.put("/update/:id", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), multer_middleware_1.upload.single("document"), academicDocument_controller_1.default.updateAcademicDocument);
router.delete("/delete/:id", auth_middleware_1.protect, (0, auth_middleware_1.authorizeTypes)("teacher"), academicDocument_controller_1.default.deleteAcademicDocument);
const academicDocumentRouter = router;
exports.default = academicDocumentRouter;
