import express from 'express'
import { getGroupWorkByClass } from '../controllers/groupWork.controller'

const router = express.Router()

// List group homework for a class. Supports ?archived=true|false to scope the list.
router.get('/class/:classId', getGroupWorkByClass)

export const groupWorkRouter = router
