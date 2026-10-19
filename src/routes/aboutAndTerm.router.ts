import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import { Router } from "express";
import aboutAndTermController from "../controllers/aboutAndTermController";

const router = Router();

router.post("/create", resourceAccess("aboutAndTerm"), aboutAndTermController.createAboutAndTerm);

router.get("/about", resourceAccess("aboutAndTerm"), aboutAndTermController.getAbout);
router.get("/terms", resourceAccess("aboutAndTerm"), aboutAndTermController.getTerms);

router.put("/update/:id", resourceAccess("aboutAndTerm"), aboutAndTermController.updateAboutAndTerm);

export const aboutAndTermRouter = router;
