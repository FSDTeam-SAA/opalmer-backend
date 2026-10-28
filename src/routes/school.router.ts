import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import { Router } from "express";
import schoolController from "../controllers/school.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { schoolDataImport, listDistricts } from '../controllers/schoolImport.controller';

const router = Router();
router.post('/import', protect, authorizeRoles('admin'), schoolDataImport);
router.get('/districts', protect, authorizeRoles('admin', 'administrator'), listDistricts);

router.post(
  "/create",
  protect,
  authorizeRoles("admin"),
  upload.single("logo"),
  resourceAccess("school"), schoolController.createSchool
);

router.get(
  "/my-school",
  protect,
  authorizeRoles("administrator"),
  resourceAccess("school"), schoolController.getMySchool
);

router.get("/", resourceAccess("school"), schoolController.getAllSchools);
router.get("/:id", resourceAccess("school"), schoolController.getSingleSchool);

router.put(
  "/update/:id",
  protect,
  authorizeRoles("admin", "administrator"),
  upload.single("logo"),
  resourceAccess("school"), schoolController.updateSchool
);

router.delete(
  "/delete/:id",
  protect,
  authorizeRoles("admin"),
  resourceAccess("school"), schoolController.deleteSchool
);

const schoolRouter = router;
export default schoolRouter;
