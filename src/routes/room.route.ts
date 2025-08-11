import express from 'express'
import {
  createRoom,
  editRoom,
  getRoomsByUserId,
} from '../controllers/room.controller'
import { upload } from '../middlewares/multer.middleware' 

const router = express.Router()

router.post('/', upload.single('avatar'), createRoom)
router.patch('/:id', upload.single('avatar'), editRoom)
router.get('/user/:userId', getRoomsByUserId)

export default router
