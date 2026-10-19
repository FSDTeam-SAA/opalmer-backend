import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import express from 'express'
import {
  assignStudentToClass,
  getClassesByStudent,
  removeStudentFromClass,
  getStudentByClass,
} from '../controllers/stuAssignToClass.controller'
import { authorizeTypes, protect } from '../middlewares/auth.middleware'

const router = express.Router()

// Create assignment
router.post('/', protect, authorizeTypes('teacher'), resourceAccess("student-assign-to-class"), assignStudentToClass)
// Get by studentId
router.get('/student/:studentId', protect, resourceAccess("student-assign-to-class"), getClassesByStudent)
// Get by classId
router.get('/class/:classId', protect, resourceAccess("student-assign-to-class"), getStudentByClass)
// Delete by assignment ID
router.delete('/:id', protect, authorizeTypes('teacher'), resourceAccess("student-assign-to-class"), removeStudentFromClass)

export default router
