import { gradeDetail, reviewGrade, releaseGrade } from "../controllers/gradeReview.controller";
import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import { Router } from "express";
import gradingController, {
  getSingleStudentGrading,
} from "../controllers/grading.controller";
import { authorizeTypes, authorizeTeacherOrAdmin, protect } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();
router.get("/results/:resultId", protect, authorizeTypes("teacher"), gradeDetail);
router.patch("/results/:resultId/review", protect, authorizeTeacherOrAdmin, reviewGrade);
router.post("/results/:resultId/release", protect, authorizeTeacherOrAdmin, releaseGrade);

router.post(
  "/sessions",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("grading"), gradingController.createSession,
);

router.get(
  "/sessions",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("grading"), gradingController.listTeacherSessions,
);

router.get(
  "/student/sessions",
  protect,
  authorizeTypes("student"),
  resourceAccess("grading"), gradingController.listStudentSessions,
);

router.get(
  "/student/progress",
  protect,
  authorizeTypes("student"),
  resourceAccess("grading"), gradingController.getStudentProgress,
);

router.get(
  "/child-progress",
  protect,
  authorizeTypes("parent"),
  resourceAccess("grading"), gradingController.getChildProgress,
);

router.get(
  "/sessions/:sessionId/results",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("grading"), gradingController.getSessionResults,
);

router.post(
  "/question-image",
  protect,
  authorizeTypes("teacher"),
  upload.single("image"),
  resourceAccess("grading"), gradingController.uploadQuestionImage,
);

router.post(
  "/sessions/:sessionId/questions",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("grading"), gradingController.upsertQuestions,
);

router.get(
  "/sessions/:sessionId/questions",
  protect,
  authorizeTypes("teacher", "student"),
  resourceAccess("grading"), gradingController.getQuestions,
);

router.patch(
  "/sessions/:sessionId/publish",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("grading"), gradingController.publishSession,
);

router.patch(
  "/sessions/:sessionId",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("grading"), gradingController.updateSession,
);

router.get(
  "/sessions/:sessionId",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("grading"), gradingController.getTeacherSession,
);

router.post(
  "/sessions/:sessionId/start",
  protect,
  authorizeTypes("student"),
  resourceAccess("grading"), gradingController.startSession,
);

router.post(
  "/sessions/:sessionId/save-progress",
  protect,
  authorizeTypes("student"),
  resourceAccess("grading"), gradingController.saveProgress,
);

router.post(
  "/sessions/:sessionId/submit",
  protect,
  authorizeTypes("student"),
  resourceAccess("grading"), gradingController.submitSession,
);

router.get("/:studentId", resourceAccess("grading"), getSingleStudentGrading);

export default router;
