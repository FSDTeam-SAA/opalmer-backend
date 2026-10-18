import '../config/env'
import { randomBytes } from 'crypto'
import mongoose from 'mongoose'
import { connectDB } from '../config/db'
import { getOptionalEnv } from '../config/env'
import { User } from '../models/user.model'

async function main() {
  const Id = getOptionalEnv('ADMIN_ID') || 'admin'
  const username = getOptionalEnv('ADMIN_NAME') || 'Opalmer Admin'
  const password = getOptionalEnv('ADMIN_PASSWORD') || randomBytes(18).toString('base64url')

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters.')
  }

  await connectDB()
  try {
    if (await User.exists({ Id })) {
      throw new Error(`Account with Id "${Id}" already exists. Choose another ADMIN_ID.`)
    }

    // Use the model so the existing pre-save hook hashes the password.
    const admin = await User.create({
      Id,
      username,
      password,
      role: 'admin',
      state: 'active',
      isActive: true,
    })

    console.log('Admin account created successfully.')
    console.log(`Admin Id: ${admin.Id}`)
    console.log(`Password: ${password}`)
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Admin creation failed.')
  process.exitCode = 1
})
