import { Router } from "express";
import { featuresAndQuestionsRouter } from "./featuresAndQuestions.router";

const router = Router();

const moduleRoutes = [
  {
    path: "/featuresAndQuestions",
    route: featuresAndQuestionsRouter,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
