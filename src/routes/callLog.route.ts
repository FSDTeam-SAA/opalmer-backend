import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import { Router } from 'express'
import { answerCallLog, createCallLog, endCallLog, getMyCallLogs } from '../controllers/callLog.controller'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

router.use(protect)

router.post('/', resourceAccess("call-logs"), createCallLog)
router.patch('/:id/answer', resourceAccess("call-logs"), answerCallLog)
router.patch('/:id/end', resourceAccess("call-logs"), endCallLog)
router.get('/my-logs', resourceAccess("call-logs"), getMyCallLogs)

export default router
