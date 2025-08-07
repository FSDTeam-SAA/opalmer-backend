import { Router } from 'express'
import { featuresAndQuestionsRouter } from './featuresAndQuestions.router'
import userRoutes from '../routes/user.routes'
import stuAssignToClassRoutes from '../routes/stuAssignToClass.routes'
import classRoutes from '../routes/class.routes'
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
  {
    path: '/student-assign-to-class',
    route: stuAssignToClassRoutes,
  },
  {
    path: '/classes',
    route: classRoutes,
  },
]

moduleRoutes.forEach((route) => router.use(route.path, route.route))

export default router
