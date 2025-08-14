import { Model, Types } from "mongoose";

export interface IParent {
  name: string;
  email?: string;
  Id: string;
  password: string;
  relationship: string;
  address?: string;
  phoneNumber: string;
  avatar?: {
    public_id: string;
    url: string;
  };
  schoolId: Types.ObjectId;
  childrenId: Types.ObjectId;
}

export interface parentSchema extends Model<IParent> {
  isPasswordMatched(
    plainTextPassword: string,
    hashPassword: string
  ): Promise<boolean>;
}
