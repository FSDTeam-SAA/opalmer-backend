"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLearningTip = exports.updateLearningTip = exports.getSingleLearningTip = exports.getLearningTipsBySchool = exports.getLearningTipsByAdmin = exports.createLearningTip = void 0;
const learningTip_model_1 = require("../models/learningTip.model");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const pagination_1 = require("../utils/pagination");
// CREATE
exports.createLearningTip = (0, catchAsync_1.default)(async (req, res) => {
    const { administratorId, img, title, description, schoolId } = req.body;
    //   if (!administratorId || !name || !description || !schoolId) {
    //     throw new AppError(httpStatus.BAD_REQUEST, 'Missing required fields')
    //   }
    const newTip = await learningTip_model_1.LearningTip.create({
        administratorId,
        img,
        title,
        description,
        schoolId,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Learning tip created successfully',
        data: newTip,
    });
});
/*****************************
 * // GET BY ADMINISTRATORID *
 *****************************/
exports.getLearningTipsByAdmin = (0, catchAsync_1.default)(async (req, res) => {
    const { administratorId } = req.query;
    if (!administratorId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'administratorId is required');
    }
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req.query);
    const totalItems = await learningTip_model_1.LearningTip.countDocuments({ administratorId });
    const tips = await learningTip_model_1.LearningTip.find({ administratorId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);
    const meta = await (0, pagination_1.buildMetaPagination)(totalItems, page, limit);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Learning tips fetched successfully',
        data: {
            tips,
            meta,
        },
    });
});
/**********************
 * // GET BY SCHOOLID *
 **********************/
exports.getLearningTipsBySchool = (0, catchAsync_1.default)(async (req, res) => {
    const { schoolId } = req.query;
    if (!schoolId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'schoolId is required');
    }
    const tips = await learningTip_model_1.LearningTip.find({ schoolId }).sort({ created_at: -1 });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Learning tips fetched successfully',
        data: tips,
    });
});
/******************
 * // VIEW SINGLE *
 ******************/
exports.getSingleLearningTip = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const tip = await learningTip_model_1.LearningTip.findById(id);
    if (!tip)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Learning tip not found');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Learning tip fetched successfully',
        data: tip,
    });
});
/*************
 * // UPDATE *
 *************/
exports.updateLearningTip = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const updatedTip = await learningTip_model_1.LearningTip.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!updatedTip)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Learning tip not found');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Learning tip updated successfully',
        data: updatedTip,
    });
});
/*************
 * // DELETE *
 *************/
exports.deleteLearningTip = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const deletedTip = await learningTip_model_1.LearningTip.findByIdAndDelete(id);
    if (!deletedTip)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Learning tip not found');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Learning tip deleted successfully',
        data: deletedTip,
    });
});
