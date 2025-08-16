import express from 'express'
import {
  createParentsChild,
  deleteParentsChild,
  getChildrenByParentId,
  getParentsByChildId,
} from '../controllers/parentsChild.controller'

const router = express.Router()

router.post('/', createParentsChild)
router.delete('/:id', deleteParentsChild)
router.get('/parent/:parentId', getChildrenByParentId)
router.get('/child/:childId', getParentsByChildId)

export default router
