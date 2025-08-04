import { Request, Response } from 'express'
import { User } from '../models/user.model'
import AppError from '../errors/AppError' 
import catchAsync from '../utils/catchAsync'
import { uploadToCloudinary } from '../utils/cloudinary'
import jwt  from 'jsonwebtoken';

/*****************
 * REGISTER USER *
 *****************/
export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const { username, Id, age, state, password } = req.body

  // Validate required fields
  if (!username || !Id || !age || !state || !password) {
    throw new AppError(
      400,
      'All fields (username, Id, age, state, password) are required.'
    )
  }

  // Check if username already exists
  const existingUser = await User.findOne({ username })
  if (existingUser) {
    throw new AppError(409, 'Username already exists')
  }

  // Handle image upload
  let avatar = { public_id: '', url: '' }
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.path)
    if (uploadResult) {
      avatar = {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
      }
    }
  }

  // Create user
  const user = await User.create({
    username,
    Id,
    age,
    state,
    password,
    avatar,
  })

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: user._id,
      username: user.username,
      age: user.age,
      state: user.state,
      avatar: user.avatar,
      created_at: user.created_at,
    },
  })
})

/**************
 * LOGIN USER *
 **************/
export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { Id, password } = req.body

  // Validate input
  if (!Id || !password) {
    throw new AppError(400, 'Id and password are required.')
  }

  // Find user by Id
  const user = await User.findOne({ Id }).select('+password')
  if (!user) {
    throw new AppError(401, 'Invalid Id or password.')
  }

  // Compare password
  const isPasswordMatched = await User.isPasswordMatched(
    password,
    user.password
  )
  if (!isPasswordMatched) {
    throw new AppError(401, 'Invalid Id or password.')
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '7d' }
  )

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        Id: user.Id,
        role: user.role,
        state: user.state,
        avatar: user.avatar,
      },
    },
  })
})