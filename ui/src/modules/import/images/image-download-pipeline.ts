import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

export type ImageMetadata = {
  url: string;
  sha256: string;
  contentType: string;
  sizeBytes: number;
  downloadedAt: string;
  localPath: string;
};

export type ImageDownloadResult = {
  url: string;
  localPath: string;
  metadataPath: string;
  sha256: string;
  skipped: boolean;
  downloaded: boolean;
};

function extensionFromContentType(contentType: string): string {
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

function extensionFromUrl(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname;
    const ext = extname(pathname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) {
      return ext === ".jpeg" ? ".jpg" : ext;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

async function readExistingMetadata(
  metadataPath: string,
): Promise<ImageMetadata | null> {
  try {
    const raw = await readFile(metadataPath, "utf8");
    return JSON.parse(raw) as ImageMetadata;
  } catch {
    return null;
  }
}

/**
 * Download a manufacturer image to local storage.
 * Skips re-download when metadata exists for the same URL and SHA-256 hash.
 */
export async function downloadManufacturerImage(
  manufacturerSlug: string,
  imageUrl: string,
  imagesRoot: string,
  fetchFn: typeof fetch = fetch,
): Promise<ImageDownloadResult> {
  const manufacturerDir = join(imagesRoot, manufacturerSlug, "images");
  await mkdir(manufacturerDir, { recursive: true });

  const response = await fetchFn(imageUrl, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status}): ${imageUrl}`);
  }

  const contentType =
    response.headers.get("content-type") ?? "application/octet-stream";
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const extension =
    extensionFromUrl(imageUrl) ?? extensionFromContentType(contentType);
  const fileName = `${sha256}${extension}`;
  const localPath = join(manufacturerDir, fileName);
  const metadataPath = join(manufacturerDir, `${fileName}.meta.json`);

  const existing = await readExistingMetadata(metadataPath);
  if (existing?.url === imageUrl && existing.sha256 === sha256) {
    return {
      url: imageUrl,
      localPath,
      metadataPath,
      sha256,
      skipped: true,
      downloaded: false,
    };
  }

  await writeFile(localPath, bytes);

  const metadata: ImageMetadata = {
    url: imageUrl,
    sha256,
    contentType,
    sizeBytes: bytes.length,
    downloadedAt: new Date().toISOString(),
    localPath,
  };

  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  return {
    url: imageUrl,
    localPath,
    metadataPath,
    sha256,
    skipped: false,
    downloaded: true,
  };
}

export async function downloadManufacturerImages(
  manufacturerSlug: string,
  imageUrls: string[],
  imagesRoot: string,
  fetchFn: typeof fetch = fetch,
): Promise<{
  downloaded: ImageDownloadResult[];
  skipped: ImageDownloadResult[];
  errors: string[];
}> {
  const downloaded: ImageDownloadResult[] = [];
  const skipped: ImageDownloadResult[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const url of imageUrls) {
    const trimmed = url.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);

    try {
      const result = await downloadManufacturerImage(
        manufacturerSlug,
        trimmed,
        imagesRoot,
        fetchFn,
      );

      if (result.skipped) {
        skipped.push(result);
      } else {
        downloaded.push(result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${trimmed}: ${message}`);
    }
  }

  return { downloaded, skipped, errors };
}

export function resolveManufacturerImagesRoot(repoRoot: string): string {
  return join(repoRoot, "research", "manufacturers");
}

export function collectImageUrlsFromRecords(
  records: Array<{
    model: { images?: Array<{ url: string }> };
    variants: Array<{ images?: Array<{ url: string }> }>;
  }>,
): string[] {
  const urls = new Set<string>();

  for (const record of records) {
    for (const image of record.model.images ?? []) {
      if (image.url.trim()) {
        urls.add(image.url.trim());
      }
    }

    for (const variant of record.variants) {
      for (const image of variant.images ?? []) {
        if (image.url.trim()) {
          urls.add(image.url.trim());
        }
      }
    }
  }

  return [...urls];
}
