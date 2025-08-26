import express from 'express'
import {
  getAllAdministrators,
  loginUser,
  registerUser,
} from '../controllers/user.controller'
import { upload } from '../middlewares/multer.middleware'
import { authorizeTypes, protect } from '../middlewares/auth.middleware'
const router = express.Router()

router.post('/register', upload.single('image'), registerUser)
router.post('/login', loginUser)

router.get(
  '/administrators',
  protect,
  authorizeTypes('administrator'),
  getAllAdministrators
)

export default router
