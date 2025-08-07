import catchAsync from '../utils/catchAsync'
import AppError from '../errors/AppError'
import sendResponse from '../utils/sendResponse'
import httpStatus from 'http-status'
import { StuAssignToClass } from '../models/stuAssignToClass.model'

/******************************
 * ASSIGN STUDENT TO CLASS *
 ******************************/
export const assignStudentToClass = catchAsync(async (req, res) => {
  const { studentId, classId } = req.body

  if (!studentId || !classId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'studentId and classId are required'
    )
  }

  // Check if already assigned
  const existingAssignment = await StuAssignToClass.findOne({
    studentId,
    classId,
  })
  if (existingAssignment) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Student already assigned to this class'
    )
  }

  const newAssignment = await StuAssignToClass.create({ studentId, classId })

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Student assigned to class successfully',
    data: newAssignment,
  })
})

/******************************
 * GET CLASSES BY STUDENT ID *
 ******************************/
export const getClassesByStudent = catchAsync(async (req, res) => {
  const { studentId } = req.params

  const assignments = await StuAssignToClass.find({ studentId })
    .populate('classId', 'grade subject section schedule')
    .populate('studentId', 'username email')

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Classes for student fetched successfully',
    data: assignments,
  })
})

/******************************
 * GET STUDENTS BY CLASS ID *
 ******************************/
export const getStudentByClass = catchAsync(async (req, res) => {
  const { classId } = req.params

  const assignments = await StuAssignToClass.find({ classId })
    .populate('classId', 'grade subject section schedule')
    .populate(
      'studentId',
      '-password_reset_token -refreshToken -verificationInfo'
    )

  if (!assignments) {
    throw new AppError(httpStatus.NOT_FOUND, 'No students found for this class')
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Students for class fetched successfully',
    data: assignments,
  })
})

/***************************
 * REMOVE STUDENT ASSIGNMENT *
 ***************************/
export const removeStudentFromClass = catchAsync(async (req, res) => {
  const { id } = req.params

  const deletedAssignment = await StuAssignToClass.findByIdAndDelete(id)
  if (!deletedAssignment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Assignment not found')
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student removed from class successfully',
    data: null,
  })
})
