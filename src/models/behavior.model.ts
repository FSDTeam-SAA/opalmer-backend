import mongoose, { Schema } from "mongoose";
import { IBehavior, BehaviorModel } from "../interface/behavior.interface";

const behaviorSchema: Schema<IBehavior> = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User" },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    tags: { type: [String], default: [] },
    points: { type: Number, default: 0 },
    severity: { type: String, enum: ["normal", "urgent"], default: "normal" },
    parentVisible: { type: Boolean, default: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class" },
    state: { type: String, enum: ["positive", "neutral", "corrective", "negative"], required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

export const Behavior = mongoose.model<IBehavior, BehaviorModel>(
  "Behavior",
  behaviorSchema
);
