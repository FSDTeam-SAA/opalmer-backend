import { Request, Response } from 'express'
import { ParentsChild } from '../models/parentsChild.model'
import AppError from '../errors/AppError'
import catchAsync from '../utils/catchAsync'
import sendResponse from '../utils/sendResponse'
import { count } from 'console'

/*****************
 * CREATE RELATION
 *****************/
export const createParentsChild = catchAsync(
  async (req: Request, res: Response) => {
    const { parentId, childId } = req.body

    if (!parentId || !childId) {
      throw new AppError(400, 'parentId and childId are required.')
    }

    // Prevent duplicate relation
    const existing = await ParentsChild.findOne({ parentId, childId })
    if (existing) {
      throw new AppError(409, 'Relation already exists.')
    }

    const relation = await ParentsChild.create({ parentId, childId })

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Parent-Child relation created successfully',
      data: relation,
    })
  }
)

/*****************
 * DELETE RELATION
 *****************/
export const deleteParentsChild = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params

    const relation = await ParentsChild.findByIdAndDelete(id)
    if (!relation) {
      throw new AppError(404, 'Relation not found.')
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Relation deleted successfully',
    })
  }
)

/***********************
 * GET CHILDREN BY PARENT
 ***********************/
export const getChildrenByParentId = catchAsync(
  async (req: Request, res: Response) => {
    const { parentId } = req.params

    const children = await ParentsChild.find({ parentId }).populate(
      'childId',
      'username email age avatar'
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: { children, count: children.length },
    })
  }
)

/**********************
 * GET PARENTS BY CHILD
 **********************/
export const getParentsByChildId = catchAsync(
  async (req: Request, res: Response) => {
    const { childId } = req.params

    const parents = await ParentsChild.find({ childId }).populate(
      'parentId',
      'username email role'
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: { parents, count: parents.length },
    })
  }
)
