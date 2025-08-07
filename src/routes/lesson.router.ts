import { Router } from "express";
import lessonController from "../controllers/lesson.controller";
import { authorizeTypes, protect } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.post(
  "/create",
  protect,
  authorizeTypes("teacher"),
  upload.single("document"),
  lessonController.createLesson
);

router.get(
  "/teacher-lessons",
  protect,
  authorizeTypes("teacher"),
  lessonController.getLessonsByTeacher
);

const lessonRouter = router;
export default lessonRouter;
