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
import messageRouter from './message.route'
import notificationRouter from './notification.route'
import roomsRouter from './room.route'
import academicDocumentRouter from './academicDocument.router'
import { homeworkRouter } from './homeWork.routes'
import { groupWorkRouter } from './groupWork.routes'
import parantChildRouter from './parentsChild.route'
import quizzesRouter from './quiz.routes'
import quizzesQARouter from './quizQA.routes'
import quizzesTestRouter from '../routes/quizResult.routes'
import dashboardRouter from './adminDashboard.router'

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
  {
    path: '/message',
    route: messageRouter,
  },
  {
    path: '/notifications',
    route: notificationRouter,
  },
  {
    path: '/rooms',
    route: roomsRouter,
  },

  {
    path: '/academicDocument',
    route: academicDocumentRouter,
  },
  {
    path: '/homework',
    route: homeworkRouter,
  },
  {
    path: '/group-work',
    route: groupWorkRouter,
  },
  {
    path: '/parent/child',
    route: parantChildRouter,
  },
  {
    path: '/quizzes',
    route: quizzesRouter,
  },
  {
    path: '/quiz/qa',
    route: quizzesQARouter,
  },
  {
    path: '/test/quizzes',
    route: quizzesTestRouter,
  },
  {
    path: '/dashboard',
    route: dashboardRouter,
  },
]

moduleRoutes.forEach((route) => router.use(route.path, route.route))

export default router
