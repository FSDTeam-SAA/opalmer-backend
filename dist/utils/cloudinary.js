"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config/config"));
cloudinary_1.v2.config({
    cloud_name: config_1.default.cloudinary.cloudName,
    api_key: config_1.default.cloudinary.apiKey,
    api_secret: config_1.default.cloudinary.apiSecret,
});
const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            // console.log("❌ Local file path missing");
            return null;
        }
        // console.log("📤 Uploading file to Cloudinary:", localFilePath);
        const response = await cloudinary_1.v2.uploader.upload(localFilePath, {
            resource_type: "raw",
        });
        // console.log("✅ Upload Success:", response);
        fs_1.default.unlinkSync(localFilePath);
        return response;
    }
    catch (error) {
        console.error("❌ Cloudinary Upload Error:", error);
        if (fs_1.default.existsSync(localFilePath)) {
            fs_1.default.unlinkSync(localFilePath);
        }
        return null;
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId)
            return;
        await cloudinary_1.v2.uploader.destroy(publicId);
    }
    catch (error) {
        console.error("Error deleting from Cloudinary:", error);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
