"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const featuresAndQuestionsSchema = new mongoose_1.Schema({
    docType: {
        type: String,
        required: true,
        enum: ["AppFeatures", "FAQquestions"],
    },
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
const FeaturesAndQuestions = (0, mongoose_1.model)("FeaturesAndQuestions", featuresAndQuestionsSchema);
exports.default = FeaturesAndQuestions;
