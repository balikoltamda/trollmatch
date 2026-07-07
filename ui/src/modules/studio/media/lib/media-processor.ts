import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { MediaAssetVariantKind } from "@/generated/prisma/client";
import {
  extensionFromContentType,
  sha256Hex,
} from "@/modules/studio/media/lib/image-bytes";

export type ProcessedVariant = {
  kind: MediaAssetVariantKind;
  publicPath: string;
  absolutePath: string;
  mimeType: string;
  widthPx: number | null;
  heightPx: number | null;
  sizeBytes: number;
};

export type ProcessedMediaAsset = {
  sha256Hash: string;
  mimeType: string;
  widthPx: number | null;
  heightPx: number | null;
  sizeBytes: number;
  variants: ProcessedVariant[];
};

const VARIANT_WIDTHS: Array<{
  kind: MediaAssetVariantKind;
  width: number;
  suffix: string;
}> = [
  { kind: MediaAssetVariantKind.LARGE, width: 1600, suffix: "-large" },
  { kind: MediaAssetVariantKind.MEDIUM, width: 800, suffix: "-medium" },
  { kind: MediaAssetVariantKind.THUMBNAIL, width: 240, suffix: "-thumb" },
];

function mediaDirPath(): string {
  return join(process.cwd(), "public", "media");
}

function isRasterMimeType(mimeType: string): boolean {
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  return (
    normalized === "image/jpeg" ||
    normalized === "image/png" ||
    normalized === "image/webp" ||
    normalized === "image/gif"
  );
}

async function writeIfMissing(absolutePath: string, bytes: Buffer): Promise<void> {
  try {
    await access(absolutePath, constants.F_OK);
  } catch {
    await writeFile(absolutePath, bytes);
  }
}

export async function processMediaBytes(input: {
  bytes: Buffer;
  contentType: string;
}): Promise<ProcessedMediaAsset> {
  const mimeType =
    input.contentType.split(";")[0]?.trim().toLowerCase() ??
    "application/octet-stream";
  const sha256Hash = sha256Hex(input.bytes);
  const extension = extensionFromContentType(mimeType);
  const mediaDir = mediaDirPath();
  await mkdir(mediaDir, { recursive: true });

  const originalFileName = `${sha256Hash}${extension}`;
  const originalPublicPath = `/media/${originalFileName}`;
  const originalAbsolutePath = join(mediaDir, originalFileName);

  await writeIfMissing(originalAbsolutePath, input.bytes);

  let widthPx: number | null = null;
  let heightPx: number | null = null;

  const variants: ProcessedVariant[] = [
    {
      kind: MediaAssetVariantKind.ORIGINAL,
      publicPath: originalPublicPath,
      absolutePath: originalAbsolutePath,
      mimeType,
      widthPx: null,
      heightPx: null,
      sizeBytes: input.bytes.length,
    },
  ];

  if (!isRasterMimeType(mimeType)) {
    return {
      sha256Hash,
      mimeType,
      widthPx,
      heightPx,
      sizeBytes: input.bytes.length,
      variants,
    };
  }

  const image = sharp(input.bytes, { animated: mimeType === "image/gif" });
  const metadata = await image.metadata();
  widthPx = metadata.width ?? null;
  heightPx = metadata.height ?? null;
  variants[0] = {
    ...variants[0],
    widthPx,
    heightPx,
  };

  for (const spec of VARIANT_WIDTHS) {
    const fileName = `${sha256Hash}${spec.suffix}.webp`;
    const publicPath = `/media/${fileName}`;
    const absolutePath = join(mediaDir, fileName);

    try {
      await access(absolutePath, constants.F_OK);
      const existingMeta = await sharp(absolutePath).metadata();
      variants.push({
        kind: spec.kind,
        publicPath,
        absolutePath,
        mimeType: "image/webp",
        widthPx: existingMeta.width ?? null,
        heightPx: existingMeta.height ?? null,
        sizeBytes: (await sharp(absolutePath).toBuffer()).length,
      });
      continue;
    } catch {
      // generate below
    }

    const resized = sharp(input.bytes, { animated: mimeType === "image/gif" })
      .rotate()
      .resize({ width: spec.width, withoutEnlargement: true })
      .webp({ quality: spec.kind === MediaAssetVariantKind.THUMBNAIL ? 75 : 82 });

    const bytes = await resized.toBuffer();
    await writeFile(absolutePath, bytes);
    const resizedMeta = await sharp(bytes).metadata();
    variants.push({
      kind: spec.kind,
      publicPath,
      absolutePath,
      mimeType: "image/webp",
      widthPx: resizedMeta.width ?? null,
      heightPx: resizedMeta.height ?? null,
      sizeBytes: bytes.length,
    });
  }

  const webpFileName = `${sha256Hash}.webp`;
  const webpPublicPath = `/media/${webpFileName}`;
  const webpAbsolutePath = join(mediaDir, webpFileName);

  try {
    await access(webpAbsolutePath, constants.F_OK);
    const existingMeta = await sharp(webpAbsolutePath).metadata();
    variants.push({
      kind: MediaAssetVariantKind.WEBP,
      publicPath: webpPublicPath,
      absolutePath: webpAbsolutePath,
      mimeType: "image/webp",
      widthPx: existingMeta.width ?? null,
      heightPx: existingMeta.height ?? null,
      sizeBytes: (await sharp(webpAbsolutePath).toBuffer()).length,
    });
  } catch {
    const webpBytes = await sharp(input.bytes, { animated: mimeType === "image/gif" })
      .rotate()
      .webp({ quality: 85 })
      .toBuffer();
    await writeFile(webpAbsolutePath, webpBytes);
    const webpMeta = await sharp(webpBytes).metadata();
    variants.push({
      kind: MediaAssetVariantKind.WEBP,
      publicPath: webpPublicPath,
      absolutePath: webpAbsolutePath,
      mimeType: "image/webp",
      widthPx: webpMeta.width ?? null,
      heightPx: webpMeta.height ?? null,
      sizeBytes: webpBytes.length,
    });
  }

  return {
    sha256Hash,
    mimeType,
    widthPx,
    heightPx,
    sizeBytes: input.bytes.length,
    variants,
  };
}

export function variantPathFromOriginal(
  originalPath: string,
  kind: MediaAssetVariantKind,
): string {
  const match = originalPath.match(/^\/media\/([a-f0-9]{64})(\.[^./]+)?$/i);
  if (!match) {
    return originalPath;
  }

  const hash = match[1]!;
  switch (kind) {
    case MediaAssetVariantKind.ORIGINAL:
      return originalPath;
    case MediaAssetVariantKind.LARGE:
      return `/media/${hash}-large.webp`;
    case MediaAssetVariantKind.MEDIUM:
      return `/media/${hash}-medium.webp`;
    case MediaAssetVariantKind.THUMBNAIL:
      return `/media/${hash}-thumb.webp`;
    case MediaAssetVariantKind.WEBP:
      return `/media/${hash}.webp`;
    default:
      return originalPath;
  }
}

export { mediaDirPath as resolvePublicMediaDir };
