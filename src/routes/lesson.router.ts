import { resourceAccess } from "../middlewares/resourceAccess.middleware";
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
  resourceAccess("lessons"), lessonController.createLesson
);

router.get(
  "/teacher-lessons",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("lessons"), lessonController.getLessonsByTeacher
);

router.get(
  "/student-lessons",
  protect,
  authorizeTypes("student"),
  resourceAccess("lessons"), lessonController.getLessonsByStudent
);

router.get(
  "/",
  protect,
  authorizeTypes("student"),
  // authorizeTypes("teacher"),
  resourceAccess("lessons"), lessonController.getAllLessons
);

router.get(
  "/archived",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("lessons"), lessonController.getArchivedLessons
)


router.get(
  "/:lessonId",
  protect,
  // authorizeTypes("student"),
  authorizeTypes("teacher"),
  resourceAccess("lessons"), lessonController.getSingleLesson
);

router.get(
  "/class/:classId",
  protect,
  authorizeTypes("teacher", "parent"),
  resourceAccess("lessons"), lessonController.getLessonsByClass
)


router.get(
  "/student/:studentId",
  resourceAccess("lessons"), lessonController.getLessonsByStudentId
);

router.put(
  "/update/:lessonId",
  protect,
  authorizeTypes("teacher"),
  upload.single("document"),
  resourceAccess("lessons"), lessonController.updateLesson
);

router.delete(
  "/delete/:lessonId",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("lessons"), lessonController.deleteLesson
);


router.put(
  "/update-status/:lessonId",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("lessons"), lessonController.updateLessonStatus
)

const lessonRouter = router;
export default lessonRouter;
