import express from 'express'
import {
  createGroup,
  getGroupById,
  deleteGroupById,
} from '../controllers/group.controller' // adjust path as needed
import { authorizeTypes, protect } from '../middlewares/auth.middleware'

const router = express.Router()

// Create a group
router.post('/groups',protect,
  authorizeTypes("teacher"), createGroup)

// Get group by ID
router.get('/groups/:id', getGroupById)

// Delete group by ID
router.delete('/groups/:id',protect,
  authorizeTypes("teacher"), deleteGroupById)

  const groupRouter=router

export default groupRouter
