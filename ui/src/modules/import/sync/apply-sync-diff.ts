import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import { ensureTechnique } from "@/modules/import/persistence/lookups";
import { ensureTechnologyLinks } from "@/modules/import/persistence/technology-persister";
import { isRemoteImageUrl } from "@/modules/import/images/persist-import-image";
import {
  imageRoleFromDiffLabel,
} from "@/modules/import/sync/media-classifier";

const DECIMAL_FIELDS = new Set([
  "divingDepthMinM",
  "divingDepthMaxM",
  "trollingSpeedMinKn",
  "trollingSpeedMaxKn",
]);

type SyncApplyTx = Pick<
  PrismaClient,
  | "lureModel"
  | "lureTechnique"
  | "image"
  | "fishSpecies"
  | "lureSpecies"
  | "manufacturerTechnology"
  | "lureModelTechnology"
>;

/** Apply an accepted manufacturer sync diff row. */
export async function applyAcceptedSyncDiff(
  tx: SyncApplyTx,
  diff: {
    fieldKey: string;
    fieldLabel: string;
    newValue: string | null;
    sourceUrl?: string | null;
    mediaAssetId?: string | null;
    mimeType?: string | null;
    widthPx?: number | null;
    heightPx?: number | null;
    lureModelId: string;
    manufacturerId: string;
  },
): Promise<void> {
  const {
    fieldKey,
    fieldLabel,
    newValue,
    sourceUrl,
    lureModelId,
    manufacturerId,
    mimeType,
    widthPx,
    heightPx,
  } = diff;
  if (!newValue) return;

  if (fieldKey.startsWith("sync:img:")) {
    const remoteSource = sourceUrl ?? newValue;
    const existing = await tx.image.findFirst({
      where: {
        lureModelId,
        deletedAt: null,
        OR: [{ url: newValue }, { sourceUrl: remoteSource }, { url: remoteSource }],
      },
    });
    if (!existing) {
      const role = imageRoleFromDiffLabel(fieldLabel);
      const hasHero = await tx.image.findFirst({
        where: { lureModelId, role: "HERO", deletedAt: null },
      });
      await tx.image.create({
        data: {
          lureModelId,
          url: newValue,
          sourceUrl: isRemoteImageUrl(remoteSource) ? remoteSource : newValue,
          mediaAssetId: diff.mediaAssetId ?? null,
          mimeType: mimeType ?? null,
          widthPx: widthPx ?? null,
          heightPx: heightPx ?? null,
          role: role === "HERO" && hasHero ? "PRODUCT" : role,
        },
      });
    } else if (isRemoteImageUrl(remoteSource)) {
      await tx.image.update({
        where: { id: existing.id },
        data: {
          url: newValue,
          sourceUrl: remoteSource,
          ...(mimeType !== undefined ? { mimeType } : {}),
          ...(widthPx !== undefined ? { widthPx } : {}),
          ...(heightPx !== undefined ? { heightPx } : {}),
        },
      });
    }
    return;
  }

  if (fieldKey.startsWith("sync:var:")) {
    return;
  }

  if (fieldKey.startsWith("sync:media:") || fieldKey.startsWith("sync:dl:")) {
    return;
  }

  if (fieldKey.startsWith("sync:tech:")) {
    const slug = newValue;
    await ensureTechnologyLinks(
      tx as unknown as Parameters<typeof ensureTechnologyLinks>[0],
      manufacturerId,
      lureModelId,
      [{ slug, name: { en: slug, default: slug } }],
      { created: [], updated: [], skipped: [], warnings: [], errors: [], removed: [] },
    );
    return;
  }

  if (fieldKey.startsWith("sync:rel:technique:")) {
    const slug = newValue;
    const techniqueId = await ensureTechnique(
      tx as unknown as Parameters<typeof ensureTechnique>[0],
      slug,
    );
    const link = await tx.lureTechnique.findFirst({
      where: { lureModelId, techniqueId, deletedAt: null },
    });
    if (!link) {
      await tx.lureTechnique.create({ data: { lureModelId, techniqueId } });
    }
    return;
  }

  if (fieldKey.startsWith("sync:rel:species:")) {
    const species = await tx.fishSpecies.findFirst({
      where: { slug: newValue, deletedAt: null },
    });
    if (species) {
      const link = await tx.lureSpecies.findFirst({
        where: { lureModelId, fishSpeciesId: species.id, deletedAt: null },
      });
      if (!link) {
        await tx.lureSpecies.create({
          data: {
            lureModelId,
            fishSpeciesId: species.id,
            associationKind: "MANUFACTURER_MARKETING",
          },
        });
      }
    }
    return;
  }

  if (fieldKey.startsWith("seo:") || !fieldKey.includes(":")) {
    const modelField = fieldKey.replace(/^seo:/, "");
    const value = DECIMAL_FIELDS.has(modelField)
      ? new Prisma.Decimal(newValue)
      : newValue;
    await tx.lureModel.update({
      where: { id: lureModelId },
      data: { [modelField]: value } as Prisma.LureModelUpdateInput,
    });
  }
}

export function isModelFieldKey(fieldKey: string): boolean {
  return !fieldKey.startsWith("sync:") && !fieldKey.startsWith("seo:");
}

export function coerceModelFieldValue(
  fieldKey: string,
  newValue: string,
): string | Prisma.Decimal {
  return DECIMAL_FIELDS.has(fieldKey) ? new Prisma.Decimal(newValue) : newValue;
}
