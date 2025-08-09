import AppError from '../errors/AppError'
import catchAsync from '../utils/catchAsync'
import { Attendance } from '../models/attendance.model'
import { StuAssignToClass } from '../models/stuAssignToClass.model'

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
