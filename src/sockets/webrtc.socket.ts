import { Server, Socket } from 'socket.io'
import { canAccessRoom } from '../utils/chatAccess'

interface Rooms {
  [roomId: string]: string[]
}

const rooms: Rooms = {}

export const setupWebRTCSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const authUser = (socket as any).user;
    console.log('WebRTC Connected:', socket.id, authUser?._id)

    let currentRoom: string | null = null;

    socket.on('join', async (roomId: string, callback?: (res: any) => void) => {
      try {
        await canAccessRoom(authUser._id.toString(), roomId)
      } catch (err: any) {
        if (typeof callback === 'function') callback({ success: false, error: err.message })
        return
      }

      // Leave previous room if re-joining
      if (currentRoom) {
        socket.leave(currentRoom)
        if (rooms[currentRoom]) {
          rooms[currentRoom] = rooms[currentRoom].filter((id) => id !== socket.id)
          socket.to(currentRoom).emit('user-left', socket.id)
        }
      }

      currentRoom = roomId;
      socket.join(roomId)

      if (!rooms[roomId]) rooms[roomId] = []
      rooms[roomId].push(socket.id)

      if (typeof callback === 'function') callback({ success: true })

      // Send existing users in room to the newly joined user
      const otherUsers = rooms[roomId].filter((id) => id !== socket.id)
      socket.emit('all-users', otherUsers)

      // Notify others in the room about new user
      socket.to(roomId).emit('user-joined', socket.id)
    })

    // Forward signaling data to target user
    socket.on(
      'sending-signal',
      (payload: { userToSignal: string; callerId: string; signal: any }) => {
        io.to(payload.userToSignal).emit('user-signal', {
          signal: payload.signal,
          callerId: payload.callerId,
        })
      }
    )

    // Return signal back to caller
    socket.on(
      'returning-signal',
      (payload: { callerId: string; signal: any }) => {
        io.to(payload.callerId).emit('receiving-returned-signal', {
          signal: payload.signal,
          id: socket.id,
        })
      }
    )

    // Handle disconnect - remove from room and notify others
    socket.on('disconnect', () => {
      if (currentRoom && rooms[currentRoom]) {
        rooms[currentRoom] = rooms[currentRoom].filter((id) => id !== socket.id)
        socket.to(currentRoom).emit('user-left', socket.id)
      }
    })
  })
}
