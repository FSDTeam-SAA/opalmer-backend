import { Router } from "express";
import behaviorController from "../controllers/behavior.controller";
import { authorizeTypes, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/create",
  protect,
  authorizeTypes("teacher"),
  behaviorController.createBehavior
);

router.get(
  "/:behaviorId",
  protect,
  authorizeTypes("teacher"),
  behaviorController.getSingleBehavior
);

router.get(
  "/",
  protect,
  authorizeTypes("teacher"),
  behaviorController.getAllBehaviors
);

const behaviorRouter = router;
export default behaviorRouter;
