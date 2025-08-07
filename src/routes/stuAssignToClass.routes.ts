import express from 'express'
import {
  assignStudentToClass,
  getClassesByStudent,
  removeStudentFromClass,
  getStudentByClass,
} from '../controllers/stuAssignToClass.controller'

const router = express.Router()

// Create assignment
router.post('/', assignStudentToClass)
// Get by studentId
router.get('/student/:studentId', getClassesByStudent)
// Get by classId
router.get('/class/:classId', getStudentByClass)
// Delete by assignment ID
router.delete('/:id', removeStudentFromClass)

export default router
