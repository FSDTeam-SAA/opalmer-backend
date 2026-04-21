import { Router } from 'express'
import { createCallLog, endCallLog, getMyCallLogs } from '../controllers/callLog.controller'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

router.use(protect)

router.post('/', createCallLog)
router.patch('/:id/end', endCallLog)
router.get('/my-logs', getMyCallLogs)

export default router
