import { Types } from "mongoose";

export interface IAcademicDocument {
  studentId: Types.ObjectId;
  teacherId: Types.ObjectId;
  schoolId: Types.ObjectId;
  document: {
    public_id: string;
    url: string;
  };
}
