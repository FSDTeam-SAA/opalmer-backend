import { Request, Response } from 'express'
import { User } from '../models/user.model'
import catchAsync from '../utils/catchAsync'
import httpStatus from 'http-status'
import sendResponse from '../utils/sendResponse'

export const getUserStats = catchAsync(async (_req: Request, res: Response) => {
  // Count each type
  const totalStudents = await User.countDocuments({ type: 'student' })
  const totalParents = await User.countDocuments({ type: 'parent' })
  const totalTeachers = await User.countDocuments({ type: 'teacher' })

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User stats fetched successfully',
    data: {
      totalStudents,
      totalParents,
      totalTeachers,
    },
  })
})
