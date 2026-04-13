"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomsByUserId = exports.editRoom = exports.createRoom = void 0;
const room_model_1 = require("../models/room.model");
const AppError_1 = __importDefault(require("../errors/AppError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = require("../utils/cloudinary");
/*****************************************************************************
 *                               CREATE A ROOM                               *
 * * FOR 1-TO-1 ROOMS, ENSURE NO DUPLICATE ROOM EXISTS BETWEEN THE TWO USERS *
 *****************************************************************************/
exports.createRoom = (0, catchAsync_1.default)(async (req, res) => {
    let { name, participants } = req.body;
    // Parse participants from JSON string if needed
    if (typeof participants === 'string') {
        try {
            participants = JSON.parse(participants);
        }
        catch (err) {
            throw new AppError_1.default(400, 'Participants must be valid JSON array');
        }
    }
    if (!participants ||
        !Array.isArray(participants) ||
        participants.length === 0) {
        throw new AppError_1.default(400, 'Participants array is required');
    }
    // Avatar upload to Cloudinary
    let avatarUrl = '';
    if (req.file) {
        const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.path);
        if (uploadResult)
            avatarUrl = uploadResult.secure_url;
    }
    const room = await room_model_1.Room.create({
        name,
        avatar: avatarUrl,
        participants,
    });
    res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: room,
    });
});
/*********************
 * * EDIT ROOM BY ID *
 *********************/
exports.editRoom = (0, catchAsync_1.default)(async (req, res) => {
    const roomId = req.params.id;
    const updates = req.body;
    const room = await room_model_1.Room.findById(roomId);
    if (!room) {
        throw new AppError_1.default(404, 'Room not found');
    }
    // Parse participants if sent as JSON string
    if (updates.participants) {
        updates.participants =
            typeof updates.participants === 'string'
                ? JSON.parse(updates.participants)
                : updates.participants;
    }
    // If new avatar uploaded, upload to Cloudinary and update
    if (req.file) {
        const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.path);
        if (uploadResult) {
            room.avatar = uploadResult.secure_url;
        }
    }
    if (updates.name !== undefined)
        room.name = updates.name;
    if (updates.participants !== undefined)
        room.participants = updates.participants;
    if (updates.isBlocked !== undefined)
        room.isBlocked = updates.isBlocked;
    await room.save();
    res.status(200).json({
        success: true,
        message: 'Room updated successfully',
        data: room,
    });
});
/**************************************************************
 * GET ROOMS BY USER ID (ALL ROOMS WHERE USER IS PARTICIPANT) *
 **************************************************************/
exports.getRoomsByUserId = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.params.userId;
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new AppError_1.default(400, 'Invalid user ID');
    }
    const rooms = await room_model_1.Room.find({
        'participants.userId': new mongoose_1.default.Types.ObjectId(userId),
    }).sort({ updated_at: -1 });
    res.status(200).json({
        success: true,
        results: rooms.length,
        data: rooms,
    });
});
