import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import express from "express";
import {
  changeAttendanceStatus,
  createClassAttendance,
  getAllAttendance,
  getClassAttendanceStats,
  getSingleStudentSpecificSubjectAttendance,
  getStudentAttendance,
  getStudentAttendanceStats,
} from "../controllers/attendance.controller";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

// Create attendance for all students in a class
router.post("/class", resourceAccess("attendances"), createClassAttendance);

//  * CHANGE ATTENDANCE STATUS *
router.patch("/class/:id", resourceAccess("attendances"), changeAttendanceStatus);

//  * GET ALL ATTENDANCE *
router.get("/class", protect, resourceAccess("attendances"), getAllAttendance);

// * GET ALL ATTENDANCE FOR A STUDENT *
router.get("/student", protect, resourceAccess("attendances"), getStudentAttendance);

// * GET CLASS ATTENDANCE STATS *
router.get("/class/:classId/stats", resourceAccess("attendances"), getClassAttendanceStats);

// * GET STUDENT ATTENDANCE STATS *
router.get("/student/:studentId/stats", protect, resourceAccess("attendances"), getStudentAttendanceStats);

router.get(
  "/:studentId/:classId",
  resourceAccess("attendances"), getSingleStudentSpecificSubjectAttendance,
);

export default router;
