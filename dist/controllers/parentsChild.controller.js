"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentsByChildId = exports.getChildrenByParentId = exports.deleteParentsChild = exports.createParentsChild = void 0;
const parentsChild_model_1 = require("../models/parentsChild.model");
const AppError_1 = __importDefault(require("../errors/AppError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
/*****************
 * CREATE RELATION
 *****************/
exports.createParentsChild = (0, catchAsync_1.default)(async (req, res) => {
    const { parentId, childId } = req.body;
    if (!parentId || !childId) {
        throw new AppError_1.default(400, 'parentId and childId are required.');
    }
    // Prevent duplicate relation
    const existing = await parentsChild_model_1.ParentsChild.findOne({ parentId, childId });
    if (existing) {
        throw new AppError_1.default(409, 'Relation already exists.');
    }
    const relation = await parentsChild_model_1.ParentsChild.create({ parentId, childId });
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: 'Parent-Child relation created successfully',
        data: relation,
    });
});
/*****************
 * DELETE RELATION
 *****************/
exports.deleteParentsChild = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const relation = await parentsChild_model_1.ParentsChild.findByIdAndDelete(id);
    if (!relation) {
        throw new AppError_1.default(404, 'Relation not found.');
    }
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Relation deleted successfully',
    });
});
/***********************
 * GET CHILDREN BY PARENT
 ***********************/
exports.getChildrenByParentId = (0, catchAsync_1.default)(async (req, res) => {
    const { parentId } = req.params;
    const children = await parentsChild_model_1.ParentsChild.find({ parentId }).populate('childId', 'username email age avatar');
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        data: { children, count: children.length },
    });
});
/**********************
 * GET PARENTS BY CHILD
 **********************/
exports.getParentsByChildId = (0, catchAsync_1.default)(async (req, res) => {
    const { childId } = req.params;
    const parents = await parentsChild_model_1.ParentsChild.find({ childId }).populate('parentId', 'username email role');
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        data: { parents, count: parents.length },
    });
});
