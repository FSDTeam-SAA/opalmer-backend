import { Router } from 'express'
import { featuresAndQuestionsRouter } from './featuresAndQuestions.router'
import userRoutes from '../routes/user.routes'
const router = Router()

const moduleRoutes = [
  {
    path: '/featuresAndQuestions',
    route: featuresAndQuestionsRouter,
  },
  {
    path: '/users',
    route: userRoutes,
  },
]

moduleRoutes.forEach((route) => router.use(route.path, route.route))

export default router
