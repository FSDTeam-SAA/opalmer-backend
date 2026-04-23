import express from "express";
import {
  changePassword,
  getAllAdministrators,
  getContacts,
  getMe,
  getMySchoolAllStudents,
  getMySchoolAllTeachers,
  getSingleAdministratorAllDetails,
  getSingleStudentAllDetails,
  getStudentCountByGrade,
  getStudentsByGrade,
  loginUser,
  logoutUser,
  registerUser,
  searchStudentById,
  toggleTwoFactorAuth,
  updateUser,
  verifyOTP,
} from "../controllers/user.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
const router = express.Router();

router.post("/register", upload.single("image"), registerUser);
router.post("/login", loginUser);

// Current user & password management (token-scoped).
router.get("/me", protect, getMe);
router.post("/logout", protect, logoutUser);
router.post("/change-password", protect, changePassword);

router.get("/administrators", getAllAdministrators);

router.get("/search-student", searchStudentById);

router.get(
  "/my-students",
  protect,
  authorizeRoles("administrator", "admin"),
  getMySchoolAllStudents,
);

router.get(
  "/my-teachers",
  protect,
  authorizeRoles("administrator", "admin"),
  getMySchoolAllTeachers,
);

router.put("/toggle", protect, toggleTwoFactorAuth);

router.post("/verify-otp", protect, verifyOTP);

router.get("/students/grade/:grade", getStudentsByGrade);
router.get("/students/count/:grade", getStudentCountByGrade);
router.get("/contacts", protect, getContacts);

router.get("/:id", getSingleStudentAllDetails);

// Authenticated profile edit. Controller further enforces owner-or-admin
// authorization using the token-bound user.
router.put("/:id", protect, upload.single("image"), updateUser);
router.get("/administrators/:id", getSingleAdministratorAllDetails);

export default router;
