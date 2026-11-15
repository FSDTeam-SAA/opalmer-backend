import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { User } from '../models/user.model'
import catchAsync from '../utils/catchAsync'
import httpStatus from 'http-status'
import sendResponse from '../utils/sendResponse'
import AppError from '../errors/AppError'

const dashboardScope = (req: Request) => {
  if (req.user?.role === 'admin') return {};
  if (!req.user?.schoolId) throw new AppError(403, 'A school is required to view school statistics');
  return { schoolId: new Types.ObjectId(String(req.user.schoolId)) };
};

export const getUserStats = catchAsync(async (req: Request, res: Response) => {
  // Count each type
  const scope = dashboardScope(req);
  const totalStudents = await User.countDocuments({ type: 'student', ...scope })
  const totalParents = await User.countDocuments({ type: 'parent', ...scope })
  const totalTeachers = await User.countDocuments({ type: 'teacher', ...scope })

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User stats fetched successfully',
    data: {
      totalStudents,
      totalParents,
      totalTeachers,
    },
  })
})

// student count by gender
export const getStudentGenderStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await User.aggregate([
      { $match: { type: 'student', ...dashboardScope(req) } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
    ])

    // Format result as an object for pie chart
    const genderStats: Record<string, number> = { male: 0, female: 0, other: 0 }
    result.forEach((item) => {
      genderStats[['male', 'female'].includes(item._id) ? item._id : 'other'] += item.count
    })

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Student gender stats fetched successfully',
      data: genderStats,
    })
  }
)

export const getAccountGrowth = catchAsync(async (req: Request, res: Response) => {
  const year = new Date().getUTCFullYear();
  const rows = await User.aggregate([
    { $match: { ...dashboardScope(req), type: { $in: ['student', 'teacher', 'parent'] }, created_at: { $gte: new Date(Date.UTC(year, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) } } },
    { $group: { _id: { $month: '$created_at' }, count: { $sum: 1 } } },
  ]);
  res.json({ success: true, data: { year, months: Array.from({ length: 12 }, (_, index) => ({ month: index + 1, count: rows.find(row => row._id === index + 1)?.count ?? 0 })) } });
});
