import { ImageRole } from "@/generated/prisma/client";
import type { CanonicalImage } from "@/modules/import/core/canonical-lure";
import {
  isLocalPublicImagePath,
  isRemoteImageUrl,
} from "@/modules/import/images/persist-import-image";
import {
  findImageByUrl,
  findLureImageBySha256,
  type DbClient,
} from "@/modules/import/persistence/lookups";
import type { ImportSummary } from "@/modules/import/persistence/types";
import { resolveLocalized } from "@/modules/import/persistence/normalize";
import { classifyMediaRole } from "@/modules/import/sync/media-classifier";

async function findExistingImportImage(
  tx: DbClient,
  lureModelId: string,
  image: CanonicalImage,
  lureVariantId: string | null,
) {
  const existingByUrl = await findImageByUrl(
    tx,
    lureModelId,
    image.url,
    lureVariantId,
  );
  if (existingByUrl) {
    return existingByUrl;
  }

  const remoteSource = image.sourcePageUrl?.trim();
  if (remoteSource && isRemoteImageUrl(remoteSource)) {
    const bySource = await tx.image.findFirst({
      where: {
        lureModelId,
        lureVariantId: lureVariantId ?? null,
        deletedAt: null,
        OR: [{ sourceUrl: remoteSource }, { url: remoteSource }],
      },
    });
    if (bySource) {
      return bySource;
    }
  }

  if (image.sha256Hash) {
    return findLureImageBySha256(
      tx,
      lureModelId,
      image.sha256Hash,
      lureVariantId,
    );
  }

  return null;
}

async function modelHasEditorCover(
  tx: DbClient,
  lureModelId: string,
): Promise<boolean> {
  const hero = await tx.image.findFirst({
    where: {
      lureModelId,
      role: ImageRole.HERO,
      deletedAt: null,
    },
    select: { id: true },
  });

  return hero !== null;
}

/** Persist canonical import images onto a lure model or variant. */
export async function ensureImportImages(
  tx: DbClient,
  lureModelId: string,
  images: CanonicalImage[] | undefined,
  lureVariantId: string | null,
  summary: ImportSummary,
  labelPrefix: string,
): Promise<void> {
  const preserveCover = await modelHasEditorCover(tx, lureModelId);

  for (const [index, image] of (images ?? []).entries()) {
    const existing = await findExistingImportImage(
      tx,
      lureModelId,
      image,
      lureVariantId,
    );

    if (existing) {
      if (
        isLocalPublicImagePath(existing.url) &&
        isRemoteImageUrl(image.url)
      ) {
        summary.skipped.push(
          `${labelPrefix} Image metadata skipped (local asset preserved): ${existing.url}`,
        );
        continue;
      }
      summary.skipped.push(`${labelPrefix} Image: ${image.url}`);
      continue;
    }

    let role = classifyMediaRole(image.role);
    if (preserveCover && role === ImageRole.HERO) {
      role = ImageRole.PRODUCT;
      summary.warnings.push(
        `${labelPrefix} Image cover preserved (editor HERO): ${image.url}`,
      );
    }

    const sourceUrl =
      image.sourcePageUrl ??
      (isRemoteImageUrl(image.url) ? image.url : null) ??
      (isLocalPublicImagePath(image.url) ? image.url : null);

    await tx.image.create({
      data: {
        lureModelId,
        lureVariantId,
        url: image.url,
        sourceUrl,
        sha256Hash: image.sha256Hash ?? null,
        mediaAssetId: image.mediaAssetId ?? null,
        mimeType: image.mimeType ?? null,
        widthPx: image.widthPx ?? null,
        heightPx: image.heightPx ?? null,
        altTextEn: image.alt ? resolveLocalized(image.alt, "en") : null,
        altTextTr: image.alt ? resolveLocalized(image.alt, "tr") : null,
        creditEn: image.credit ? resolveLocalized(image.credit, "en") : null,
        creditTr: image.credit ? resolveLocalized(image.credit, "tr") : null,
        copyrightEn: image.copyright
          ? resolveLocalized(image.copyright, "en")
          : null,
        copyrightTr: image.copyright
          ? resolveLocalized(image.copyright, "tr")
          : null,
        role,
        sortOrder: image.sortOrder ?? index,
      },
    });
    summary.created.push(`${labelPrefix} Image: ${image.url}`);
  }
}
