import { Router } from "express";
import lessonController from "../controllers/lesson.controller";
import { authorizeTypes, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/create",
  protect,
  authorizeTypes("teacher"),
  lessonController.createLesson
);

const lessonRouter = router;
export default lessonRouter;
