"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const academicDocumentSchema = new mongoose_1.Schema({
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    teacherId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    schoolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "School" },
    document: {
        public_id: { type: String, default: "" },
        url: { type: String, default: "" },
    },
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
});
const AcademicDocument = (0, mongoose_1.model)("AcademicDocument", academicDocumentSchema);
exports.default = AcademicDocument;
