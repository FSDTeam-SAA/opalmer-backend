"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../errors/AppError"));
const school_model_1 = __importDefault(require("../models/school.model"));
const user_model_1 = require("../models/user.model");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const createSchool = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            throw new AppError_1.default(400, "User not found");
        }
        if (user.role !== "administrator") {
            throw new AppError_1.default(400, "Only administrators can create a school");
        }
        const result = await school_model_1.default.create({
            administrator: userId,
            ...req.body,
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "School created successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getAllSchools = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        // Filters
        const filter = {};
        if (search) {
            filter.name = { $regex: search, $options: "i" }; // case-insensitive search
        }
        // Pagination values
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const skip = (pageNumber - 1) * pageSize;
        // Get total count
        const total = await school_model_1.default.countDocuments(filter);
        // Fetch with filter, pagination & populate
        const result = await school_model_1.default
            .find(filter)
            .populate({
            path: "administrator",
            select: "username Id role type",
        })
            .skip(skip)
            .limit(pageSize)
            .sort({ created_at: -1 });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Schools fetched successfully",
            data: result,
            meta: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getMySchool = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            throw new AppError_1.default(400, "User not found");
        }
        const result = await school_model_1.default.findOne({ administrator: user._id }).populate({
            path: "administrator",
            select: "username Id role type",
        });
        if (!result) {
            throw new AppError_1.default(404, "School not found");
        }
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "School fetched successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const getSingleSchool = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { id } = req.params;
        const result = await school_model_1.default.findById(id);
        if (!result) {
            throw new AppError_1.default(404, "School not found");
        }
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "School get successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const updateSchool = (0, catchAsync_1.default)(async (req, res) => {
    try {
        const { id } = req.params;
        const result = await school_model_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        if (!result) {
            throw new AppError_1.default(404, "School not found");
        }
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "School updated successfully",
            data: result,
        });
    }
    catch (error) {
        throw new AppError_1.default(500, error);
    }
});
const schoolController = {
    createSchool,
    getAllSchools,
    getMySchool,
    getSingleSchool,
    updateSchool,
};
exports.default = schoolController;
