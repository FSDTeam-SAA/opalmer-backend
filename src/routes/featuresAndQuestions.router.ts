import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import { Router } from "express";
import { featuresAndQuestionsController } from "../controllers/featuresAndQuestions.controller";

const router = Router();

router.post(
  "/create",
  resourceAccess("featuresAndQuestions"), featuresAndQuestionsController.crateFeaturesAndQuestions
);

router.get("/AppFeatures", resourceAccess("featuresAndQuestions"), featuresAndQuestionsController.getAppFeatures);
router.get("/FAQquestions", resourceAccess("featuresAndQuestions"), featuresAndQuestionsController.getFAQquestions);

router.put(
  "/update/:id",
  resourceAccess("featuresAndQuestions"), featuresAndQuestionsController.updateFeaturesAndQuestions
);

export const featuresAndQuestionsRouter = router;
