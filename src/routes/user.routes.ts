import express from 'express'
import {
  getAllAdministrators,
  loginUser,
  registerUser,
  updateUser,
} from '../controllers/user.controller'
import { upload } from '../middlewares/multer.middleware'
import { authorizeRoles, protect } from '../middlewares/auth.middleware'
const router = express.Router()

router.post('/register', upload.single('image'), registerUser)
router.post('/login', loginUser)

router.get(
  '/administrators',
  protect,
  authorizeRoles('administrator'),
  getAllAdministrators
)

router.put(
  '/:id',
  protect,
  updateUser
)

export default router
