import express from 'express'
import cors from 'cors'
import { globalErrorHandler } from './middlewares/globalErrorHandler'
import { notFound } from './middlewares/notFound'
import router from './routes'
const app = express()

app.use(cors())
app.use(express.json())

app.use(express.static('public'))

// app.get('/', (_req, res) => {
//   res.json({ success: true, message: 'Opalmer API is running' })
// })
app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'Opalmer API is running', uptime: process.uptime() })
})

app.use('/api/v1', router)

app.use(notFound as never)
app.use(globalErrorHandler)

export default app
