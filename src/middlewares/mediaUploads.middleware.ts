import { RequestHandler } from "express";
import { uploadContext } from "../services/uploadContext.service";
import {
  cloudAsset,
  CloudAsset,
  processMediaCleanup,
  queueMediaCleanup,
} from "../services/mediaCleanup.service";

// If a request fails after Cloudinary accepted an upload, clean up that new
// upload as well. Existing assets are protected by the same reference check.
export const trackMediaUploads: RequestHandler = (_req, res, next) => {
  const pending = { urls: [] as string[] };
  let scheduled = false;
  const rollback = () => {
    if (scheduled || !pending.urls.length) return;
    scheduled = true;
    const assets = pending.urls
      .map(cloudAsset)
      .filter((asset): asset is CloudAsset => asset !== null);
    void queueMediaCleanup(assets)
      .then((keys) => processMediaCleanup(keys))
      .catch(() =>
        console.error(
          "Failed-upload cleanup could not be queued; inspect upload failures",
        ),
      );
  };
  res.once("finish", () => {
    if (res.statusCode >= 400) rollback();
  });
  res.once("close", () => {
    if (!res.writableFinished) rollback();
  });
  uploadContext.run(pending, next);
};
