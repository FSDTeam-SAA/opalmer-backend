import { Request, Response } from 'express'
import { Room } from '../models/room.model'
import AppError from '../errors/AppError'
import catchAsync from '../utils/catchAsync'
import mongoose from 'mongoose'
import { uploadToCloudinary } from '../utils/cloudinary'
import httpStatus from 'http-status'
import { User } from '../models/user.model'
import {
  canCreateDirectRoom,
  canMessageUser,
  canAccessRoom,
} from '../utils/chatAccess'

const parseParticipants = (participants: unknown): string[] => {
  if (!participants) return []

  let raw = participants
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch (err) {
      throw new AppError(400, 'Participants must be valid JSON array')
    }
  }

  if (!Array.isArray(raw)) {
    throw new AppError(400, 'Participants array is required')
  }

  const ids = raw
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object' && 'userId' in item) {
        const value = (item as { userId?: unknown }).userId
        return value ? String(value) : ''
      }
      return ''
    })
    .filter(Boolean)

  return ids
}

export const setRoomBlock = catchAsync(async (req: Request, res: Response) => {
  const userId = String(req.user!._id)
  const room = await canAccessRoom(userId, req.params.id)
  if (room.type !== 'direct') throw new AppError(400, 'Blocking is available for direct conversations')
  if (typeof req.body.blocked !== 'boolean') throw new AppError(400, 'Choose whether to block the conversation')
  const updated = await Room.findByIdAndUpdate(room._id, req.body.blocked ? { $addToSet: { blockedBy: req.user!._id } } : { $pull: { blockedBy: req.user!._id } }, { new: true })
  res.json({ success: true, data: updated })
})

/*****************************************************************************
 *                               CREATE A ROOM                               *
 * * FOR 1-TO-1 ROOMS, ENSURE NO DUPLICATE ROOM EXISTS BETWEEN THE TWO USERS *
 *****************************************************************************/
export const createRoom = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as any
  const { name } = req.body
  const isCallMode = req.body.callMode === true || req.body.callMode === 'true'

  if (!authUser?._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated')
  }

  const parsedParticipants = parseParticipants(req.body.participants)
  if (!parsedParticipants.length) {
    throw new AppError(400, 'Participants array is required')
  }

  const normalizedParticipantIds = [
    ...new Set(parsedParticipants.map((id) => id.toString())),
  ]

  const invalidParticipant = normalizedParticipantIds.find(
    (id) => !mongoose.Types.ObjectId.isValid(id),
  )
  if (invalidParticipant) {
    throw new AppError(400, 'Invalid participant ID found')
  }

  if (
    !normalizedParticipantIds.some((id) =>
      new mongoose.Types.ObjectId(id).equals(
        new mongoose.Types.ObjectId(authUser._id),
      ),
    )
  ) {
    normalizedParticipantIds.push(authUser._id.toString())
  }

  if (normalizedParticipantIds.length < 2) {
    throw new AppError(400, 'A room must contain at least two participants')
  }

  const participantUsers = await User.find({
    _id: { $in: normalizedParticipantIds },
  }).select('_id isActive type')

  if (participantUsers.length !== normalizedParticipantIds.length) {
    throw new AppError(404, 'One or more participants were not found')
  }

  if (participantUsers.some((u) => !u.isActive)) {
    throw new AppError(400, 'Cannot create room with inactive users')
  }

  if (req.body.type !== undefined && !['direct', 'group'].includes(req.body.type)) {
    throw new AppError(400, 'Invalid room type')
  }
  if (req.body.type === 'direct' && normalizedParticipantIds.length !== 2) {
    throw new AppError(400, 'Direct rooms must have two participants')
  }
  const isDirectRoom = req.body.type !== 'group' && normalizedParticipantIds.length === 2

  if (isDirectRoom) {
    {
      await canCreateDirectRoom(
        authUser._id.toString(),
        normalizedParticipantIds,
      )
    }

    const existingDirectRooms = await Room.find({
      type: 'direct',
      'participants.userId': {
        $all: normalizedParticipantIds.map(
          (id) => new mongoose.Types.ObjectId(id),
        ),
      },
    })

    const existingDirectRoom = existingDirectRooms.find(
      (room) => room.participants.length === 2,
    )

    if (existingDirectRoom) {
      return res.status(200).json({
        success: true,
        message: 'Direct room already exists',
        data: existingDirectRoom,
      })
    }
  } else {
    if (isCallMode) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Call mode is only supported for direct rooms',
      )
    }

    if (authUser.type === 'student') {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Students cannot create group rooms',
      )
    }

    const permissionChecks = await Promise.all(
      normalizedParticipantIds
        .filter((id) => id !== authUser._id.toString())
        .map(async (participantId) => {
          const result = await canMessageUser(
            authUser._id.toString(),
            participantId,
          )
          return { participantId, ...result }
        }),
    )

    const blocked = permissionChecks.find((check) => !check.allowed)
    if (blocked) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        blocked.reason ||
          'You cannot create this room with the selected participants',
      )
    }
  }

  // Avatar upload to Cloudinary
  let avatarUrl = ''
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.path)
    if (!uploadResult) throw new AppError(502, 'Photo upload failed')
    if (uploadResult) avatarUrl = uploadResult.secure_url
  }

  const room = await Room.create({
    name,
    avatar: avatarUrl,
    type: isDirectRoom ? 'direct' : 'group',
    createdBy: authUser._id,
    participants: normalizedParticipantIds.map((id) => ({
      userId: new mongoose.Types.ObjectId(id),
    })),
  })

  const populatedRoom = await Room.findById(room._id).populate(
    'participants.userId',
    'username avatar type role',
  )

  res.status(201).json({
    success: true,
    message: 'Room created successfully',
    data: populatedRoom,
  })
})

