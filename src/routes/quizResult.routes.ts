import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import { Router } from 'express'
import { protect, authorizeTypes } from '../middlewares/auth.middleware'
import {
  startQuiz,
  saveQuizProgress,
  submitQuiz,
  getQuizAnswersByStudent,
} from '../controllers/quizResult.controller'

const router = Router()

router.post('/start', protect,
  authorizeTypes('student'),
   resourceAccess("test/quizzes"), startQuiz)
router.post('/save-progress', protect, resourceAccess("test/quizzes"), saveQuizProgress)
router.post('/submit', protect, resourceAccess("test/quizzes"), submitQuiz)
router.get('/answers/:studentId', protect, resourceAccess("test/quizzes"), getQuizAnswersByStudent)
export default router
