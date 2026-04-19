import { Class } from '../models/class.model'
import catchAsync from '../utils/catchAsync'
import AppError from '../errors/AppError'
import sendResponse from '../utils/sendResponse'
import httpStatus from 'http-status'
import { User } from '../models/user.model'
import { Attendance } from '../models/attendance.model'
import { Quiz } from '../models/quiz.model'
import { QuizResult } from '../models/quizResult.model'

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
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const getClassesByStudent = catchAsync(async (req, res) => {
  const { studentId } = req.params

  const student = await User.findById(studentId).select(
    'gradeLevel username email'
  )

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found')
  }

  const rawClasses = await Class.find({ grade: student.gradeLevel }).populate(
    'teacherId',
    'username email avatar'
  )

  // Build the last-7-days window aligned to start of today, for weekly progress bucketing
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
  const weekStart = new Date(startOfToday)
  weekStart.setDate(weekStart.getDate() - 6) // 7-day window ending today

  const enriched = await Promise.all(
    rawClasses.map(async (c) => {
      const classId = c._id

      // --- Attendance % ---
      const attendanceRecords = await Attendance.find({
        classId,
        userId: studentId,
      }).select('status date')

      const counted = attendanceRecords.filter((a) => a.status !== 'Holiday')
      const presentCount = counted.filter((a) => a.status === 'present').length
      const attendancePercentage = counted.length
        ? Math.round((presentCount / counted.length) * 100)
        : null

      // --- Performance % + Weekly progress (two-hop via Quiz.classId) ---
      const classQuizzes = await Quiz.find({ classId }).select('_id')
      const quizIds = classQuizzes.map((q) => q._id)

      let performancePercentage: number | null = null
      const weeklyBuckets: Array<number[]> = Array.from({ length: 7 }, () => [])

      if (quizIds.length) {
        const completedResults = await QuizResult.find({
          quizId: { $in: quizIds },
          studentId,
          'progress.status': 'completed',
        }).select('percentage createdAt')

        if (completedResults.length) {
          const total = completedResults.reduce(
            (sum, r) => sum + (r.percentage || 0),
            0
          )
          performancePercentage = Math.round(total / completedResults.length)
        }

        for (const r of completedResults) {
          const created = (r as any).createdAt as Date | undefined
          if (!created) continue
          if (created < weekStart) continue
          const dayIndex = Math.floor(
            (created.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)
          )
          if (dayIndex >= 0 && dayIndex < 7) {
            weeklyBuckets[dayIndex].push(r.percentage || 0)
          }
        }
      }

      const weeklyProgress = weeklyBuckets.map((bucket, i) => {
        const day = new Date(weekStart)
        day.setDate(day.getDate() + i)
        return {
          dayLabel: DAY_LABELS[day.getDay()],
          percentage: bucket.length
            ? Math.round(bucket.reduce((a, b) => a + b, 0) / bucket.length)
            : null,
        }
      })

      // --- Latest activity date (most recent attendance, else class.updated_at) ---
      const lastAttendance = attendanceRecords
        .map((a) => a.date)
        .filter((d): d is Date => Boolean(d))
        .sort((a, b) => b.getTime() - a.getTime())[0]

      const lastActivityDate = (lastAttendance ?? c.get('updated_at') ?? now)
        .toISOString()

      const teacher = c.teacherId as any
      const teacherAvatar =
        (teacher && teacher.avatar && teacher.avatar.url) || null

      return {
        ...c.toObject(),
        teacherAvatar,
        attendancePercentage,
        performancePercentage,
        lastActivityDate,
        weeklyProgress,
      }
    })
  )

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Classes for student ${student.username} fetched successfully`,
    data: {
      student,
      classes: enriched,
    },
  })
})
