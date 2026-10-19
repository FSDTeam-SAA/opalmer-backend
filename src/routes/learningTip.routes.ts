import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import express from 'express'
import {
  protect,
  authorizeRoles,
  authorizeTypes,
} from '../middlewares/auth.middleware'

import {
  createLearningTip,
  getLearningTipsByAdmin,
  getLearningTipsBySchool,
  getLearningTipsByParent,
  getSingleLearningTip,
  updateLearningTip,
  deleteLearningTip,
} from '../controllers/learningTip.controller'

const router = express.Router()

// Create
router.post('/',
    // protect, authorizeRoles('administrator'),
resourceAccess("learning-tips"), createLearningTip)

// Get by adminId (paginated)
router.get('/by-admin', resourceAccess("learning-tips"), getLearningTipsByAdmin)

// Get by schoolId
router.get('/by-school', resourceAccess("learning-tips"), getLearningTipsBySchool)

// Get tips aggregated across all schools for the authenticated parent's children
router.get(
  '/by-parent/me',
  protect,
  authorizeTypes('parent'),
  resourceAccess("learning-tips"), getLearningTipsByParent
)

// Single
router.get('/:id', resourceAccess("learning-tips"), getSingleLearningTip)

// Update
router.patch('/:id', resourceAccess("learning-tips"), updateLearningTip)

// Delete
router.delete('/:id', resourceAccess("learning-tips"), deleteLearningTip)

export default router
