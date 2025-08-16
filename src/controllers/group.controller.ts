import AppError from '../errors/AppError'
import catchAsync from '../utils/catchAsync'
import sendResponse from '../utils/sendResponse'
import httpStatus from 'http-status'
import mongoose from 'mongoose'
import { Group } from '../models/group.model'
import { User } from '../models/user.model'
import { Class } from '../models/class.model'

/*************************
 * CREATE GROUP          *
 *************************/
export const createGroup = catchAsync(async (req, res) => {
  const { classId, teacherId, title, studentIds } = req.body

  if (!classId) throw new AppError(httpStatus.BAD_REQUEST, 'Class ID is required')
  if (!teacherId) throw new AppError(httpStatus.BAD_REQUEST, 'Teacher ID is required')
  if (!title) throw new AppError(httpStatus.BAD_REQUEST, 'Title is required')
  if (!Array.isArray(studentIds)) throw new AppError(httpStatus.BAD_REQUEST, 'studentIds must be an array')

  // Check if Class exists
  const classExists = await Class.findById(classId)
  if (!classExists) throw new AppError(httpStatus.BAD_REQUEST, 'Class not found')

  // Check if Teacher exists
  const teacherExists = await User.findById(teacherId)
  if (!teacherExists) throw new AppError(httpStatus.BAD_REQUEST, 'Teacher not found')

  // Check if all students exist
 const studentsCount = await User.countDocuments({
  _id: { $in: studentIds },
  role: 'User',
  type: 'student',
})
if (studentsCount !== studentIds.length)
  throw new AppError(httpStatus.BAD_REQUEST, 'One or more students not found or invalid role/type')
  const group = await Group.create({ classId, teacherId, title, studentIds })

  // Populate student details for response
  await group.populate('studentIds', 'name email')

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Group created successfully',
    data: group,
  })
})

/*************************
 * GET GROUP BY ID       *
 *************************/
export const getGroupById = catchAsync(async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid group ID')

  const group = await Group.findById(id).populate('studentIds', 'name email')

  if (!group) throw new AppError(httpStatus.NOT_FOUND, 'Group not found')

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Group fetched successfully',
    data: group,
  })
})

/*************************
 * DELETE GROUP BY ID     *
 *************************/
export const deleteGroupById = catchAsync(async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid group ID')

  const deletedGroup = await Group.findByIdAndDelete(id)

  if (!deletedGroup) throw new AppError(httpStatus.NOT_FOUND, 'Group not found')

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Group deleted successfully',
  })
})
