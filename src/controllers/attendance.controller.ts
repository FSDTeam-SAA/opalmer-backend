import AppError from '../errors/AppError'
import catchAsync from '../utils/catchAsync'
import { Attendance } from '../models/attendance.model'
import { StuAssignToClass } from '../models/stuAssignToClass.model'
import sendResponse from '../utils/sendResponse'
import httpStatus from 'http-status'

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

  // Provent duplicate attendance for same date and class
  const existingRecords = await Attendance.find({
    classId,
    date: {
      $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
      $lt: new Date(attendanceDate.setHours(23, 59, 59, 999)),
    },
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
    present: 'absent',
    date: attendanceDate,
  }))

  // Insert all data
  await Attendance.insertMany(attendanceDocument)
  res.status(201).json({
    success: true,
    message: 'Attendance created for all students in class',
    data: attendanceDocument,
  })
})

/*************************
 * // GET ALL ATTENDANCE *
 *************************/
// - IF DATE PROVIDE THEN GET ALL ATTENDANCE FOR THAT DATE
// - IF NOT THEN FOR TODAY DATE GET ALL ATTENDANCE
// - AND NEED TO GATE MONTHLY ATTENDANCE

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
  const { present } = req.body

  if (id === undefined) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Attendance Id is required')
  }

  const updatedAttendance = await Attendance.findByIdAndUpdate(
    id,
    { present },
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
