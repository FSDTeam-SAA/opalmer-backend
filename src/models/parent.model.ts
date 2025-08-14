import { Schema } from "mongoose";
import { IParent } from "../interface/parent.interface";

const parentSchema = new Schema<IParent>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  relationship: { type: String, required: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  childrenId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});
