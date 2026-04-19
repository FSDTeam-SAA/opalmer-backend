import express from 'express'
import {
  createClassAttendance,
  changeAttendanceStatus,
  getAllAttendance,
  getStudentAttendance,
  getClassAttendanceStats,
  getStudentAttendanceStats,
} from '../controllers/attendance.controller'
import { authorizeTypes, protect } from '../middlewares/auth.middleware'

const router = express.Router()

// Create attendance for all students in a class
router.post('/class', createClassAttendance)

//  * CHANGE ATTENDANCE STATUS *
router.patch('/class/:id', changeAttendanceStatus)

//  * GET ALL ATTENDANCE *
router.get('/class', protect, getAllAttendance)

// * GET ALL ATTENDANCE FOR A STUDENT *
router.get('/student', protect, getStudentAttendance)

// * GET CLASS ATTENDANCE STATS *
router.get('/class/:classId/stats', protect, getClassAttendanceStats)

// * GET STUDENT ATTENDANCE STATS *
router.get('/student/:studentId/stats', protect, getStudentAttendanceStats)

export default router
