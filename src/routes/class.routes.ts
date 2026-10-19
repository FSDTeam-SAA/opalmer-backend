import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import express from 'express'
import {
  createClass,
  getAllClasses,
  getClassesByTeacher,
  updateClass,
  deleteClass,
  getgradeWiseClasses,
  getClassesByStudent,
} from '../controllers/class.controller'
import { authorizeTypes, protect } from '../middlewares/auth.middleware'

const router = express.Router()

router.post('/', protect, authorizeTypes('teacher'), resourceAccess("classes"), createClass)
router.get('/', resourceAccess("classes"), getAllClasses)
// Get All Classes
router.get('/teacher/:teacherId', resourceAccess("classes"), getClassesByTeacher)
// Get Classes by Teacher ID
router.put('/:id', resourceAccess("classes"), updateClass)
router.delete('/:id', resourceAccess("classes"), deleteClass)

// grade wise classes
router.get(
  '/grade',
  protect,
  authorizeTypes('student'),
  resourceAccess("classes"), getgradeWiseClasses
) 

// Get classes by student ID
router.get('/student/:studentId', protect, resourceAccess("classes"), getClassesByStudent)


export default router
