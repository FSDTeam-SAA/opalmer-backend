import { Document, Model } from 'mongoose'

export interface IUser extends Document {
  username: string
  phoneNumber?: string
  role: 'user' | 'admin' | 'administrator'
  type: ('parent' | 'student' | 'teacher')[]
  Id?: number 
  password: string
  gradeLevel?: 'grade1' | 'grade2' | 'grade3' | 'grade4' | 'grade5' | 'grade6'
  state: 'active' | 'inactive' | 'suspended'
  age?: number
  avatar?: {
    public_id: string
    url: string
  }
  verificationInfo?: {
    verified: boolean
    token: string
  }
  password_reset_token?: string
  refreshToken?: string
  credit?: number
  fine?: number
  created_at?: Date
  updated_at?: Date
}

// Static methods interface
export interface UserModel extends Model<IUser> {
  isUserExistsByEmail(email: string): Promise<IUser | null>
  isOTPVerified(id: string): Promise<boolean | undefined>
  isPasswordMatched(
    plainTextPassword: string,
    hashPassword: string
  ): Promise<boolean>
}

export type TLoginUser = {
  email: string
  password: string
}
export interface UserModel extends Model<IUser> {
  isUserExistsByEmail(email: string): Promise<IUser>
  isOTPVerified(id: string): Promise<boolean>
  isPasswordMatched(
    plainTextPassword: string,
    hashPassword: string
  ): Promise<boolean>
  isJWTIssuedBeforePasswordChanged(
    passwordChangeTimeStamp: Date,
    JwtIssuedTimeStamp: number
  ): boolean
}
