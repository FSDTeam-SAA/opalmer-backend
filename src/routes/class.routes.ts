import express from 'express'
import {
  createClass,
  getAllClasses,
  getClassesByTeacher,
  updateClass,
  deleteClass,
} from '../controllers/class.controller'

const router = express.Router()

router.post('/', createClass)
router.get('/', getAllClasses)
// Get All Classes
router.get('/teacher/:teacherId', getClassesByTeacher)
// Get Classes by Teacher ID
router.put('/:id', updateClass)
router.delete('/:id', deleteClass)

export default router
