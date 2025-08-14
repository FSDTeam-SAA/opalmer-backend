import { Types } from "mongoose";

export interface IParent {
  name: string;
  email?: string;
  Id: string;
  password: string;
  relationship: string;
  address?: string;
  phoneNumber: string;
  schoolId: Types.ObjectId;
  childrenId: Types.ObjectId;
}
