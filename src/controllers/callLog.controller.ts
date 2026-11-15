import { Request, Response } from 'express'
import httpStatus from 'http-status'
import { CallLog } from '../models/callLog.model'
import catchAsync from '../utils/catchAsync'
import AppError from '../errors/AppError'
import { canAccessRoom } from '../utils/chatAccess'

const TERMINAL_STATUSES = new Set([
  'missed',
  'completed',
  'declined',
  'cancelled',
  'busy'
])

export const createCallLog = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as any
  const { roomId, receiverId, callType } = req.body

  if (!authUser?._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated')
  }

  const room = await canAccessRoom(authUser._id.toString(), roomId)
  if (room.type !== 'direct') throw new AppError(400, 'Only direct rooms support calling right now')
  if (room.isBlocked || room.blockedBy?.length) throw new AppError(403, 'Calling is blocked in this conversation')
  if (!receiverId || String(receiverId) === String(authUser._id) ||
      !room.participants.some(participant => String(participant.userId) === String(receiverId))) {
    throw new AppError(403, 'Receiver must be the other participant in this conversation')
  }
  if (callType && callType !== 'audio') throw new AppError(400, 'Audio calls only are supported')

  const callLog = await CallLog.create({
    roomId,
    callerId: authUser._id,
    receiverId,
    callType: 'audio',
    status: 'ongoing',
    startedAt: new Date()
  })

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Call log created',
    data: callLog
  })
})

export const answerCallLog = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as any
  const { id } = req.params

  if (!authUser?._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated')
  }

  const callLog = await CallLog.findById(id)
  if (!callLog) {
    throw new AppError(httpStatus.NOT_FOUND, 'Call log not found')
  }

  await canAccessRoom(authUser._id.toString(), callLog.roomId.toString())
  if (String(callLog.receiverId) !== String(authUser._id)) throw new AppError(403, 'Only the receiver can answer this call')

  if (!callLog.answeredAt && !TERMINAL_STATUSES.has(callLog.status)) {
    callLog.answeredAt = new Date()
    await callLog.save()
  }

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Call marked as answered',
    data: callLog
  })
})

export const endCallLog = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as any
  const { id } = req.params
  const { status, duration } = req.body

  const callLog = await CallLog.findById(id)
  if (!callLog) {
    throw new AppError(httpStatus.NOT_FOUND, 'Call log not found')
  }

  await canAccessRoom(authUser._id.toString(), callLog.roomId.toString())
  if (![String(callLog.callerId), String(callLog.receiverId)].includes(String(authUser._id))) {
    throw new AppError(403, 'Only call participants can end this call')
  }
  if (status !== undefined && !TERMINAL_STATUSES.has(status)) throw new AppError(400, 'Choose a valid final call status')
  if (duration !== undefined && (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0)) {
    throw new AppError(400, 'Call duration must be a non-negative number')
  }

  if (TERMINAL_STATUSES.has(callLog.status) && callLog.endedAt) {
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Call log already finalized',
      data: callLog
    })
    return
  }

  callLog.status = status || 'completed'
  callLog.endedAt = new Date()

  if (duration !== undefined) {
    callLog.duration = duration
  } else if (callLog.status === 'completed' && callLog.answeredAt) {
    callLog.duration = Math.max(
      0,
      Math.floor((callLog.endedAt.getTime() - callLog.answeredAt.getTime()) / 1000)
    )
  } else {
    callLog.duration = 0
  }

  await callLog.save()

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Call log updated',
    data: callLog
  })
})

export const getMyCallLogs = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as any
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  if (!authUser?._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated')
  }

  const logs = await CallLog.find({
    $or: [{ callerId: authUser._id }, { receiverId: authUser._id }]
  })
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('callerId', 'username avatar type')
    .populate('receiverId', 'username avatar type')
    .populate('roomId', 'username avatar type')

  const total = await CallLog.countDocuments({
    $or: [{ callerId: authUser._id }, { receiverId: authUser._id }]
  })

  res.status(httpStatus.OK).json({
    success: true,
    data: logs,
    meta: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total
    }
  })
})
