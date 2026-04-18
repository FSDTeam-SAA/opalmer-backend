import express from "express";
import {
  getAllAdministrators,
  getMySchoolAllStudents,
  getMySchoolAllTeachers,
  loginUser,
  registerUser,
  searchStudentById,
  updateUser,
} from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import {
  authorizeRoles,
  authorizeTypes,
  protect,
} from "../middlewares/auth.middleware";
const router = express.Router();

router.post('/register', upload.single('image'), registerUser)
router.post('/login', loginUser)

router.get(
  "/administrators",
  getAllAdministrators
);

router.get(
  "/search-student",
  searchStudentById
);

router.get(
  "/my-students",
  protect,
  authorizeRoles("administrator"),
  getMySchoolAllStudents
);

router.get(
  "/my-teachers",
  protect,
  authorizeRoles("administrator"),
  getMySchoolAllTeachers
);

router.put(
  "/:id",
  // protect,
  upload.single("image"),
  updateUser
);

export default router;
