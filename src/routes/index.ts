import { Router } from 'express'
import userRoutes from '../routes/user.routes'
import stuAssignToClassRoutes from '../routes/stuAssignToClass.routes'
import classRoutes from '../routes/class.routes'
import { aboutAndTermRouter } from './aboutAndTerm.router'
import { featuresAndQuestionsRouter } from './featuresAndQuestions.router'
import lessonRouter from './lesson.router'
import attendanceRoutes from './attendance.routes'
import behaviorRouter from './behavior.router'
import schoolRouter from './school.router'
import learningTipsRouters from './learningTip.routes'

const router = Router()

const moduleRoutes = [
  {
    path: '/featuresAndQuestions',
    route: featuresAndQuestionsRouter,
  },
  {
    path: '/aboutAndTerm',
    route: aboutAndTermRouter,
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
  {
    path: '/lessons',
    route: lessonRouter,
  },
  {
    path: '/attendances',
    route: attendanceRoutes,
  },
  {
    path: '/behavior',
    route: behaviorRouter,
  },
  {
    path: '/school',
    route: schoolRouter,
  },
  {
    path: '/learning-tips',
    route: learningTipsRouters,
  },
]

moduleRoutes.forEach((route) => router.use(route.path, route.route))

export default router
