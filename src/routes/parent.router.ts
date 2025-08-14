import { Router } from "express";
import parentController from "../controllers/parent.controller";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.post("/create", upload.single("avatar"), parentController.addParent);

const parentRouter = router;
export default parentRouter;
