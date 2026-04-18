import mongoose from 'mongoose'
import httpStatus from 'http-status'
import AppError from '../errors/AppError'
import catchAsync from '../utils/catchAsync'
import sendResponse from '../utils/sendResponse'
import { GroupWork } from '../models/groupWork.model'

/***********************************
 * GET GROUP WORK FOR A CLASS      *
 *   (populates members w/ avatar) *
 ***********************************/
export const getGroupWorkByClass = catchAsync(async (req, res) => {
  const { classId } = req.params
  const { archived } = req.query

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid class ID')
  }

  const filter: Record<string, any> = { classId }
  if (archived === 'true') filter.archived = true
  else if (archived === 'false') filter.archived = false

  const groupWork = await GroupWork.find(filter)
    .populate('userId', 'username avatar')
    .sort({ created_at: -1 })

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Group homework for class fetched successfully',
    data: groupWork,
  })
})