/*********************
 * * EDIT ROOM BY ID *
 *********************/
export const editRoom = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as any
  const roomId = req.params.id
  const updates = req.body

  if (!authUser?._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated')
  }

  const room = await canAccessRoom(authUser._id.toString(), roomId)

  if ((updates.participants !== undefined || updates.name !== undefined || req.file || updates.removeAvatar) &&
      (room.type !== 'group' || String(room.createdBy) !== String(authUser._id))) {
    throw new AppError(403, 'Only the group creator can change group details or members')
  }

  // If new avatar uploaded, upload to Cloudinary and update
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.path)
    if (!uploadResult) throw new AppError(502, 'Photo upload failed. The previous photo has been kept.')
    if (uploadResult) {
      room.avatar = uploadResult.secure_url
    }
  }

  if (updates.removeAvatar === true || updates.removeAvatar === 'true') {
    if (req.file) throw new AppError(400, 'Choose a new photo or remove the current photo');
    room.avatar = '';
  }
  if (updates.name !== undefined) room.name = updates.name

  if (updates.participants !== undefined) {
    const parsedParticipants = parseParticipants(updates.participants)
    if (!parsedParticipants.length) {
      throw new AppError(400, 'Participants array is required')
    }

    const normalizedParticipantIds = [
      ...new Set(parsedParticipants.map((id) => id.toString())),
    ]

    if (normalizedParticipantIds.length < 2) throw new AppError(400, 'A group must contain at least two participants')

    const invalidParticipant = normalizedParticipantIds.find(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    )
    if (invalidParticipant) {
      throw new AppError(400, 'Invalid participant ID found')
    }

    if (
      !normalizedParticipantIds.some((id) =>
        new mongoose.Types.ObjectId(id).equals(
          new mongoose.Types.ObjectId(authUser._id),
        ),
      )
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You cannot remove yourself from a room update',
      )
    }

    const participantUsers = await User.find({
      _id: { $in: normalizedParticipantIds },
    }).select('_id isActive')

    if (participantUsers.length !== normalizedParticipantIds.length) {
      throw new AppError(404, 'One or more participants were not found')
    }

    if (participantUsers.some((u) => !u.isActive)) {
      throw new AppError(400, 'Cannot update room with inactive users')
    }

    for (const participantId of normalizedParticipantIds) {
      if (participantId === String(authUser._id)) continue
      const access = await canMessageUser(String(authUser._id), participantId)
      if (!access.allowed) throw new AppError(403, access.reason || 'Participant access denied')
    }

    room.participants = normalizedParticipantIds.map((id) => ({
      userId: new mongoose.Types.ObjectId(id),
    }))
  }

  if (updates.isBlocked !== undefined) room.isBlocked = updates.isBlocked

  await room.save()

  const populatedRoom = await Room.findById(room._id).populate(
    'participants.userId',
    'username avatar type',
  )

  res.status(200).json({
    success: true,
    message: 'Room updated successfully',
    data: populatedRoom,
  })
})

/**************************************************************
 * GET ROOMS BY USER ID (ALL ROOMS WHERE USER IS PARTICIPANT) *
 **************************************************************/
export const getRoomsByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const authUser = req.user as any

    if (!authUser?._id) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated')
    }

    const rooms = await Room.find({
      'participants.userId': authUser._id,
    })
      .populate('participants.userId', 'username avatar type role')
      .populate('lastMessageId')
      .sort({ updated_at: -1 })

    res.status(200).json({
      success: true,
      results: rooms.length,
      data: rooms,
    })
  },
)
