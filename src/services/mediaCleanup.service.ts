import { createHash } from "node:crypto";
import mongoose from "mongoose";
import config from "../config/config";
import { MediaCleanup } from "../models/mediaCleanup.model";
import { deleteFromCloudinary } from "../utils/cloudinary";

export const mediaFields: Record<string, string[]> = {
  User: ["avatar"],
  School: ["logo"],
  Room: ["avatar"],
  Lesson: ["document"],
  AcademicDocument: ["document"],
  Homework: ["file"],
  Submission: ["files"],
  Message: ["file"],
  GroupWork: ["file"],
  Quiz: ["image"],
  QuizQA: ["questions.imageUrl"],
  LearningTip: ["img", "imageUrl", "sections.imageUrls"],
};
export type CloudAsset = {
  publicId: string;
  resourceType: "image" | "video" | "raw";
  deliveryType: "upload" | "private" | "authenticated";
  url?: string;
};
export const assetKey = (asset: CloudAsset) => {
  const cloud = asset.url ? new URL(asset.url).pathname.split("/")[1] : "";
  return createHash("sha256")
    .update(
      `${cloud}:${asset.resourceType}:${asset.deliveryType}:${asset.publicId}`,
    )
    .digest("hex");
};
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const cloudAsset = (value: any): CloudAsset | null => {
  const url =
    typeof value === "string" ? value : (value?.url ?? value?.secure_url);
  if (!url || !config.cloudinary.cloudName) return null;
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname !== "res.cloudinary.com" ||
      !["http:", "https:"].includes(parsed.protocol)
    )
      return null;
    const parts = parsed.pathname.slice(1).split("/").map(decodeURIComponent);
    if (
      parts[0] !== config.cloudinary.cloudName ||
      !["image", "video", "raw"].includes(parts[1]) ||
      !["upload", "private", "authenticated"].includes(parts[2])
    )
      return null;
    let content = parts.slice(3);
    const version = content.findIndex((part) => /^v\d+$/.test(part));
    if (version >= 0) content = content.slice(version + 1);
    else
      while (
        content.length > 1 &&
        /^(?:c|w|h|q|f|e|g|ar|dpr|fl|t)_/.test(content[0])
      )
        content.shift();
    let publicId = content.join("/");
    // Raw IDs include the file extension. Image/video delivery extensions do not.
    if (parts[1] !== "raw") publicId = publicId.replace(/\.[^/.]+$/, "");
    if (!publicId || publicId.includes("..")) return null;
    return {
      publicId,
      resourceType: parts[1] as CloudAsset["resourceType"],
      deliveryType: parts[2] as CloudAsset["deliveryType"],
      url,
    };
  } catch {
    return null;
  }
};

const valuesAt = (record: any, parts: string[]): any[] => {
  if (Array.isArray(record))
    return record.flatMap((item) => valuesAt(item, parts));
  if (!parts.length) return [record];
  return record == null ? [] : valuesAt(record[parts[0]], parts.slice(1));
};
export const recordAssets = (record: any, fields: string[]): CloudAsset[] => {
  if (!record || record.isDeleted === true) return [];
  const found = fields
    .flatMap((field) => valuesAt(record, field.split(".")))
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map(cloudAsset)
    .filter((asset): asset is CloudAsset => asset !== null);
  return [...new Map(found.map((asset) => [assetKey(asset), asset])).values()];
};

