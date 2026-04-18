import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { User } from '../models/user.model'
import { ParentsChild } from '../models/parentsChild.model'
import { QuizResult } from '../models/quizResult.model'
import AppError from '../errors/AppError'
import catchAsync from '../utils/catchAsync'
import sendResponse from '../utils/sendResponse'
import { count } from 'console'
import { count } from 'console'

/*****************
 * CREATE RELATION
 *****************/
export const createParentsChild = catchAsync(
  async (req: Request, res: Response) => {
    const { parentId } = req.body
    let { childId } = req.body

    if (!parentId || !childId) {
      throw new AppError(400, 'parentId and childId are required.')
    }

    // If childId is not a valid MongoDB ObjectId, attempt to find user by custom 'Id' string
    if (!mongoose.Types.ObjectId.isValid(childId)) {
      const student = await User.findOne({ Id: childId })
      if (!student) {
        throw new AppError(404, 'Student with the provided ID not found.')
      }
      childId = student._id
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
      'username email age gradeLevel avatar'
    )

    // Calculate progress and tagText for each child
    const enhancedChildren = await Promise.all(
      children.map(async (relation: any) => {
        let childData = relation.childId;
        if (childData && childData._id) {
          // Fetch completed quiz results for this child
          const quizResults = await QuizResult.find({ 
            studentId: childData._id, 
            'progress.status': 'completed' 
          });

          let averagePercentage = 0;
          let progressScore = 0;
          
          if (quizResults.length > 0) {
            const totalPercentage = quizResults.reduce((acc: number, curr: any) => acc + (curr.percentage || 0), 0);
            averagePercentage = totalPercentage / quizResults.length;
            progressScore = Number((averagePercentage / 100).toFixed(2));
          }

          let tagTextString = 'Needs Work';
          if (progressScore >= 0.9) {
            tagTextString = 'Excellent';
          } else if (progressScore >= 0.75) {
            tagTextString = 'Good';
          } else if (progressScore >= 0.5) {
            tagTextString = 'Fair';
          }

          const relationObj = relation.toObject();
          return {
            ...relationObj,
            childId: {
              ...relationObj.childId,
              progress: progressScore,
              tagText: tagTextString
            }
          };
        }
        return relation;
      })
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: { children: enhancedChildren, count: enhancedChildren.length },
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
