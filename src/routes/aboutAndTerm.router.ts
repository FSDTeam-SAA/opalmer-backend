import { Router } from "express";
import aboutAndTermController from "../controllers/aboutAndTermController";

const router = Router();


router.post("/create", aboutAndTermController.createAboutAndTerm)

export const aboutAndTermRouter = router;
