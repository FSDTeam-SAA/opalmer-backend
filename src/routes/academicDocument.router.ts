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

const academicDocumentRouter = router;

export default academicDocumentRouter;
