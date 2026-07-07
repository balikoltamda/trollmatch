import type { CanonicalTechnologyRef } from "@/modules/import/core/canonical-lure";
import type { DbClient } from "@/modules/import/persistence/lookups";
import { resolveLocalized } from "@/modules/import/persistence/normalize";
import type { ImportSummary } from "@/modules/import/persistence/types";
import type { Prisma } from "@/generated/prisma/client";

export async function ensureTechnologyLinks(
  tx: DbClient,
  manufacturerId: string,
  lureModelId: string,
  technologies: CanonicalTechnologyRef[] | undefined,
  summary: ImportSummary,
): Promise<void> {
  if (!technologies?.length) return;

  for (const [index, tech] of technologies.entries()) {
    const existing = await tx.manufacturerTechnology.findUnique({
      where: {
        manufacturerId_slug: {
          manufacturerId,
          slug: tech.slug,
        },
      },
    });

    let technologyId = existing?.id;

    if (existing) {
      const descriptionEn = tech.description ? resolveLocalized(tech.description, "en") : null;
      const descriptionTr = tech.description ? resolveLocalized(tech.description, "tr") : null;

      if (
        (descriptionEn && !existing.descriptionEn) ||
        (descriptionTr && !existing.descriptionTr)
      ) {
        await tx.manufacturerTechnology.update({
          where: { id: existing.id },
          data: {
            descriptionEn: existing.descriptionEn ?? descriptionEn,
            descriptionTr: existing.descriptionTr ?? descriptionTr,
          },
        });
        summary.updated.push(`Technology: ${tech.slug}`);
      } else {
        summary.skipped.push(`Technology: ${tech.slug}`);
      }
    } else {
      const created = await tx.manufacturerTechnology.create({
        data: {
          manufacturerId,
          slug: tech.slug,
          nameEn: resolveLocalized(tech.name, "en") || tech.slug,
          descriptionEn: tech.description ? resolveLocalized(tech.description, "en") : null,
          descriptionTr: tech.description ? resolveLocalized(tech.description, "tr") : null,
        },
      });
      technologyId = created.id;
      summary.created.push(`Technology: ${tech.slug}`);
    }

    const link = await tx.lureModelTechnology.findUnique({
      where: {
        lureModelId_technologyId: {
          lureModelId,
          technologyId: technologyId!,
        },
      },
    });

    if (!link) {
      await tx.lureModelTechnology.create({
        data: {
          lureModelId,
          technologyId: technologyId!,
          sortOrder: index,
        },
      });
      summary.created.push(`TechnologyLink: ${tech.slug}`);
    }
  }
}

export function buildImportSpecMetadata(model: {
  hooks?: Array<Record<string, unknown>>;
  splitRings?: Array<Record<string, unknown>>;
  manufacturerNotes?: { en?: string; tr?: string; default?: string };
  featureBlocks?: Array<Record<string, unknown>>;
  castingRanges?: string[];
  videos?: Array<Record<string, unknown>>;
  downloads?: Array<Record<string, unknown>>;
  editorialRelationshipHints?: Record<string, unknown>;
}): Prisma.InputJsonValue | undefined {
  const payload: Record<string, unknown> = {};
  if (model.hooks?.length) payload.hooks = model.hooks;
  if (model.splitRings?.length) payload.splitRings = model.splitRings;
  if (model.featureBlocks?.length) payload.featureBlocks = model.featureBlocks;
  if (model.castingRanges?.length) payload.castingRanges = model.castingRanges;
  if (model.videos?.length) payload.videos = model.videos;
  if (model.downloads?.length) payload.downloads = model.downloads;
  if (model.editorialRelationshipHints) {
    payload.editorialRelationshipHints = model.editorialRelationshipHints;
  }
  const notes =
    model.manufacturerNotes?.default ??
    model.manufacturerNotes?.en ??
    model.manufacturerNotes?.tr;
  if (notes) payload.manufacturerNotes = model.manufacturerNotes;
  return Object.keys(payload).length > 0 ? (payload as Prisma.InputJsonValue) : undefined;
}
