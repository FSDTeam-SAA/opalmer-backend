import mongoose, { Schema } from "mongoose";
import { ILesson, LessonModel } from "../interface/lesson.interface";

const lessonSchema: Schema<ILesson> = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User" },
    objective: { type: String, required: true },
    note: { type: String, required: true },
    document: { type: String, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

export const Lesson = mongoose.model<ILesson, LessonModel>(
  "Lesson",
  lessonSchema
);
