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
  const studentObjectIds = studentIds.map(id => new mongoose.Types.ObjectId(id.toString().trim()))
const normalizedIds = studentObjectIds.map(id => id.toString())

const students = await User.find({ _id: { $in: studentObjectIds } })

const foundIds = students.map(s => s._id.toString())
const missingIds = normalizedIds.filter(id => !foundIds.includes(id))

if (missingIds.length > 0) {
    throw new AppError(
        httpStatus.BAD_REQUEST,
        `These student IDs were not found: ${missingIds.join(', ')}`
    )
}

  // Optional: Check role/type if required
  const invalidRoleOrType = students.filter(s => s.role !== 'user' || s.type !== 'student')
  if (invalidRoleOrType.length > 0) {
    const invalidIds = invalidRoleOrType.map(s => s._id.toString())
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `These student IDs have invalid role/type: ${invalidIds.join(', ')}`
    )
  }

  // Create the group
  const group = await Group.create({ classId, teacherId, title, studentIds: studentObjectIds })

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
