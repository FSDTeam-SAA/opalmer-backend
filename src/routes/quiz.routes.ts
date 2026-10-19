import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import { Router } from 'express'
import {
  createQuiz,
  updateQuiz,
  getAllQuizzes,
  getQuizzesByClass,
  deleteQuiz,
  getQuizzesByTeacher,
  getQuizzesForStudent,
} from '../controllers/quiz.controller'
import { authorizeTypes, protect } from '../middlewares/auth.middleware'
import { upload } from '../middlewares/multer.middleware'

const router = Router()

router.post('/', upload.single('image'), resourceAccess("quizzes"), createQuiz)
router.put('/:quizId', upload.single('image'), resourceAccess("quizzes"), updateQuiz)
router.get('/', resourceAccess("quizzes"), getAllQuizzes)
router.get('/student/:studentId', protect, authorizeTypes('student'), resourceAccess("quizzes"), getQuizzesForStudent)
// Get quizzes by classId
router.get('/class/:classId', resourceAccess("quizzes"), getQuizzesByClass)
router.get('/teacher/:teacherId', resourceAccess("quizzes"), getQuizzesByTeacher)
router.delete('/:quizId', resourceAccess("quizzes"), deleteQuiz)

export default router
