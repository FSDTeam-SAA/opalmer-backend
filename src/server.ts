import app from './app'
import dotenv from 'dotenv'
import { connectDB } from './config/db'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { setupMessageSocket } from './sockets/message.socket'

dotenv.config()

const PORT = process.env.PORT || 5000

const httpserver = createServer(app)

export const io = new Server(httpserver, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

setupMessageSocket(io)

connectDB().then(() => {
  httpserver.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
  })
})
