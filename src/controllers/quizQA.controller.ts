import { Request, Response } from 'express'
import { QuizQA } from '../models/quizQA.model'
import { generateQuizQuestions } from '../services/quizAI.service'
import catchAsync from '../utils/catchAsync'
import AppError from '../errors/AppError'

/************************
 * CREATE AI QUIESTIONS *
 ************************/
export const createAIQuestions = catchAsync(
  async (req: Request, res: Response) => {
    const { quizId, topic } = req.body

    if (!quizId || !topic)
      throw new AppError(400, 'quizId and topic are required')

    const questions = await generateQuizQuestions(topic, 10)
    if (!questions.length)
      throw new AppError(500, 'AI failed to generate questions')

    const savedQA = await QuizQA.create({
      quizId,
      questions,
    })

    res.status(201).json({
      success: true,
      message: 'Questions generated and saved successfully',
      data: savedQA,
    })
  }
)
