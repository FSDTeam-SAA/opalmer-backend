import { Router } from "express";
import userRoutes from "../routes/user.routes";
import stuAssignToClassRoutes from "../routes/stuAssignToClass.routes";
import classRoutes from "../routes/class.routes";
import { aboutAndTermRouter } from "./aboutAndTerm.router";
import { featuresAndQuestionsRouter } from "./featuresAndQuestions.router";
import lessonRouter from "./lesson.router";
import behaviorRouter from "./behavior.router";
import schoolRouter from "./school.router";

const router = Router();

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
    path: "/student-assign-to-class",
    route: stuAssignToClassRoutes,
  },
  {
    path: "/classes",
    route: classRoutes,
  },
  {
    path: "/lessons",
    route: lessonRouter,
  },
  {
    path: "/behavior",
    route: behaviorRouter,
  },
  {
    path: "/school",
    route: schoolRouter,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
