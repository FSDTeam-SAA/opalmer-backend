import { inviteGuardian } from "../controllers/guardianInvitation.controller";
import { authorizeRoles } from "../middlewares/auth.middleware";
import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import express from 'express'
import {
  createParentsChild,
  deleteParentsChild,
  getChildrenByParentId,
  getParentsByChildId,
} from '../controllers/parentsChild.controller'
import { authorizeTypes, protect } from '../middlewares/auth.middleware'

const router = express.Router()
router.post("/invitations", protect, authorizeRoles("admin", "administrator"), inviteGuardian)

router.post('/', protect, authorizeTypes('parent'), resourceAccess("parent/child"), createParentsChild)
router.delete('/:id', protect, authorizeTypes('parent'), resourceAccess("parent/child"), deleteParentsChild)
router.get('/parent/:parentId', protect, authorizeTypes('parent'), resourceAccess("parent/child"), getChildrenByParentId)
router.get(
  '/child/:childId',
  protect,
  authorizeTypes('teacher', 'parent', 'student'),
  resourceAccess("parent/child"), getParentsByChildId
)

export default router
