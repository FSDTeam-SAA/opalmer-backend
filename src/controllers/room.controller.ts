import { Request, Response } from 'express'
import { Room } from '../models/room.model'
import AppError from '../errors/AppError'
import catchAsync from '../utils/catchAsync'
import mongoose from 'mongoose'
import { uploadToCloudinary } from '../utils/cloudinary'

/*****************************************************************************
 *                               CREATE A ROOM                               *
 * * FOR 1-TO-1 ROOMS, ENSURE NO DUPLICATE ROOM EXISTS BETWEEN THE TWO USERS *
 *****************************************************************************/
export const createRoom = catchAsync(async (req: Request, res: Response) => {
  let { name, participants } = req.body

  // Parse participants from JSON string if needed
  if (typeof participants === 'string') {
    try {
      participants = JSON.parse(participants)
    } catch (err) {
      throw new AppError(400, 'Participants must be valid JSON array')
    }
  }

  if (
    !participants ||
    !Array.isArray(participants) ||
    participants.length === 0
  ) {
    throw new AppError(400, 'Participants array is required')
  }

  // Avatar upload to Cloudinary
  let avatarUrl = ''
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.path)
    if (uploadResult) avatarUrl = uploadResult.secure_url
  }

  const room = await Room.create({
    name,
    avatar: avatarUrl,
    participants,
  })

  res.status(201).json({
    success: true,
    message: 'Room created successfully',
    data: room,
  })
})

/*********************
 * * EDIT ROOM BY ID *
 *********************/
export const editRoom = catchAsync(async (req: Request, res: Response) => {
  const roomId = req.params.id
  const updates = req.body

  const room = await Room.findById(roomId)
  if (!room) {
    throw new AppError(404, 'Room not found')
  }

  // Parse participants if sent as JSON string
  if (updates.participants) {
    updates.participants =
      typeof updates.participants === 'string'
        ? JSON.parse(updates.participants)
        : updates.participants
  }

  // If new avatar uploaded, upload to Cloudinary and update
  if (req.file) {

    const uploadResult = await uploadToCloudinary(req.file.path)
    if (uploadResult) {
      room.avatar = uploadResult.secure_url
    }
  }

  if (updates.name !== undefined) room.name = updates.name
  if (updates.participants !== undefined)
    room.participants = updates.participants
  if (updates.isBlocked !== undefined) room.isBlocked = updates.isBlocked

  await room.save()

  res.status(200).json({
    success: true,
    message: 'Room updated successfully',
    data: room,
  })
})


/**************************************************************
 * GET ROOMS BY USER ID (ALL ROOMS WHERE USER IS PARTICIPANT) *
 **************************************************************/
export const getRoomsByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.userId

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError(400, 'Invalid user ID')
    }

    const rooms = await Room.find({
      'participants.userId': new mongoose.Types.ObjectId(userId),
    }).sort({ updated_at: -1 })

    res.status(200).json({
      success: true,
      results: rooms.length,
      data: rooms,
    })
  }
)
