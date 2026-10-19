import { model, Schema } from "mongoose";

// Written before a destructive media update, so a process restart cannot lose
// the cleanup request. The worker always checks live references before deleting.
export const MediaCleanup = model(
  "MediaCleanup",
  new Schema(
    {
      _id: { type: String, required: true },
      publicId: { type: String, required: true },
      resourceType: {
        type: String,
        enum: ["image", "video", "raw"],
        required: true,
      },
      deliveryType: {
        type: String,
        enum: ["upload", "private", "authenticated"],
        default: "upload",
      },
      url: String,
      attempts: { type: Number, default: 0 },
      nextAttemptAt: { type: Date, default: Date.now, index: true },
      lockedUntil: { type: Date, default: () => new Date(0) },
      lastError: String,
    },
    { timestamps: true },
  ),
);
