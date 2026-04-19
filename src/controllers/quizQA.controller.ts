import { Request, Response } from 'express'
import httpStatus from 'http-status'
import { QuizQA } from '../models/quizQA.model'
import { generateQuizQuestions } from '../services/quizAI.service'
import catchAsync from '../utils/catchAsync'
import AppError from '../errors/AppError'
import sendResponse from '../utils/sendResponse'

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

/****************************
 * GET QUESTIONS BY QUIZ ID *
 ****************************/
export const getQuizQAByQuizId = catchAsync(
  async (req: Request, res: Response) => {
    const { quizId } = req.params
    if (!quizId) {
      throw new AppError(httpStatus.BAD_REQUEST, 'quizId is required')
    }

    const qa = await QuizQA.findOne({ quizId })
    if (!qa) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'No questions found for this quiz'
      )
    }

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Quiz questions fetched successfully',
      data: qa,
    })
  }
)
