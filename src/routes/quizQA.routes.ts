import { rateLimit } from "../middlewares/rateLimit.middleware";
import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import { Router } from 'express'
import {
  createAIQuestions,
  getQuizQAByQuizId,
} from '../controllers/quizQA.controller'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

router.post('/generate', rateLimit(5), resourceAccess("quiz/qa"), createAIQuestions)
router.get('/:quizId', protect, resourceAccess("quiz/qa"), getQuizQAByQuizId)

export default router
