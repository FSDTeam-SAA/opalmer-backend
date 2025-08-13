import { Request, Response } from 'express'
import { Quiz } from '../models/quiz.model'
import catchAsync from '../utils/catchAsync'
import AppError from '../errors/AppError'
import { uploadToCloudinary } from '../utils/cloudinary'

// Create a new quiz
export const createQuiz = catchAsync(async (req: Request, res: Response) => {
  const { teacherId, classId, title, description, time } = req.body

  let imageUrl = ''
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path)
    if (result) imageUrl = result.secure_url
  }

  const newQuiz = await Quiz.create({
    teacherId,
    classId,
    title,
    description,
    image: imageUrl,
    time,
  })

  res.status(201).json({
    success: true,
    message: 'Quiz created successfully',
    data: newQuiz,
  })
})

// Edit/update a quiz
export const updateQuiz = catchAsync(async (req: Request, res: Response) => {
  const { quizId } = req.params
  const updates: any = { ...req.body }

  // Handle image upload if file exists
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path)
    if (result) updates.image = result.secure_url
  }

  const updatedQuiz = await Quiz.findByIdAndUpdate(quizId, updates, {
    new: true,
  })

  if (!updatedQuiz) throw new AppError(404, 'Quiz not found')

  res.status(200).json({
    success: true,
    message: 'Quiz updated successfully',
    data: updatedQuiz,
  })
})

// Get all quizzes
export const getAllQuizzes = catchAsync(
  async (_req: Request, res: Response) => {
    const quizzes = await Quiz.find().sort({ created_at: -1 })
    res.status(200).json({
      success: true,
      data: quizzes,
    })
  }
)

// Get quizzes by classId
export const getQuizzesByClass = catchAsync(
  async (req: Request, res: Response) => {
    const { classId } = req.params
    const quizzes = await Quiz.find({ classId }).sort({ created_at: -1 })

    res.status(200).json({
      success: true,
      data: quizzes,
    })
  }
)

// Delete a quiz
export const deleteQuiz = catchAsync(async (req: Request, res: Response) => {
  const { quizId } = req.params
  const deletedQuiz = await Quiz.findByIdAndDelete(quizId)

  if (!deletedQuiz) throw new AppError(404, 'Quiz not found')

  res.status(200).json({
    success: true,
    message: 'Quiz deleted successfully',
  })
})
