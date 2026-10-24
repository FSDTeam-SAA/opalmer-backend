import { Router } from 'express';
import { authorizeTypes } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/multer.middleware';
import { createAnnouncement, createResource, listAnnouncements, listHomeworkHelp, listResources, retryAnnouncement, teacherActivity } from '../controllers/teacherTools.controller';

const router = Router();
// Parent/student reads enforce assignment audience and enrollment in the controller.
router.get('/homework/:homeworkId/help', listHomeworkHelp);
router.use(authorizeTypes('teacher'));
router.get('/activity', teacherActivity);
router.get('/resources', listResources);
router.post('/resources', upload.single('file'), createResource);
router.get('/announcements', listAnnouncements);
router.post('/announcements', createAnnouncement);
router.post('/announcements/:id/retry', retryAnnouncement);
export default router;
