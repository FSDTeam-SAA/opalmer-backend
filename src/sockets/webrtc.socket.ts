import { Server, Socket } from 'socket.io'

interface Rooms {
  [roomId: string]: string[]
}

const rooms: Rooms = {}

export const setupWebRTCSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Connected:', socket.id)

    socket.on('join', (roomId: string) => {
      socket.join(roomId)

      if (!rooms[roomId]) rooms[roomId] = []
      rooms[roomId].push(socket.id)

      // Send existing users in room to the newly joined user
      const otherUsers = rooms[roomId].filter((id) => id !== socket.id)
      socket.emit('all-users', otherUsers)

      // Notify others in the room about new user
      socket.to(roomId).emit('user-joined', socket.id)

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
        rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id)
        socket.to(roomId).emit('user-left', socket.id)
      })
    })
  })
}
