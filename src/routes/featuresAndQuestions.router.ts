import { Router } from "express";
import { featuresAndQuestionsController } from "../controllers/featuresAndQuestions.controller";

const router = Router();

router.post(
  "/create",
  featuresAndQuestionsController.crateFeaturesAndQuestions
);

export const featuresAndQuestionsRouter = router;
