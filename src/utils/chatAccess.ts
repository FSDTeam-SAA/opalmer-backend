import httpStatus from 'http-status'
import mongoose, { Types } from 'mongoose'
import AppError from '../errors/AppError'
import { User } from '../models/user.model'
import { ParentsChild } from '../models/parentsChild.model'
import { Class } from '../models/class.model'
import { StuAssignToClass } from '../models/stuAssignToClass.model'
import { Room } from '../models/room.model'

const toObjectId = (id: string | Types.ObjectId) =>
  new mongoose.Types.ObjectId(id)

const idsEqual = (a: string | Types.ObjectId, b: string | Types.ObjectId) =>
  toObjectId(a).equals(toObjectId(b))

const isTeacherOfStudent = async (teacherId: string, studentId: string) => {
  const classIds = await Class.find({ teacherId: toObjectId(teacherId) }).distinct(
    '_id'
  )

  if (!classIds.length) return false

  const assignment = await StuAssignToClass.exists({
    studentId: toObjectId(studentId),
    classId: { $in: classIds },
  })

  return Boolean(assignment)
}

const isParentOfStudent = async (parentId: string, studentId: string) => {
  const relation = await ParentsChild.exists({
    parentId: toObjectId(parentId),
    childId: toObjectId(studentId),
  })

  return Boolean(relation)
}

const doStudentsShareClass = async (studentAId: string, studentBId: string) => {
  const classIds = await StuAssignToClass.find({
    studentId: toObjectId(studentAId),
  }).distinct('classId')

  if (!classIds.length) return false

  const shared = await StuAssignToClass.exists({
    studentId: toObjectId(studentBId),
    classId: { $in: classIds },
  })

  return Boolean(shared)
}

const isTeacherLinkedToParent = async (teacherId: string, parentId: string) => {
  const parentChildRows = await ParentsChild.find({
    parentId: toObjectId(parentId),
  }).select('childId')

  if (!parentChildRows.length) return false

  const childIds = parentChildRows.map((row) => row.childId)
  const classIds = await Class.find({ teacherId: toObjectId(teacherId) }).distinct(
    '_id'
  )

  if (!classIds.length) return false

  const linked = await StuAssignToClass.exists({
    studentId: { $in: childIds },
    classId: { $in: classIds },
  })

  return Boolean(linked)
}

export const canMessageUser = async (senderId: string, recipientId: string) => {
  if (!mongoose.Types.ObjectId.isValid(senderId)) {
    return { allowed: false, reason: 'Invalid sender ID' }
  }

  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    return { allowed: false, reason: 'Invalid recipient ID' }
  }

  if (idsEqual(senderId, recipientId)) {
    return { allowed: false, reason: 'You cannot message yourself' }
  }

  const [sender, recipient] = await Promise.all([
    User.findById(senderId).select('_id type schoolId isActive'),
    User.findById(recipientId).select('_id type schoolId isActive'),
  ])

  if (!sender || !recipient) {
    return { allowed: false, reason: 'Sender or recipient not found' }
  }

  if (!sender.isActive || !recipient.isActive) {
    return { allowed: false, reason: 'One of the users is inactive' }
  }

  // Prevent cross-school messaging when both users belong to a school.
  if (
    sender.schoolId &&
    recipient.schoolId &&
    !toObjectId(sender.schoolId).equals(toObjectId(recipient.schoolId))
  ) {
    return {
      allowed: false,
      reason: 'Cross-school messaging is not allowed',
    }
  }

  const senderType = sender.type
  const recipientType = recipient.type

  if (senderType === 'teacher' && recipientType === 'student') {
    const allowed = await isTeacherOfStudent(senderId, recipientId)
    return {
      allowed,
      reason: allowed
        ? undefined
        : 'Teacher can only message students from their own classes',
    }
  }

  if (senderType === 'student' && recipientType === 'teacher') {
    const allowed = await isTeacherOfStudent(recipientId, senderId)
    return {
      allowed,
      reason: allowed
        ? undefined
        : 'Student can only message their own class teachers',
    }
  }

  if (senderType === 'parent' && recipientType === 'student') {
    const allowed = await isParentOfStudent(senderId, recipientId)
    return {
      allowed,
      reason: allowed
        ? undefined
        : 'Parent can only message their own children',
    }
  }

  if (senderType === 'student' && recipientType === 'parent') {
    const allowed = await isParentOfStudent(recipientId, senderId)
    return {
      allowed,
      reason: allowed
        ? undefined
        : 'Student can only message their own parents',
    }
  }

  if (senderType === 'teacher' && recipientType === 'parent') {
    const allowed = await isTeacherLinkedToParent(senderId, recipientId)
    return {
      allowed,
      reason: allowed
        ? undefined
        : 'Teacher can only message parents linked through their students',
    }
  }

  if (senderType === 'parent' && recipientType === 'teacher') {
    const allowed = await isTeacherLinkedToParent(recipientId, senderId)
    return {
      allowed,
      reason: allowed
        ? undefined
        : 'Parent can only message teachers linked through their children',
    }
  }

  if (senderType === 'student' && recipientType === 'student') {
    const allowed = await doStudentsShareClass(senderId, recipientId)
    return {
      allowed,
      reason: allowed
        ? undefined
        : 'Students can only message classmates from shared classes',
    }
  }

  if (senderType === 'teacher' && recipientType === 'teacher') {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: `Messaging between ${senderType} and ${recipientType} is not allowed`,
  }
}

export const assertCanMessageUser = async (
  senderId: string,
  recipientId: string
) => {
  const result = await canMessageUser(senderId, recipientId)
  if (!result.allowed) {
    throw new AppError(httpStatus.FORBIDDEN, result.reason || 'Access denied')
  }
}

export const canCreateDirectRoom = async (
  creatorId: string,
  participantIds: string[]
) => {
  if (participantIds.length !== 2) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Direct rooms must contain exactly two participants'
    )
  }

  const uniqueParticipantIds = [...new Set(participantIds.map((id) => id.toString()))]
  if (uniqueParticipantIds.length !== 2) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Direct rooms must have two unique participants'
    )
  }

  const creatorIncluded = uniqueParticipantIds.some((id) =>
    idsEqual(id, creatorId)
  )

  if (!creatorIncluded) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You can only create direct rooms that include yourself'
    )
  }

  const peerId = uniqueParticipantIds.find((id) => !idsEqual(id, creatorId))
  if (!peerId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid direct room payload')
  }

  await assertCanMessageUser(creatorId, peerId)
}

export const canAccessRoom = async (userId: string, roomId: string) => {
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid room ID')
  }

  const room = await Room.findById(roomId)
  if (!room) {
    throw new AppError(httpStatus.NOT_FOUND, 'Room not found')
  }

  const isParticipant = room.participants.some((participant) =>
    idsEqual(participant.userId, userId)
  )

  if (!isParticipant) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not a participant of this room')
  }

  return room
}
