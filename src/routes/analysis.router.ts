import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import { Router } from "express";
import { getSingleStudentAnalysisController } from "../controllers/analysis.controller";

const router = Router();

router.get("/:classId/:studentId", resourceAccess("analysis"), getSingleStudentAnalysisController);

const analysisRouter = router;
export default analysisRouter;
