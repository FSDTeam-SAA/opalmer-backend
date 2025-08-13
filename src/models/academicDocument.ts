import { Schema } from "mongoose";
import { IAcademicDocument } from "../interface/academicDocument.interface";

const academicDocumentSchema = new Schema<IAcademicDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    document: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

const AcademicDocument = academicDocumentSchema;
export default AcademicDocument;
