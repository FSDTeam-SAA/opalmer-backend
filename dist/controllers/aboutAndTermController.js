"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../errors/AppError"));
const aboutAndTerm_1 = __importDefault(require("../models/aboutAndTerm"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const createAboutAndTerm = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const result = await aboutAndTerm_1.default.create(req.body);
        const { docType } = result;
        if (docType === "about") {
            return (0, sendResponse_1.default)(res, {
                statusCode: 200,
                success: true,
                message: "About us created successfully",
                data: result,
            });
        }
        else if (docType === "terms") {
            return (0, sendResponse_1.default)(res, {
                statusCode: 200,
                success: true,
                message: "Terms and conditions created successfully",
                data: result,
            });
        }
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getAbout = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const result = await aboutAndTerm_1.default.find({ docType: "about" });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "About us fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getTerms = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const result = await aboutAndTerm_1.default.find({ docType: "terms" });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Terms and conditions fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const updateAboutAndTerm = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await aboutAndTerm_1.default.findById(id);
        if (!doc) {
            throw new AppError_1.default(404, "App Features not found");
        }
        const result = await aboutAndTerm_1.default.findOneAndUpdate({ _id: id }, req.body, {
            new: true,
        });
        const { docType } = result;
        if (docType === "about") {
            return (0, sendResponse_1.default)(res, {
                statusCode: 200,
                success: true,
                message: "About us updated successfully",
                data: result,
            });
        }
        else if (docType === "terms") {
            return (0, sendResponse_1.default)(res, {
                statusCode: 200,
                success: true,
                message: "Terms and conditions updated successfully",
                data: result,
            });
        }
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const aboutAndTermController = {
    createAboutAndTerm,
    getAbout,
    getTerms,
    updateAboutAndTerm,
};
exports.default = aboutAndTermController;
