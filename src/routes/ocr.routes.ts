import { Router } from "express";
import { extractMarks } from "../controllers/ocr";
import { upload } from "../middlewares/multer.middleware";


const router = Router();

// POST /api/marks/extract
router.post("/extract", upload.single('document'),extractMarks);

const ocrRoutes = router
export default ocrRoutes;
