import { model, Schema } from "mongoose";
import { IParent } from "../interface/parent.interface";

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
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School" },
  childrenId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const Parent = model<IParent>("Parent", parentSchema);
export default Parent;
