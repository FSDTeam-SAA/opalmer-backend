"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const aboutAndTermSchema = new mongoose_1.Schema({
    docType: {
        type: String,
        required: true,
        enum: ["about", "terms"],
    },
    description: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
const AboutAndTerm = (0, mongoose_1.model)("AboutAndTerm", aboutAndTermSchema);
exports.default = AboutAndTerm;
