import { forgotPassword, resetPassword } from "../controllers/passwordReset.controller";
import { rateLimit } from "../middlewares/rateLimit.middleware";
import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import express from "express";
import { deleteAdministrator } from "../controllers/administrator.controller";
import { deleteSchoolUser } from "../controllers/schoolUser.controller";
import {
  changePassword,
  createAdministrator,
  createSchoolParent,
  createSchoolStudent,
  createSchoolTeacher,
  getAllAdministrators,
  getAllParents,
  getAllStudent,
  getContacts,
  getMe,
  getMySchoolAllParents,
  getMySchoolAllStudents,
  getMySchoolAllTeachers,
  getSingleAdministratorAllDetails,
  getSingleStudentAllDetails,
  getSingleTeacherDetails,
  getMySchoolStudentsByGrade,
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
import { authorizeRoles, protect, protectChallenge } from "../middlewares/auth.middleware";
import { upload, profileUpload } from "../middlewares/multer.middleware";
const router = express.Router();

router.post("/register", upload.single("image"), resourceAccess("users"), registerUser);
router.post("/login", rateLimit(10, 15 * 60_000), resourceAccess("users"), loginUser);

router.post("/forgot-password", rateLimit(5, 15 * 60_000), forgotPassword);
router.post("/reset-password", rateLimit(10, 15 * 60_000), resetPassword);

// Current user & password management (token-scoped).
router.get("/me", protect, resourceAccess("users"), getMe);
router.post("/logout", protect, resourceAccess("users"), logoutUser);
router.post("/change-password", protect, resourceAccess("users"), changePassword);

router.get("/administrators", resourceAccess("users"), getAllAdministrators);
router.delete("/administrators/:id", protect, authorizeRoles("admin"), resourceAccess("users"), deleteAdministrator);
router.delete("/school/:type/:id", protect, authorizeRoles("admin", "administrator"), resourceAccess("users"), deleteSchoolUser);
router.post(
  "/administrators",
  protect,
  authorizeRoles("admin"),
  upload.single("image"),
  resourceAccess("users"), createAdministrator,
);

router.get("/search-student", resourceAccess("users"), searchStudentById);

router.get(
  "/my-students",
  protect,
  authorizeRoles("administrator", "admin"),
  resourceAccess("users"), getMySchoolAllStudents,
);

router.get(
  "/my-teachers",
  protect,
  authorizeRoles("administrator", "admin"),
  resourceAccess("users"), getMySchoolAllTeachers,
);

router.get(
  "/my-parents",
  protect,
  authorizeRoles("administrator", "admin"),
  resourceAccess("users"), getMySchoolAllParents,
);

router.post(
  "/school/students",
  protect,
  authorizeRoles("administrator"),
  upload.single("image"),
  resourceAccess("users"), createSchoolStudent,
);

router.post(
  "/school/teachers",
  protect,
  authorizeRoles("administrator"),
  upload.single("image"),
  resourceAccess("users"), createSchoolTeacher,
);

router.post(
  "/school/parents",
  protect,
  authorizeRoles("administrator"),
  upload.single("image"),
  resourceAccess("users"), createSchoolParent,
);

router.put("/toggle", protect, resourceAccess("users"), toggleTwoFactorAuth);

router.post("/verify-otp", rateLimit(10, 15 * 60_000), protectChallenge, resourceAccess("users"), verifyOTP);

router.get("/my-school/students/grade/:grade", protect, resourceAccess("users"), getMySchoolStudentsByGrade);
router.get("/students/grade/:grade", resourceAccess("users"), getStudentsByGrade);
router.get("/students/count/:grade", resourceAccess("users"), getStudentCountByGrade);
router.get("/contacts", protect, resourceAccess("users"), getContacts);

router.get("/students", resourceAccess("users"), getAllStudent);
router.get("/parents", resourceAccess("users"), getAllParents);

router.get("/:id", resourceAccess("users"), getSingleStudentAllDetails);

// Authenticated profile edit. Controller further enforces owner-or-admin
// authorization using the token-bound user.
router.put("/:id", protect, profileUpload.single("image"), resourceAccess("users"), updateUser);
router.get("/administrators/:id", resourceAccess("users"), getSingleAdministratorAllDetails);
router.get("/teachers/:id", resourceAccess("users"), getSingleTeacherDetails);

export default router;
