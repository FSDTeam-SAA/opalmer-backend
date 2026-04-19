import AppError from '../errors/AppError'
import catchAsync from '../utils/catchAsync'
import { Attendance } from '../models/attendance.model'
import { StuAssignToClass } from '../models/stuAssignToClass.model'
import { Class } from '../models/class.model'
import { User } from '../models/user.model'
import sendResponse from '../utils/sendResponse'
import httpStatus from 'http-status'
import { buildMetaPagination, getPaginationParams } from '../utils/pagination'
import { Types } from 'mongoose'

/**************************************
 * CREATE ATTENDANCE FOR ENTIRE CLASS *
 **************************************/
export const createClassAttendance = catchAsync(async (req, res) => {
  const { classId, date } = req.body

  if (!classId) throw new AppError(400, 'Class Id is required')

  const attendanceDate = date ? new Date(date) : new Date()
  if (Number.isNaN(attendanceDate.getTime())) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid attendance date')
  }

  // Non-mutating start/end of day (UTC), matches getAllAttendance's pattern
  const startOfDay = new Date(attendanceDate)
  startOfDay.setUTCHours(0, 0, 0, 0)
  const endOfDay = new Date(attendanceDate)
  endOfDay.setUTCHours(23, 59, 59, 999)

  // First use explicit class assignments. If the class has no assignment rows,
  // fall back to the grade-based membership used by /classes/student/:studentId.
  const assignments = await StuAssignToClass.find({ classId }).select(
    'studentId'
  )
  let rosterSource: 'assignment' | 'grade' = 'assignment'
  let studentIds = assignments.map((assignment) =>
    assignment.studentId.toString()
  )

  if (studentIds.length === 0) {
    const classInfo = await Class.findById(classId).select('grade')

    if (!classInfo) {
      throw new AppError(httpStatus.NOT_FOUND, 'Class not found')
    }

    const gradeStudents = await User.find({
      type: 'student',
      gradeLevel: classInfo.grade,
      isActive: true,
    }).select('_id')

    rosterSource = 'grade'
    studentIds = gradeStudents.map((student) => student.id)
  }

  studentIds = Array.from(new Set(studentIds))

  if (studentIds.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No students found for this class')
  }

  // Attendance is unique per student per class per day. Existing rows should
  // not block missing students from getting records.
  const existingRecords = await Attendance.find({
    classId,
    userId: { $in: studentIds },
    date: { $gte: startOfDay, $lte: endOfDay },
  })

  const existingStudentIds = new Set(
    existingRecords.map((record) => record.userId.toString())
  )
  const missingStudentIds = studentIds.filter(
    (studentId) => !existingStudentIds.has(studentId)
  )

  // Prepare attendance documents
  const attendanceDocument = missingStudentIds.map((studentId) => ({
    classId,
    userId: studentId,
    status: 'absent',
    date: startOfDay,
  }))

  // Insert all data and keep the persisted docs so _id is returned
  const inserted = attendanceDocument.length
    ? await Attendance.insertMany(attendanceDocument)
    : []

  sendResponse(res, {
    statusCode: inserted.length ? httpStatus.CREATED : httpStatus.OK,
    success: true,
    message: inserted.length
      ? 'Attendance created for missing students in class'
      : 'Attendance already exists for all students in class on this date',
    data: {
      rosterSource,
      rosterCount: studentIds.length,
      createdCount: inserted.length,
      existingCount: existingRecords.length,
      created: inserted,
      existing: existingRecords,
    },
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
  const status =
    req.body.status ??
    req.body.statusText ??
    req.body.statusLabel ??
    req.body.customStatus

  if (id === undefined) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Attendance Id is required')
  }

  if (typeof status !== 'string' || status.trim().length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'status is required and must be a non-empty string'
    )
  }

  const normalizedStatus = status.trim()
  if (normalizedStatus.length > 50) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'status must be 50 characters or less'
    )
  }

  const updatedAttendance = await Attendance.findByIdAndUpdate(
    id,
    { status: normalizedStatus },
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

/******************************************
 * GET CLASS ATTENDANCE STATS (30 DAYS) *
 ******************************************/
export const getClassAttendanceStats = catchAsync(async (req, res) => {
  const { classId } = req.params

  if (!classId) throw new AppError(400, 'Class Id is required')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Use aggregation to find present count vs total count in the last 30 days
  const stats = await Attendance.aggregate([
    {
      $match: {
        classId: new Types.ObjectId(classId),
        date: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: '$classId',
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
          },
        },
      },
    },
  ])

  let percentage = 0
  if (stats.length > 0) {
    percentage = Math.round((stats[0].present / stats[0].total) * 100)
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class attendance stats fetched successfully',
    data: { percentage },
  })
})

export const getStudentAttendanceStats = catchAsync(async (req, res) => {
  const { studentId } = req.params
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const stats = await Attendance.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(studentId),
        date: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $toLower: '$status' },
        count: { $sum: 1 },
      },
    },
  ])

  const total = stats.reduce((acc, curr) => acc + curr.count, 0)
  const present = stats.find((s) => s._id === 'present')?.count || 0
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0

  res.status(200).json({
    success: true,
    data: {
      percentage,
      totalRecords: total,
    },
  })
})
