import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import config from "../config/config";
import { recordUploadedAsset } from '../services/uploadContext.service';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadToCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) {
      // console.log("❌ Local file path missing");
      return null;
    }

    // console.log("📤 Uploading file to Cloudinary:", localFilePath);

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: /\.(jpe?g|png|webp)$/i.test(localFilePath) ? "image" : /\.(mp4|webm|mov|mp3|m4a|wav|ogg)$/i.test(localFilePath) ? "video" : "raw",
    });

    // console.log("✅ Upload Success:", response);

    recordUploadedAsset(response.secure_url);
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error: any) {
    console.error("❌ Cloudinary Upload Error:", error);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

export const uploadBase64ImageToCloudinary = async (
  imageBase64: string,
  folder = "opalmer/quiz-images"
) => {
  try {
    if (!imageBase64) return null;

    const response = await cloudinary.uploader.upload(
      `data:image/png;base64,${imageBase64}`,
      {
        folder,
        resource_type: "image",
      }
    );

    recordUploadedAsset(response.secure_url);
    return response;
  } catch (error: any) {
    console.error("Cloudinary Base64 Image Upload Error:", error);
    return null;
  }
};

export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image', deliveryType: 'upload' | 'private' | 'authenticated' = 'upload') => {
  if (!publicId) return;
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: deliveryType, invalidate: true });
  if (result.result !== 'ok' && result.result !== 'not found') throw new Error('Cloudinary did not confirm deletion');
  return result;
};
