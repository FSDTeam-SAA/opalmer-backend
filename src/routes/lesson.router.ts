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

router.get(
  "/student-lessons",
  protect,
  authorizeTypes("student"),
  lessonController.getLessonsByStudent
);

router.get(
  "/",
  protect,
  authorizeTypes("student"),
  // authorizeTypes("teacher"),
  lessonController.getAllLessons
);

router.get(
  "/:lessonId",
  protect,
  // authorizeTypes("student"),
  authorizeTypes("teacher"),
  lessonController.getSingleLesson
);

router.put(
  "/update/:lessonId",
  protect,
  authorizeTypes("teacher"),
  upload.single("document"),
  lessonController.updateLesson
);

router.delete(
  "/delete/:lessonId",
  protect,
  authorizeTypes("teacher"),
  lessonController.deleteLesson
);

const lessonRouter = router;
export default lessonRouter;
