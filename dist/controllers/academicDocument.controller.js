"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../errors/AppError"));
const academicDocument_model_1 = __importDefault(require("../models/academicDocument.model"));
const user_model_1 = require("../models/user.model");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const cloudinary_1 = require("../utils/cloudinary");
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const createAcademicDocument = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { studentId } = req.body;
        const { _id: userId } = req.user;
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            throw new AppError_1.default(400, "Teacher not found");
        }
        if (user.schoolId === null) {
            throw new AppError_1.default(400, "You are not a teacher of any school");
        }
        const student = await user_model_1.User.findById(studentId);
        if (!student) {
            throw new AppError_1.default(400, "Student not found");
        }
        if (student.type !== "student") {
            throw new AppError_1.default(400, "You can only upload academic documents for students");
        }
        if (student.schoolId === null) {
            throw new AppError_1.default(400, "Student is not enrolled in any school");
        }
        if (String(user.schoolId) !== String(student.schoolId)) {
            throw new AppError_1.default(400, "You can't upload academic documents for a student from another school");
        }
        let document = { public_id: "", url: "" };
        if (req.file) {
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.path);
            if (uploadResult) {
                document = {
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                };
            }
        }
        const academicDocument = await academicDocument_model_1.default.create({
            teacherId: user._id,
            studentId,
            schoolId: user.schoolId,
            document,
        });
        const populatedDocument = await academicDocument_model_1.default.findById(academicDocument._id)
            .populate({
            path: "studentId",
            select: "username Id gradeLevel schoolId",
            populate: {
                path: "schoolId",
                select: "name",
            },
        })
            .populate({
            path: "schoolId",
            select: "name",
        });
        (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Academic document created successfully",
            data: populatedDocument,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getAcademicDocumentForStudent = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            throw new AppError_1.default(400, "Student not found");
        }
        const result = await academicDocument_model_1.default.find({ studentId: user._id })
            .populate({
            path: "studentId",
            select: "username Id gradeLevel",
        })
            .populate({
            path: "schoolId",
            select: "name",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Academic documents fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getAcademicDocumentForTeacher = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            throw new AppError_1.default(400, "Teacher not found");
        }
        const result = await academicDocument_model_1.default.find({
            teacherId: user._id,
        })
            .populate({
            path: "studentId",
            select: "username Id gradeLevel",
        })
            .populate({
            path: "schoolId",
            select: "name",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Academic documents fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getSingleAcademicDocument = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { academicDocumentId } = req.params;
        const document = await academicDocument_model_1.default.findById(academicDocumentId);
        if (!document) {
            throw new AppError_1.default(400, "Academic document not found");
        }
        const result = await academicDocument_model_1.default.findById(academicDocumentId)
            .populate({
            path: "studentId",
            select: "username Id gradeLevel",
        })
            .populate({
            path: "schoolId",
            select: "name",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Academic document get successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const updateAcademicDocument = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { academicDocumentId } = req.params;
        const doc = await academicDocument_model_1.default.findById(academicDocumentId);
        if (!doc) {
            throw new AppError_1.default(400, "Academic document not found");
        }
        let document = { public_id: "", url: "" };
        if (req.file) {
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.path);
            if (uploadResult) {
                document = {
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                };
            }
        }
        const updatedDocument = await academicDocument_model_1.default.findByIdAndUpdate(academicDocumentId, {
            document,
        }, { new: true });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Academic document updated successfully",
            data: updatedDocument,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const deleteAcademicDocument = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { academicDocumentId } = req.params;
        const document = await academicDocument_model_1.default.findById(academicDocumentId);
        if (!document) {
            throw new AppError_1.default(400, "Academic document not found");
        }
        await academicDocument_model_1.default.findByIdAndDelete(academicDocumentId);
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Academic document deleted successfully",
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const academicDocumentController = {
    createAcademicDocument,
    getAcademicDocumentForStudent,
    getAcademicDocumentForTeacher,
    getSingleAcademicDocument,
    updateAcademicDocument,
    deleteAcademicDocument,
};
exports.default = academicDocumentController;
