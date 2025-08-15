import { Router } from 'express'
import { createAIQuestions } from '../controllers/quizQA.controller'

const router = Router()

router.post('/generate', createAIQuestions)

export default router
