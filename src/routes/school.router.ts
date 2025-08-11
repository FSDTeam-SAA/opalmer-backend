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

const schoolRouter = router;
export default schoolRouter;
