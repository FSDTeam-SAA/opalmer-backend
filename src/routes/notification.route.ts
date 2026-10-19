import { notificationDestination } from "../controllers/notificationDestination.controller";
import { protect } from "../middlewares/auth.middleware";
import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import express from 'express'
import {
  getUserNotifications,
  markAllAsRead,
  markOneAsRead,
} from '../controllers/notification.controller'

const router = express.Router()
router.get("/:notificationId/destination", protect, notificationDestination)

router.get('/:userId', resourceAccess("notifications"), getUserNotifications)
router.patch('/read/:userId', resourceAccess("notifications"), markAllAsRead)
// Single notification mark-read. Route shape is distinct from
// /read/:userId (literal "read" as first segment) so order-independent.
router.patch('/:notificationId/read', resourceAccess("notifications"), markOneAsRead)

export default router
