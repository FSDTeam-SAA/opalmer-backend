import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import { Router } from "express";
import {
  getStudentGenderStats,
  getUserStats,
  getAccountGrowth,
} from "../controllers/adminDashboard.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/stats", protect, resourceAccess("dashboard"), getUserStats);
router.get("/stats/student-gender", protect, resourceAccess("dashboard"), getStudentGenderStats);
router.get("/stats/growth", protect, resourceAccess("dashboard"), getAccountGrowth);

export default router;
