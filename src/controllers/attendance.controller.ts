import AppError from '../errors/AppError'
import catchAsync from '../utils/catchAsync'
import { Attendance } from '../models/attendance.model'
import { StuAssignToClass } from '../models/stuAssignToClass.model'
import sendResponse from '../utils/sendResponse'
import httpStatus from 'http-status'
import { buildMetaPagination, getPaginationParams } from '../utils/pagination'

/**************************************
 * CREATE ATTENDANCE FOR ENTIRE CLASS *
 **************************************/
export const createClassAttendance = catchAsync(async (req, res) => {
  const { classId, date } = req.body

  if (!classId) throw new AppError(400, 'Class Id is required')

  // find all the student in the class
  const assignStudent = await StuAssignToClass.find({ classId }).populate(
    'studentId',
    '_id'
  )

  if (assignStudent.length === 0) {
    throw new AppError(404, 'No students found for this class')
  }

  const attendanceDate = date ? new Date(date) : new Date()

  // Non-mutating start/end of day (UTC), matches getAllAttendance's pattern
  const startOfDay = new Date(attendanceDate)
  startOfDay.setUTCHours(0, 0, 0, 0)
  const endOfDay = new Date(attendanceDate)
  endOfDay.setUTCHours(23, 59, 59, 999)

  // Prevent duplicate attendance for same date and class
  const existingRecords = await Attendance.find({
    classId,
    date: { $gte: startOfDay, $lte: endOfDay },
  })

  if (existingRecords.length > 0) {
    throw new AppError(
      409,
      'Attendance for this class on this date already exists'
    )
  }

  // Prepare attendance documents
  const attendanceDocument = assignStudent.map((stu) => ({
    classId,
    userId: stu.studentId._id,
    status: 'absent',
    date: startOfDay,
  }))

  // Insert all data and keep the persisted docs so _id is returned
  const inserted = await Attendance.insertMany(attendanceDocument)

  res.status(201).json({
    success: true,
    message: 'Attendance created for all students in class',
    data: inserted,
  })
})

/*************************
 * // GET ALL ATTENDANCE *
 *************************/
export const getAllAttendance = catchAsync(async (req, res) => {
  const { classId, date } = req.query

  const targetDate = date ? new Date(date.toString()) : new Date()

  const startOfDay = new Date(targetDate)
  startOfDay.setUTCHours(0, 0, 0, 0)

  const endOfDay = new Date(targetDate)
  endOfDay.setUTCHours(23, 59, 59, 999)

  const attendance = await Attendance.find({
    classId,
    date: { $gte: startOfDay, $lte: endOfDay },
  })

  if (attendance.length === 0) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'No attendance found for this date'
    )
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance fetched successfully',
    data: attendance,
  })
})

/****************************
 * CHANGE ATTENDANCE STATUS *
 ****************************/
export const changeAttendanceStatus = catchAsync(async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (id === undefined) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Attendance Id is required')
  }

  const allowed = ['present', 'absent', 'tardy', 'Holiday']
  if (!status || !allowed.includes(status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `status is required and must be one of: ${allowed.join(', ')}`
    )
  }

  const updatedAttendance = await Attendance.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  )

  if (!updatedAttendance) {
    throw new AppError(httpStatus.NOT_FOUND, 'Attendance not found')
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance status updated successfully',
    data: updatedAttendance,
  })
})

/*********************************
 * GET ATTENDANCE FOR A STUDENT  *
 *********************************/
export const getStudentAttendance = catchAsync(async (req, res) => {
  const { userId, classId } = req.query

  if (!userId || !classId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'userId and classId are required'
    )
  }

  // Pagination params
  const { page, limit, skip } = getPaginationParams(req.query)

  // Fetch total count for pagination
  const totalItems = await Attendance.countDocuments({ userId, classId })

  // Fetch paginated data (latest first)
  const attendanceRecords = await Attendance.find({ userId, classId })
    .sort({ date: -1 }) // latest first
    .skip(skip)
    .limit(limit)

  if (attendanceRecords.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No attendance records found')
  }

  const meta = buildMetaPagination(totalItems, page, limit)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student attendance fetched successfully',
    data: { attendanceRecords, meta },
  })
})
