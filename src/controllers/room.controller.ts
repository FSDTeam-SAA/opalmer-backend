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
  const { name, participants } = req.body

  if (
    !participants ||
    !Array.isArray(participants) ||
    participants.length === 0
  ) {
    throw new AppError(400, 'Participants array is required')
  }

  // Parse participants if sent as JSON string (common in form-data)
  let parsedParticipants = participants
  if (typeof participants === 'string') {
    parsedParticipants = JSON.parse(participants)
  }

  // 1-to-1 duplicate room check
  if (parsedParticipants.length === 2) {
    const userIds = parsedParticipants.map(
      (p: any) => new mongoose.Types.ObjectId(p.userId)
    )

    const existingRoom = await Room.findOne({
      participants: {
        $all: userIds.map((id) => ({ $elemMatch: { userId: id } })),
        $size: 2,
      },
      name: { $exists: false },
    })

    if (existingRoom) {
      return res.status(200).json({
        success: true,
        message: '1-to-1 room between these users already exists',
        data: existingRoom,
      })
    }
  }

  // Handle avatar upload via Cloudinary
  let avatarUrl = ''
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.path)
    if (uploadResult) {
      avatarUrl = uploadResult.secure_url
    }
  }

  const room = await Room.create({
    name,
    avatar: avatarUrl,
    participants: parsedParticipants,
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
