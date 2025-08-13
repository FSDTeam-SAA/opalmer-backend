import { Router } from 'express'
import {
  createQuiz,
  updateQuiz,
  getAllQuizzes,
  getQuizzesByClass,
  deleteQuiz,
} from '../controllers/quiz.controller'
import { upload } from '../middlewares/multer.middleware'

const router = Router()

router.post('/', upload.single('image'), createQuiz)
router.put('/:quizId', upload.single('image'), updateQuiz)
router.get('/', getAllQuizzes)
// Get quizzes by classId
router.get('/class/:classId', getQuizzesByClass)
router.delete('/:quizId', deleteQuiz)

export default router
