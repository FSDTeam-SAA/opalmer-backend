import { Socket } from 'socket.io'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { User } from '../models/user.model'

type SocketAuthPayload = JwtPayload & {
  userId?: string
  tokenVersion?: number
}

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1]
    if (!token) {
      return next(new Error('Authentication error: Token not found'))
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret'
    ) as SocketAuthPayload

    const user = await User.findById(decoded.userId).select('_id type username avatar')
    if (!user) {
      return next(new Error('Authentication error: User not found'))
    }

    const currentTokenVersion = user.tokenVersion ?? 0
    const decodedTokenVersion = decoded.tokenVersion ?? 0
    if (currentTokenVersion !== decodedTokenVersion) {
      return next(new Error('Authentication error: Session expired'))
    }

    // Attach user info to socket
    (socket as any).user = user
    next()
  } catch (err) {
    next(new Error('Authentication error: Invalid or expired token'))
  }
}
