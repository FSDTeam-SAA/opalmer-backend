import { Socket } from 'socket.io'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { User } from '../models/user.model'

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1]
    if (!token) {
      return next(new Error('Authentication error: Token not found'))
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret'
    ) as JwtPayload

    const user = await User.findById(decoded.userId).select('_id type')
    if (!user) {
      return next(new Error('Authentication error: User not found'))
    }

    // Attach user info to socket
    (socket as any).user = user
    next()
  } catch (err) {
    next(new Error('Authentication error: Invalid or expired token'))
  }
}
