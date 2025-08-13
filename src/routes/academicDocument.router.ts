import { Router } from "express";
import academicDocumentController from "../controllers/academicDocument.controller";
import { authorizeTypes, protect } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.post(
  "/create",
  protect,
  authorizeTypes("teacher"),
  upload.single("document"),
  academicDocumentController.createAcademicDocument
);

router.get(
  "/student-documents",
  //   protect,
  //   authorizeTypes("teacher"),
  academicDocumentController.getAcademicDocumentForStudent
);

router.get(
  "/teacher-documents",
  protect,
  authorizeTypes("teacher"),
  academicDocumentController.getAcademicDocumentForTeacher
);

const academicDocumentRouter = router;

export default academicDocumentRouter;
