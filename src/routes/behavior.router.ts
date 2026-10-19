import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import { Router } from "express";
import behaviorController from "../controllers/behavior.controller";
import { authorizeTypes, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/create",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("behavior"), behaviorController.createBehavior,
);

router.get(
  "/teacher-behaviors",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("behavior"), behaviorController.getBehaviorByTeacher,
);

router.get(
  "/student/:studentId",
  resourceAccess("behavior"), behaviorController.getBehaviorsByStudentId,
);

router.get(
  "/student-behaviors",
  protect,
  authorizeTypes("student", "parent"),
  resourceAccess("behavior"), behaviorController.getBehaviorByStudent
);

router.get(
  "/my-child/:studentId",
  protect,
  authorizeTypes("parent"),
  resourceAccess("behavior"), behaviorController.getBehaviorForMyChild,
);

router.get(
  "/",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("behavior"), behaviorController.getAllBehaviors,
);

router.get(
  "/:behaviorId",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("behavior"), behaviorController.getSingleBehavior,
);

router.put(
  "/update/:behaviorId",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("behavior"), behaviorController.updateBehavior,
);

router.delete(
  "/delete/:behaviorId",
  protect,
  authorizeTypes("teacher"),
  resourceAccess("behavior"), behaviorController.deleteBehavior,
);

const behaviorRouter = router;
export default behaviorRouter;
