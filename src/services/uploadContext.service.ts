import { AsyncLocalStorage } from "node:async_hooks";
export const uploadContext = new AsyncLocalStorage<{ urls: string[] }>();
export const recordUploadedAsset = (url: string) =>
  uploadContext.getStore()?.urls.push(url);
