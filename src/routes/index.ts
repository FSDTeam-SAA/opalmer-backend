import { Router } from 'express'
import userRoutes from '../routes/user.routes'
import stuAssignToClassRoutes from '../routes/stuAssignToClass.routes'
import classRoutes from '../routes/class.routes'
import { aboutAndTermRouter } from "./aboutAndTerm.router";
import { featuresAndQuestionsRouter } from './featuresAndQuestions.router'

const router = Router()


const moduleRoutes = [
  {
    path: "/featuresAndQuestions",
    route: featuresAndQuestionsRouter,
  },
  {
    path: "/aboutAndTerm",
    route: aboutAndTermRouter,
  },
  {
    path: "/users",
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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
