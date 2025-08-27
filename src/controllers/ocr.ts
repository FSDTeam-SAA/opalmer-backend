import { Request, Response } from "express";
import vision from "@google-cloud/vision";
import { Marks } from "../models/marks.model";
import { uploadToCloudinary } from "../utils/cloudinary";


// Initialize Google Vision client
const client = new vision.ImageAnnotatorClient();

export const extractMarks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, teacherId, studentId, imagePath } = req.body as {
      classId: string;
      teacherId: string;
      studentId: string;
      imagePath: string;
    };

    if (!classId || !teacherId || !studentId ||  !req.file) {
      res.status(400).json({ status: false, message: "Missing required fields" });
      return;
    }

     // ---- Upload image to Cloudinary ----
    const uploadResult = await uploadToCloudinary(req.file.path);
    if (!uploadResult) {
      res.status(500).json({ status: false, message: "Failed to upload image" });
      return;
    }

    const document = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url, // <-- This is the URL we pass to OCR
    };


    // ---- OCR logic ----
    const [result] = await client.textDetection(document.url);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      res.status(400).json({ status: false, message: "No text detected" });
      return;
    }

    const rawText: string = detections[0].description ?? "";
    const marks: number[] = rawText.match(/\d+/g)?.map(Number) || [];

    // ---- Save to DB ----
    const record = new Marks({
      classId,
      teacherId,
      studentId,
      marks,
      rawText,
      document
    });

    await record.save();

    // ---- Response ----
    res.json({
      status: true,
      message: "Marks extracted and saved successfully",
      data: record,
    });
  } catch (error: any) {
    console.error("OCR Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};
