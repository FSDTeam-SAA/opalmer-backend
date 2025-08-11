import { Router } from "express";
import schoolController from "../controllers/school.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/create",
  protect,
  authorizeRoles("administrator"),
  schoolController.createSchool
);

router.get(
  "/my-school",
  protect,
  authorizeRoles("administrator"),
  schoolController.getMySchool
);

router.get("/", schoolController.getAllSchools);
router.get("/:id", schoolController.getSingleSchool);

router.put(
  "/update/:id",
  protect,
  authorizeRoles("administrator"),
  schoolController.updateSchool
);

const schoolRouter = router;
export default schoolRouter;
