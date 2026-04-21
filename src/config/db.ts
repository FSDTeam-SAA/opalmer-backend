import mongoose from 'mongoose'
import { getRequiredEnv } from './env'

export const connectDB = async () => {
  try {
    const mongoUri = getRequiredEnv('MONGO_URI')

    await mongoose.connect(mongoUri)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}
