import { Types } from "mongoose";

export interface IAcademicDocument {
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  schoolId: Types.ObjectId;
  document: {
    public_id: string;
    url: string;
  };
}
