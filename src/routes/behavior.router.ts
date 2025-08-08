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

const behaviorRouter = router;
export default behaviorRouter;
