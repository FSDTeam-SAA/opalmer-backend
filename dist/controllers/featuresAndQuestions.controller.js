"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.featuresAndQuestionsController = void 0;
const AppError_1 = __importDefault(require("../errors/AppError"));
const featuresAndQuestions_model_1 = __importDefault(require("../models/featuresAndQuestions.model"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const crateFeaturesAndQuestions = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const result = await featuresAndQuestions_model_1.default.create(req.body);
        const { docType } = result;
        if (docType === "AppFeatures") {
            return (0, sendResponse_1.default)(res, {
                statusCode: 200,
                success: true,
                message: "App Features created successfully",
                data: result,
            });
        }
        else if (docType === "FAQquestions") {
            return (0, sendResponse_1.default)(res, {
                statusCode: 200,
                success: true,
                message: "FAQ questions created successfully",
                data: result,
            });
        }
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getAppFeatures = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const result = await featuresAndQuestions_model_1.default.find({ docType: "AppFeatures" });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "App Features fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getFAQquestions = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const result = await featuresAndQuestions_model_1.default.find({ docType: "FAQquestions" });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "FAQ questions fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const updateFeaturesAndQuestions = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await featuresAndQuestions_model_1.default.findById(id);
        if (!doc) {
            throw new AppError_1.default(404, "App Features not found");
        }
        const result = await featuresAndQuestions_model_1.default.findOneAndUpdate({ _id: id }, req.body, { new: true });
        const { docType } = result;
        if (docType === "AppFeatures") {
            return (0, sendResponse_1.default)(res, {
                statusCode: 200,
                success: true,
                message: "App Features created successfully",
                data: result,
            });
        }
        else if (docType === "FAQquestions") {
            return (0, sendResponse_1.default)(res, {
                statusCode: 200,
                success: true,
                message: "FAQ questions created successfully",
                data: result,
            });
        }
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
exports.featuresAndQuestionsController = {
    crateFeaturesAndQuestions,
    getAppFeatures,
    getFAQquestions,
    updateFeaturesAndQuestions,
};
