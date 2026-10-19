import { Document, Types } from 'mongoose'

export interface IQuizAnswer {
  question: string
  selectedAnswer?: string // optional because default is ''
  isCorrect?: boolean | null // can be true, false, or null
}

export interface IQuizProgress {
  answeredCount?: number
  totalQuestions?: number
  remainingTime?: number
  status?: 'ongoing' | 'completed'
}

export interface IQuizResult extends Document {
  quizId: Types.ObjectId
  studentId: Types.ObjectId
  answers: IQuizAnswer[]
  progress: IQuizProgress
  score?: number
  percentage?: number
  startedAt?: Date
  deadline?: Date
  submittedAt?: Date
  gradeStatus?: 'pending_review' | 'reviewed' | 'released'
  feedback?: string
  questionSnapshot?: any[]
  reviewedBy?: Types.ObjectId
  releasedAt?: Date
  history?: any[]
  createdAt?: Date
  updatedAt?: Date
}
