import { Class } from '../models/class.model'
import catchAsync from '../utils/catchAsync'
import AppError from '../errors/AppError'
import sendResponse from '../utils/sendResponse'
import httpStatus from 'http-status'

/******************
 * CREATE CLASS *
 ******************/
export const createClass = catchAsync(async (req, res) => {
  const { teacherId, grade, subject, section, schedule } = req.body

  if (!teacherId || !grade || !subject) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'teacherId, grade, and subject are required'
    )
  }

  const newClass = await Class.create({
    teacherId,
    grade,
    subject,
    section,
    schedule,
  })

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Class created successfully',
    data: newClass,
  })
})

/*********************
 * GET ALL CLASSES *
 *********************/
export const getAllClasses = catchAsync(async (req, res) => {
  const classes = await Class.find().populate('teacherId', 'username email')

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All classes fetched successfully',
    data: classes,
  })
})

/******************************
 * GET CLASSES BY TEACHER ID *
 ******************************/
export const getClassesByTeacher = catchAsync(async (req, res) => {
  const { teacherId } = req.params

  const classes = await Class.find({ teacherId }).populate(
    'teacherId',
    'username email'
  )

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Classes fetched successfully',
    data: classes,
  })
})

/******************
 * UPDATE CLASS *
 ******************/
export const updateClass = catchAsync(async (req, res) => {
  const { id } = req.params
  const { grade, subject, section, schedule } = req.body

  const updatedClass = await Class.findByIdAndUpdate(
    id,
    { grade, subject, section, schedule },
    { new: true }
  )

  if (!updatedClass) {
    throw new AppError(httpStatus.NOT_FOUND, 'Class not found')
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class updated successfully',
    data: updatedClass,
  })
})

/******************
 * DELETE CLASS *
 ******************/
export const deleteClass = catchAsync(async (req, res) => {
  const { id } = req.params

  const deletedClass = await Class.findByIdAndDelete(id)
  if (!deletedClass) {
    throw new AppError(httpStatus.NOT_FOUND, 'Class not found')
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class deleted successfully',
    data: null,
  })
})
