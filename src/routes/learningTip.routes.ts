import express from 'express'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

import {
  createLearningTip,
  getLearningTipsByAdmin,
  getLearningTipsBySchool,
  getSingleLearningTip,
  updateLearningTip,
  deleteLearningTip,
} from '../controllers/learningTip.controller'

const router = express.Router()

// Create
router.post('/', protect, authorizeRoles('administrator'), createLearningTip)

// Get by adminId (paginated)
router.get('/by-admin', getLearningTipsByAdmin)

// Get by schoolId
router.get('/by-school', getLearningTipsBySchool)

// Single
router.get('/:id', getSingleLearningTip)

// Update
router.patch('/:id', updateLearningTip)

// Delete
router.delete('/:id', deleteLearningTip)

export default router
