import { createHash } from "node:crypto";

export function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function extensionFromContentType(contentType: string): string {
  const normalized = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  switch (normalized) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/svg+xml":
      return ".svg";
    default:
      return ".bin";
  }
}

export function extensionFromUrl(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith(".jpeg") || pathname.endsWith(".jpg")) return ".jpg";
    if (pathname.endsWith(".png")) return ".png";
    if (pathname.endsWith(".webp")) return ".webp";
    if (pathname.endsWith(".gif")) return ".gif";
    if (pathname.endsWith(".svg")) return ".svg";
  } catch {
    return undefined;
  }
  return undefined;
}

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export function isAllowedImageContentType(contentType: string): boolean {
  const normalized = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return ALLOWED_CONTENT_TYPES.has(normalized);
}

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
