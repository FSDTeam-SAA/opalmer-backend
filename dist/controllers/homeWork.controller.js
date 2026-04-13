"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveHomework = exports.deleteHomework = exports.updateHomework = exports.getHomeworkByUser = exports.getHomeworkByClass = exports.getHomeworkById = exports.createHomework = void 0;
const AppError_1 = __importDefault(require("../errors/AppError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const homework_model_1 = require("../models/homework.model");
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = __importDefault(require("mongoose"));
const class_model_1 = require("../models/class.model");
const user_model_1 = require("../models/user.model");
const cloudinary_1 = require("../utils/cloudinary");
/*************************
 * CREATE HOMEWORK       *
 *************************/
exports.createHomework = (0, catchAsync_1.default)(async (req, res) => {
    const data = req.body;
    if (!data.classId)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Class ID is required');
    if (!data.userId)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'User ID is required');
    if (!data.title)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Title is required');
    // ✅ Check if class exists
    const classExists = await class_model_1.Class.findById(data.classId);
    if (!classExists)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Class not found');
    // ✅ Check if user exists
    const userExists = await user_model_1.User.findById(data.userId);
    if (!userExists)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'User not found');
    let files = [];
    if (req.files && Array.isArray(req.files)) {
        // Loop through all uploaded files
        for (const file of req.files) {
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(file.path);
            if (uploadResult) {
                files.push({
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                });
            }
        }
    }
    const homework = await homework_model_1.Homework.create({ ...data, file: files });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Homework created successfully',
        data: homework,
    });
});
/*************************
 * GET HOMEWORK BY ID     *
 *************************/
exports.getHomeworkById = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid homework ID');
    const homework = await homework_model_1.Homework.findById(id);
    if (!homework)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Homework not found');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Homework fetched successfully',
        data: homework,
    });
});
/*************************
 * GET HOMEWORK BY CLASS  *
 *************************/
exports.getHomeworkByClass = (0, catchAsync_1.default)(async (req, res) => {
    const { classId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(classId))
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid class ID');
    const homework = await homework_model_1.Homework.findByClass(classId);
    if (homework.length === 0)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No homework found for this class');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Homework for class fetched successfully',
        data: homework,
    });
});
/*************************
 * GET HOMEWORK BY USER   *
 *************************/
exports.getHomeworkByUser = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(userId))
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid user ID');
    const homework = await homework_model_1.Homework.findByUser(userId);
    if (homework.length === 0)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No homework found for this user');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Homework for user fetched successfully',
        data: homework,
    });
});
/*************************
 * UPDATE HOMEWORK        *
 *************************/
exports.updateHomework = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid homework ID');
    const updates = { ...req.body };
    if (req.files && Array.isArray(req.files)) {
        let files = [];
        for (const file of req.files) {
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(file.path);
            if (uploadResult) {
                files.push({
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                });
            }
        }
        updates.file = files;
    }
    const updatedHomework = await homework_model_1.Homework.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedHomework)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Homework not found');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Homework updated successfully',
        data: updatedHomework,
    });
});
/*************************
 * DELETE HOMEWORK        *
 *************************/
exports.deleteHomework = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid homework ID');
    const deletedHomework = await homework_model_1.Homework.findByIdAndDelete(id);
    if (!deletedHomework)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Homework not found');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Homework deleted successfully',
    });
});
/*************************
 * ARCHIVE HOMEWORK       *
 *************************/
exports.archiveHomework = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const { archived } = req.body; // read from request body
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid homework ID');
    if (typeof archived !== 'boolean')
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'archived must be true or false');
    const updatedHomework = await homework_model_1.Homework.findByIdAndUpdate(id, { archived }, { new: true });
    if (!updatedHomework)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Homework not found');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Homework ${archived ? 'archived' : 'unarchived'} successfully`,
        data: updatedHomework,
    });
});