export const assetIsReferenced = async (
  asset: CloudAsset,
): Promise<boolean> => {
  const cloud = escapeRegex(config.cloudinary.cloudName ?? "");
  const spellings = new Set([
    asset.publicId,
    asset.publicId.split("/").map(encodeURIComponent).join("/"),
    encodeURIComponent(asset.publicId),
  ]);
  const id = `(?:${[...spellings].map(escapeRegex).join("|")})`;
  const regex = new RegExp(
    `^https?://res\\.cloudinary\\.com/${cloud}/${asset.resourceType}/${asset.deliveryType}/(?:[^?#]+/)?${id}${asset.resourceType === "raw" ? "" : "(?:\\.[^/?#]+)?"}(?:[?#].*)?$`,
  );
  for (const [name, fields] of Object.entries(mediaFields)) {
    const model = mongoose.models[name];
    if (!model) continue;
    const alternatives = fields.flatMap((field) => {
      if (
        model.schema.path(`${field}.url`) ||
        model.schema.path(`${field}.public_id`)
      ) {
        return [
          { [`${field}.url`]: regex },
          { [`${field}.public_id`]: asset.publicId },
        ];
      }
      return [{ [field]: regex }];
    });
    if (
      await model.exists({
        $or: alternatives,
        ...(name === "Message" ? { isDeleted: { $ne: true } } : {}),
      })
    )
      return true;
  }
  return false;
};

export const queueMediaCleanup = async (
  assets: CloudAsset[],
  session?: any,
): Promise<string[]> => {
  const unique = [
    ...new Map(assets.map((asset) => [assetKey(asset), asset])).values(),
  ];
  for (const asset of unique) {
    const key = assetKey(asset);
    await MediaCleanup.updateOne(
      { _id: key },
      {
        $setOnInsert: {
          ...asset,
          nextAttemptAt: new Date(Date.now() + 60_000),
          lockedUntil: new Date(0),
          attempts: 0,
        },
      },
      { upsert: true, ...(session ? { session } : {}) },
    );
  }
  return unique.map(assetKey);
};

// Exported separately so reference safety, Cloudinary outages and retries can be
// tested without making a provider call or opening a database connection.
export const cleanAsset = async (
  asset: CloudAsset,
  referenced = assetIsReferenced,
  destroy = deleteFromCloudinary,
): Promise<boolean> => {
  const currentCloudAsset = cloudAsset(asset.url);
  if (!currentCloudAsset || assetKey(currentCloudAsset) !== assetKey(asset))
    throw new Error(
      "Cleanup asset belongs to a different Cloudinary configuration",
    );
  if (await referenced(asset)) return false;
  await destroy(asset.publicId, asset.resourceType, asset.deliveryType);
  return true;
};

let processing = false;
export const processMediaCleanup = async (keys?: string[]) => {
  if (processing) return;
  processing = true;
  try {
    for (let count = 0; count < 30; count++) {
      const now = new Date();
      const job = await MediaCleanup.findOneAndUpdate(
        {
          ...(keys ? { _id: { $in: keys } } : { nextAttemptAt: { $lte: now } }),
          lockedUntil: { $lte: now },
        },
        {
          $set: { lockedUntil: new Date(Date.now() + 120_000) },
          $inc: { attempts: 1 },
        },
        { new: true },
      );
      if (!job) break;
      try {
        if (await cleanAsset(job.toObject() as CloudAsset))
          await MediaCleanup.deleteOne({ _id: job._id });
        else
          await MediaCleanup.updateOne(
            { _id: job._id },
            {
              $set: {
                lockedUntil: new Date(0),
                nextAttemptAt: new Date(Date.now() + 3_600_000),
                lastError: "Asset remains referenced",
              },
            },
          );
      } catch {
        await MediaCleanup.updateOne(
          { _id: job._id },
          {
            $set: {
              lockedUntil: new Date(0),
              nextAttemptAt: new Date(
                Date.now() +
                  Math.min(
                    86_400_000,
                    30_000 * 2 ** Math.min(job.attempts, 11),
                  ),
              ),
              lastError: "Cloudinary cleanup failed; retry scheduled",
            },
          },
        );
      }
      // A targeted flush attempts each asset once, even when it must be retried.
      if (keys) keys = keys.filter((key) => key !== job._id);
      if (keys?.length === 0) break;
    }
  } finally {
    processing = false;
  }
};

export const startMediaCleanupWorker = () => {
  const run = () =>
    void processMediaCleanup().catch(() =>
      console.error("Media cleanup worker will retry after a database error"),
    );
  run();
  const timer = setInterval(run, 30_000);
  timer.unref();
  return () => clearInterval(timer);
};
