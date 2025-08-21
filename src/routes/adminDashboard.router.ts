import { Router } from 'express'
import { getUserStats } from '../controllers/adminDashboard.controller'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

router.get('/stats', protect, getUserStats)

export default router
