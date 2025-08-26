import express from "express";
import { loginUser, registerUser } from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
const router = express.Router();

router.post("/register", upload.single("image"), registerUser);
router.post("/login", loginUser);

export default router;
