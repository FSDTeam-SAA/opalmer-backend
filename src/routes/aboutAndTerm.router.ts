import { Router } from "express";
import aboutAndTermController from "../controllers/aboutAndTermController";

const router = Router();

router.post("/create", aboutAndTermController.createAboutAndTerm);

router.get("/about", aboutAndTermController.getAbout);
router.get("/terms", aboutAndTermController.getTerms);

export const aboutAndTermRouter = router;
