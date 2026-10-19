import { getSubmission, saveSubmission, assignmentSubmissions, reviewSubmission } from "../controllers/submission.controller";
import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import { Router } from "express";

import { protect, authorizeTypes } from "../middlewares/auth.middleware";
import { archiveHomework, createHomework, deleteHomework, getHomeworkByClass, getHomeworkById, getHomeworkByUser, updateHomework } from "../controllers/homeWork.controller";
import { upload } from "../middlewares/multer.middleware";


const router = Router();
router.get('/:id/submission', protect, resourceAccess('homework'), getSubmission);
router.post('/:id/submission', protect, authorizeTypes('student'), upload.array('files', 10), resourceAccess('homework'), saveSubmission);
router.get('/:id/submissions', protect, authorizeTypes('teacher'), resourceAccess('homework'), assignmentSubmissions);
router.patch('/:id/submissions/:submissionId/review', protect, authorizeTypes('teacher'), resourceAccess('homework'), reviewSubmission);


// Create homework (teacher only)
router.post(
    "/create",
    protect,
    authorizeTypes("teacher"),
    upload.array("file"),
    resourceAccess("homework"), createHomework
);

// Get homework by class (teacher only)
router.get(
    "/class/:classId",
    resourceAccess("homework"), getHomeworkByClass
);

// Get homework by user (teacher or student)
router.get(
    "/user/:userId",
    
    resourceAccess("homework"), getHomeworkByUser
);

// Get single homework by ID (teacher only)
router.get(
    "/:id",

    resourceAccess("homework"), getHomeworkById
);

// Update homework (teacher only)
router.put(
    "/update/:id",
    protect,
    authorizeTypes("teacher"),
     upload.array("file"),
    resourceAccess("homework"), updateHomework
);

// Delete homework (teacher only)
router.delete(
    "/delete/:id",
    protect,
    authorizeTypes("teacher"),
    resourceAccess("homework"), deleteHomework
);

// Archive homework (teacher only)
router.patch(
    "/archive/:id",
    protect,
    authorizeTypes("teacher"),
    resourceAccess("homework"), archiveHomework
);

export const homeworkRouter = router;