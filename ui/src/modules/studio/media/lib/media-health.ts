import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { MediaAssetVariantKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isRemoteImageUrl } from "@/modules/import/images/persist-import-image";
import {
  hashFromPublicMediaPath,
  resolvePublicImagePath,
} from "@/modules/studio/media/lib/media-asset-service";
import { isPublishedLifecycle } from "@/modules/studio/media/lib/media-storage-status";
import { variantPathFromOriginal } from "@/modules/studio/media/lib/media-processor";
import type { QualityCheckItem } from "@/modules/studio/ai-review/lib/quality-report";

function warn(
  id: string,
  label: string,
  detail: string,
): QualityCheckItem {
  return {
    id,
    label,
    status: "warn",
    category: "media",
    weight: 1,
    detail,
  };
}

function fail(
  id: string,
  label: string,
  detail: string,
): QualityCheckItem {
  return {
    id,
    label,
    status: "fail",
    category: "media",
    weight: 2,
    detail,
  };
}

async function fileExists(publicPath: string): Promise<boolean> {
  const relative = publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
  try {
    await access(join(process.cwd(), "public", relative), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function checkMediaAssetHealth(input: {
  url: string;
  sourceUrl?: string | null;
  sha256Hash?: string | null;
  mediaAssetId?: string | null;
  role?: string;
  copyrightEn?: string | null;
  copyrightTr?: string | null;
  entityLabel?: string;
  /** When false, remote manufacturer URLs are acceptable (draft import). */
  requireLocalMedia?: boolean;
}): Promise<QualityCheckItem[]> {
  const checks: QualityCheckItem[] = [];
  const label = input.entityLabel ?? "Image";
  const requireLocal = input.requireLocalMedia ?? true;

  if (isRemoteImageUrl(input.url)) {
    if (requireLocal) {
      checks.push(
        fail(
          "remote-url",
          `${label}: external URL in published catalog`,
          "Published products must use local Media Library assets — download media before publishing",
        ),
      );
    }
    return checks;
  }

  const asset = input.mediaAssetId
    ? await prisma.mediaAsset.findUnique({
        where: { id: input.mediaAssetId },
        include: { variants: true },
      })
    : input.sha256Hash
      ? await prisma.mediaAsset.findUnique({
          where: { sha256Hash: input.sha256Hash },
          include: { variants: true },
        })
      : null;

  if (!asset && input.url.startsWith("/media/") && requireLocal) {
    checks.push(
      warn(
        "missing-media-asset",
        `${label}: not linked to Media Library`,
        "Local file exists but no MediaAsset record — run backfill:media-assets",
      ),
    );
  }

  const originalPath = asset
    ? (asset.variants.find((v) => v.kind === MediaAssetVariantKind.ORIGINAL)
        ?.publicPath ?? input.url)
    : input.url;

  if (!(await fileExists(originalPath))) {
    if (requireLocal) {
      checks.push(
        fail("broken-file", `${label}: file missing on disk`, originalPath),
      );
    }
    return checks;
  }

  const variantKinds = new Set(asset?.variants.map((v) => v.kind) ?? []);
  const hash = asset?.sha256Hash ?? hashFromPublicMediaPath(originalPath);

  if (requireLocal && hash && !variantKinds.has(MediaAssetVariantKind.THUMBNAIL)) {
    const thumbPath = variantPathFromOriginal(
      `/media/${hash}.jpg`,
      MediaAssetVariantKind.THUMBNAIL,
    ).replace(".jpg", "-thumb.webp");
    if (!(await fileExists(thumbPath))) {
      checks.push(
        warn("missing-thumbnail", `${label}: thumbnail missing`, thumbPath),
      );
    }
  }

  if (requireLocal && hash && !variantKinds.has(MediaAssetVariantKind.WEBP)) {
    const webpPath = `/media/${hash}.webp`;
    if (!(await fileExists(webpPath))) {
      checks.push(
        warn("missing-webp", `${label}: WebP variant missing`, webpPath),
      );
    }
  }

  if (!input.copyrightEn?.trim() && !input.copyrightTr?.trim()) {
    checks.push(
      warn(
        "missing-copyright",
        `${label}: copyright attribution missing`,
        "Add manufacturer copyright when available",
      ),
    );
  }

  return checks;
}

export async function checkLureMediaHealth(lureModelId: string): Promise<QualityCheckItem[]> {
  const lure = await prisma.lureModel.findUnique({
    where: { id: lureModelId },
    include: {
      images: { where: { deletedAt: null } },
    },
  });
  if (!lure) return [];

  const requireLocalMedia = isPublishedLifecycle(lure.lifecycleState);
  const checks: QualityCheckItem[] = [];
  const hasHero = lure.images.some((image) => image.role === "HERO");
  if (!hasHero) {
    checks.push(
      warn(
        "missing-hero",
        "Product cover (HERO) not selected",
        "Editor should choose a cover image in Studio",
      ),
    );
  }

  const hashCounts = new Map<string, number>();
  for (const image of lure.images) {
    const hash = image.sha256Hash ?? hashFromPublicMediaPath(image.url);
    if (hash) {
      hashCounts.set(hash, (hashCounts.get(hash) ?? 0) + 1);
    }
    checks.push(
      ...(await checkMediaAssetHealth({
        url: resolvePublicImagePath(image.url),
        sourceUrl: image.sourceUrl,
        sha256Hash: image.sha256Hash,
        mediaAssetId: image.mediaAssetId,
        role: image.role,
        copyrightEn: image.copyrightEn,
        copyrightTr: image.copyrightTr,
        entityLabel: `Image (${image.role})`,
        requireLocalMedia,
      })),
    );
  }

  for (const [hash, count] of hashCounts) {
    if (count > 1) {
      checks.push(
        warn(
          `duplicate-${hash.slice(0, 8)}`,
          "Duplicate images on product",
          `SHA-256 ${hash.slice(0, 12)}… appears ${count} times`,
        ),
      );
    }
  }

  return checks;
}

export async function countMediaAssetReferences(
  mediaAssetId: string,
): Promise<number> {
  const [lure, species, manufacturer, technology] = await Promise.all([
    prisma.image.count({ where: { mediaAssetId, deletedAt: null } }),
    prisma.speciesImage.count({ where: { mediaAssetId, deletedAt: null } }),
    prisma.manufacturerImage.count({ where: { mediaAssetId, deletedAt: null } }),
    prisma.technologyImage.count({ where: { mediaAssetId } }),
  ]);
  return lure + species + manufacturer + technology;
}
