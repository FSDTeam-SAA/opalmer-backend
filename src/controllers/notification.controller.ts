import { Request, Response } from 'express'
import { Notification } from '../models/notification.model'
import catchAsync from '../utils/catchAsync'
import httpStatus from 'http-status'
import AppError from '../errors/AppError'
import { visibleStudentIds, selectedStudentIds } from '../services/access.service'

/*********************************
 * GET ALL NOTIFICATIONS BY USER *
 *********************************/
export const getUserNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params

    const scope = req.user?.type === 'parent'
      ? (req.query.childId !== undefined
        ? { studentId: { $in: await selectedStudentIds(req.user, req.query.childId) } }
        : { $or: [{ studentId: { $in: await visibleStudentIds(req.user) } }, { studentId: null }] })
      : {};
    const notifications = await Notification.find({ to: userId, ...scope }).limit(200).sort({
      createdAt: -1,
    })

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: notifications,
    })
  }
)

/**********************************
 * MARK ALL NOTIFICATIONS AS READ *
 **********************************/
export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params

  const result = await Notification.updateMany(
    { to: userId, isViewed: false },
    { isViewed: true }
  )

  res.status(httpStatus.OK).json({
    success: true,
    message: 'All notifications marked as read',
    modifiedCount: result.modifiedCount,
  })
})

/**********************************
 * MARK ONE NOTIFICATION AS READ  *
 **********************************/
export const markOneAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const { notificationId } = req.params

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, to: req.user!._id },
      { isViewed: true },
      { new: true }
    )

    if (!notification) {
      throw new AppError(httpStatus.NOT_FOUND, 'Notification not found')
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    })
  }
)



/**
 import { createNotification } from '../services/notification.service'

await createNotification({
  to: user._id,
  message: 'You have a new message',
  type: 'message',
  id: message._id,
})

 */
