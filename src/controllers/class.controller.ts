import { Class } from '../models/class.model'
import catchAsync from '../utils/catchAsync'
import AppError from '../errors/AppError'
import sendResponse from '../utils/sendResponse'
import httpStatus from 'http-status'
import { User } from '../models/user.model'

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

/**************************
 * GET GRADE WISE CLASSES *
 **************************/
export const getgradeWiseClasses = catchAsync(async (req, res) => {
  const studentId = req.user?._id

  const student = await User.findById(studentId).select('grade')
  console.log(1, student)

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found')
  }
  const grade = student.gradeLevel

  console.log(11, grade)

  const classes = await Class.find({ grade }).populate(
    'teacherId',
    '-password_reset_token -refreshToken -verificationInfo'
  )

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Classes fetched successfully',
    data: classes,
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

/*********************************
 * GET CLASSES BY STUDENT ID *
 *********************************/
export const getClassesByStudent = catchAsync(async (req, res) => {
  const { studentId } = req.params

  // Find student and get their grade
  const student = await User.findById(studentId).select(
    'gradeLevel username email'
  )

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found')
  }

  // Get classes matching student's grade
  const classes = await Class.find({ grade: student.gradeLevel }).populate(
    'teacherId',
    'username email'
  )

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Classes for student ${student.username} fetched successfully`,
    data: {
      student,
      classes,
    },
  })
})
