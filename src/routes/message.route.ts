import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import express from 'express'
import { upload } from '../middlewares/multer.middleware'
import { authorizeTypes, protect } from '../middlewares/auth.middleware'
import {
  createMessage,
  deleteMessage,
  getMessagesByRoom,
  updateMessage,
} from '../controllers/message.controllers'

const router = express.Router()

router.post(
  '/',
  protect,
  authorizeTypes('teacher', 'parent', 'student'),
  upload.array('files'),
  resourceAccess("message"), createMessage
)
router.get(
  '/:roomId',
  protect,
  authorizeTypes('teacher', 'parent', 'student'),
  resourceAccess("message"), getMessagesByRoom
)
router.patch(
  '/:messageId',
  protect,
  authorizeTypes('teacher', 'parent', 'student'),
  resourceAccess("message"), updateMessage
)
router.delete(
  '/:messageId',
  protect,
  authorizeTypes('teacher', 'parent', 'student'),
  resourceAccess("message"), deleteMessage
)


export default router
