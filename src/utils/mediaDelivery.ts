type SignFile = (publicId: string) => string;

// Keep permanent storage URLs intact; short-lived delivery URLs are response-only.
export const fileDeliveryReplacer = (cloudName: string | undefined, sign: SignFile) =>
  (_key: string, item: any) => {
    if (!cloudName || !item || typeof item !== "object" || typeof item.url !== "string") return item;
    try {
      const url = new URL(item.url);
      const parts = url.pathname.slice(1).split("/").map(decodeURIComponent);
      if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" ||
          parts[0] !== cloudName || parts[1] !== "raw" || parts[2] !== "upload") return item;
      const content = parts.slice(3);
      if (/^v\d+$/.test(content[0])) content.shift();
      const publicId = content.join("/");
      if (!publicId || content.some(part => part === ".." || part === ".")) return item;
      return { ...item, downloadUrl: sign(publicId) };
    } catch { return item; }
  };

export function withFileDelivery<T>(value: T, cloudName: string | undefined, sign: SignFile): T {
  if (value === undefined || !cloudName) return value;
  return JSON.parse(JSON.stringify(value, fileDeliveryReplacer(cloudName, sign)));
}
