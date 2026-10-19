import { resourceAccess } from "../middlewares/resourceAccess.middleware";
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
  resourceAccess("academicDocument"), academicDocumentController.createAcademicDocument,
);

router.get(
  "/student-documents",
  protect,
  authorizeTypes("student"),
  resourceAccess("academicDocument"), academicDocumentController.getAcademicDocumentForStudent,
);

router.get(
  "/child-documents",
  protect,
  authorizeTypes("parent"),
  resourceAccess("academicDocument"), academicDocumentController.getAcademicDocumentForChild,
);

router.get(
  "/teacher-documents",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("academicDocument"), academicDocumentController.getAcademicDocumentForTeacher,
);

router.get(
  "/class-documents/:classId",
  resourceAccess("academicDocument"), academicDocumentController.getDocumentByClass,
);

router.get(
  "/student/:studentId",
  resourceAccess("academicDocument"), academicDocumentController.getAcademicDocumentByStudentId,
);

router.get(
  "/:academicDocumentId",
  resourceAccess("academicDocument"), academicDocumentController.getSingleAcademicDocument,
);

router.put(
  "/update/:id",
  protect,
  authorizeTypes("teacher"),
  upload.single("document"),
  resourceAccess("academicDocument"), academicDocumentController.updateAcademicDocument,
);

router.delete(
  "/delete/:id",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("academicDocument"), academicDocumentController.deleteAcademicDocument,
);

const academicDocumentRouter = router;

export default academicDocumentRouter;
