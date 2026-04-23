"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const academicDocument_model_1 = __importDefault(require("./src/models/academicDocument.model"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function checkDocs() {
    await mongoose_1.default.connect(process.env.MONGO_URI);
    const docs = await academicDocument_model_1.default.find();
    console.log('Total Academic Documents:', docs.length);
    console.log('Docs:', JSON.stringify(docs, null, 2));
    await mongoose_1.default.disconnect();
}
checkDocs();
