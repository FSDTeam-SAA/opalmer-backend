"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schoolSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    administrator: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    code: { type: String, trim: true, unique: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    establishedYear: { type: Number },
    logo: { type: String, trim: true },
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
});
const school = (0, mongoose_1.model)("School", schoolSchema);
exports.default = school;
