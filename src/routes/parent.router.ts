import { Router } from "express";
import parentController from "../controllers/parent.controller";

const router = Router();

router.post("/create", parentController.addParent);

const parentRouter = router;
export default parentRouter;
