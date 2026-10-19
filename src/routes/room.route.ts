import { resourceAccess } from "../middlewares/resourceAccess.middleware";
import express from 'express'
import {
  createRoom,
  editRoom,
  getRoomsByUserId,
} from '../controllers/room.controller'
import { upload } from '../middlewares/multer.middleware'
import { authorizeTypes, protect } from '../middlewares/auth.middleware'

const router = express.Router()

router.post('/', protect, upload.single('avatar'), resourceAccess("rooms"), createRoom)
router.patch(
  '/:id',
  protect,
  authorizeTypes('teacher', 'parent', 'student'),
  upload.single('avatar'),
  resourceAccess("rooms"), editRoom,
)
router.get(
  '/my-rooms',
  protect,
  authorizeTypes('teacher', 'parent', 'student'),
  resourceAccess("rooms"), getRoomsByUserId,
)

export default router
