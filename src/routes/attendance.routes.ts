import express from 'express'
import {
  createClassAttendance,
  changeAttendanceStatus,
  getAllAttendance,
} from '../controllers/attendance.controller'

const router = express.Router()

// Create attendance for all students in a class
router.post('/class', createClassAttendance)

//  * CHANGE ATTENDANCE STATUS *
router.patch('/class/:id', changeAttendanceStatus)

//  * GET ALL ATTENDANCE *
router.get('/class', getAllAttendance)

export default router
