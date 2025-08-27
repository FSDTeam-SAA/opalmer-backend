import mongoose from "mongoose";

const marksSchema = new mongoose.Schema(
  {
    classId: { type: String, required: true },
    teacherId: { type: String, required: true },
    studentId: { type: String, required: true },
    marks: [{ type: Number }], // extracted numbers
    rawText: { type: String }, 
     document: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },// store full OCR text for debugging
  },
  { timestamps: true }
);

export const Marks = mongoose.model("Marks", marksSchema);

