import express from "express";
import {
  assignTeacherToSchool,
  changePassword,
  getAllAdministrators,
  getMe,
  getMySchoolAllStudents,
  getMySchoolAllTeachers,
  getStudentCountByGrade,
  getStudentsByGrade,
  loginUser,
  registerUser,
  searchStudentById,
  updateUser,
} from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";
const router = express.Router();

router.post("/register", upload.single("image"), registerUser);
router.post("/login", loginUser);

// Current user & password management (token-scoped).
router.get("/me", protect, getMe);
router.post("/change-password", protect, changePassword);

router.get("/administrators", getAllAdministrators);

router.get("/search-student", searchStudentById);

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

// Authenticated profile edit. Controller further enforces owner-or-admin
// authorization using the token-bound user.
router.put("/:id", protect, upload.single("image"), updateUser);

export default router;
