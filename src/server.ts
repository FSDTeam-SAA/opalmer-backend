import app from './app'
import dotenv from 'dotenv'
import { connectDB } from './config/db'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { setupMessageSocket } from './sockets/message.socket'
import { setupWebRTCSocket } from './sockets/webrtc.socket'

dotenv.config()

const PORT = process.env.PORT || 5000

const httpserver = createServer(app)

export const io = new Server(httpserver, {
  cors: {
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  },
})

setupMessageSocket(io)
setupWebRTCSocket(io)

connectDB().then(() => {
  httpserver.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`)
  })
})
