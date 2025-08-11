import express from 'express'
import { upload } from '../middlewares/multer.middleware'
import {
  createMessage,
  deleteMessage,
  getMessagesByRoom,
  updateMessage,
} from '../controllers/message.controllers'

const router = express.Router()

router.post('/', upload.array('files'), createMessage)
router.get('/:roomId', getMessagesByRoom)
router.patch('/:messageId', updateMessage)
router.delete('/:messageId', deleteMessage)


export default router
