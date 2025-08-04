import express from 'express'
import { registerUser } from '../controllers/user.controller'
import { upload } from '../middlewares/multer.middleware'
const router = express.Router()



router.post('/register', upload.single('image'), registerUser)

export default router
