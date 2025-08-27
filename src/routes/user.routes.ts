import express from "express";
import {
  getAllAdministrators,
  getMySchoolAllStudents,
  loginUser,
  registerUser,
  updateUser
} from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import { authorizeRoles, authorizeTypes, protect } from "../middlewares/auth.middleware";
const router = express.Router();


router.post("/register", upload.single("image"), registerUser);
router.post("/login", loginUser);

router.get(
  "/administrators",
  protect,
  authorizeTypes("administrator"),
  getAllAdministrators
);


router.get(
  "/my-students",
  protect,
  authorizeRoles("administrator"),
  getMySchoolAllStudents
);


router.put('/:id', 
    // protect,
     updateUser)

export default router

