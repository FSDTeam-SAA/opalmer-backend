import { model, Schema } from "mongoose";
import { IParent } from "../interface/parent.interface";
import bcrypt from "bcrypt";

const parentSchema = new Schema<IParent>({
  name: { type: String, required: true },
  email: { type: String },
  Id: { type: String, required: true },
  password: { type: String, required: true },
  relationship: {
    type: String,
    enum: [
      "father",
      "mother",
      "stepfather",
      "stepmother",
      "grandfather",
      "grandmother",
      "uncle",
      "aunt",
      "brother",
      "sister",
      "guardian",
      "other",
    ],
    required: true,
  },
  address: { type: String },
  phoneNumber: { type: String },
  avatar: {
    public_id: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  schoolId: { type: Schema.Types.ObjectId, ref: "School" },
  childrenId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

parentSchema.pre("save", async function (next) {
  const user = this as any;

  if (user.isModified("password")) {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUND) || 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }

  next();
});

parentSchema.statics.isPasswordMatched = async function (
  plainTextPassword: string,
  hashPassword: string
) {
  return await bcrypt.compare(plainTextPassword, hashPassword);
};

const Parent = model<IParent>("Parent", parentSchema);
export default Parent;
