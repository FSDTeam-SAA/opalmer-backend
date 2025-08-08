import express from 'express'
import { createClassAttendance } from '../controllers/attendance.controller'

const router = express.Router()

// Create attendance for all students in a class
router.post('/class', createClassAttendance)

export default router
