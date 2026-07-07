import { prisma } from "@/lib/prisma";
import { normalizeSpeciesLabel } from "@/modules/taxonomy/lib/normalize-species-label";
import type {
  AiReviewEntityType,
  DuplicateMatch,
  SpeciesSeedInput,
  TechniqueSeedInput,
} from "@/modules/studio/ai-review/types";

function normalize(value: string): string {
  return normalizeSpeciesLabel(value);
}

function similarityPct(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 85;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length > nb.length ? na : nb;
  let matches = 0;
  for (const ch of shorter) {
    if (longer.includes(ch)) matches += 1;
  }
  return Math.round((matches / longer.length) * 70);
}

export async function detectSpeciesDuplicates(
  input: SpeciesSeedInput,
): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];
  const needles = [input.nameTr, input.nameEn, input.scientificName]
    .filter(Boolean)
    .map((v) => v!.trim());

  if (needles.length === 0) return matches;

  const species = await prisma.fishSpecies.findMany({
    where: { deletedAt: null },
    include: {
      aliases: { where: { deletedAt: null } },
    },
  });

  for (const row of species) {
    for (const needle of needles) {
      const n = normalize(needle);
      if (normalize(row.scientificName) === n) {
        matches.push({
          entityType: "SPECIES",
          entityId: row.id,
          label: `${row.nameTr} / ${row.nameEn} (${row.scientificName})`,
          matchedOn: needle,
          matchKind: "scientific_name",
          similarityPct: 100,
        });
        continue;
      }
      if (normalize(row.nameEn) === n || normalize(row.nameTr) === n) {
        matches.push({
          entityType: "SPECIES",
          entityId: row.id,
          label: `${row.nameTr} / ${row.scientificName}`,
          matchedOn: needle,
          matchKind: "preferred_name",
          similarityPct: 100,
        });
        continue;
      }
      for (const alias of row.aliases) {
        if (normalize(alias.alias) === n) {
          matches.push({
            entityType: "SPECIES",
            entityId: row.id,
            label: `${row.nameEn} — alias "${alias.alias}"`,
            matchedOn: needle,
            matchKind: "alias",
            similarityPct: 95,
          });
        }
      }
      for (const field of [row.slugEn, row.slugTr, row.slug]) {
        if (normalize(field) === n) {
          matches.push({
            entityType: "SPECIES",
            entityId: row.id,
            label: row.nameEn,
            matchedOn: needle,
            matchKind: "slug",
            similarityPct: 100,
          });
        }
      }
      const sim = Math.max(
        similarityPct(needle, row.nameEn),
        similarityPct(needle, row.nameTr),
        similarityPct(needle, row.scientificName),
      );
      if (sim >= 80) {
        matches.push({
          entityType: "SPECIES",
          entityId: row.id,
          label: `${row.nameEn} (${row.scientificName})`,
          matchedOn: needle,
          matchKind: "similarity",
          similarityPct: sim,
        });
      }
    }
  }

  const seen = new Set<string>();
  return matches.filter((m) => {
    const key = `${m.entityId}:${m.matchKind}:${m.matchedOn}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function detectTechniqueDuplicates(
  input: TechniqueSeedInput,
): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];
  const needles = [input.nameTr, input.nameEn].filter(Boolean).map((v) => v!.trim());
  if (needles.length === 0) return matches;

  const techniques = await prisma.technique.findMany({
    where: { deletedAt: null },
  });

  for (const row of techniques) {
    for (const needle of needles) {
      const n = normalize(needle);
      if (normalize(row.nameEn) === n || normalize(row.nameTr) === n) {
        matches.push({
          entityType: "TECHNIQUE",
          entityId: row.id,
          label: `${row.nameEn} / ${row.nameTr}`,
          matchedOn: needle,
          matchKind: "preferred_name",
          similarityPct: 100,
        });
      } else if (normalize(row.slug) === n) {
        matches.push({
          entityType: "TECHNIQUE",
          entityId: row.id,
          label: row.nameEn,
          matchedOn: needle,
          matchKind: "slug",
          similarityPct: 100,
        });
      } else {
        const sim = Math.max(
          similarityPct(needle, row.nameEn),
          similarityPct(needle, row.nameTr),
        );
        if (sim >= 80) {
          matches.push({
            entityType: "TECHNIQUE",
            entityId: row.id,
            label: row.nameEn,
            matchedOn: needle,
            matchKind: "similarity",
            similarityPct: sim,
          });
        }
      }
    }
  }

  return matches;
}

export async function detectManufacturerDuplicates(input: {
  nameEn?: string;
  nameTr?: string;
}): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];
  const needles = [input.nameEn, input.nameTr].filter(Boolean).map((v) => v!.trim());
  if (needles.length === 0) return matches;

  const rows = await prisma.manufacturer.findMany({ where: { deletedAt: null } });
  for (const row of rows) {
    for (const needle of needles) {
      const n = normalize(needle);
      if (normalize(row.nameEn) === n || normalize(row.slug) === n) {
        matches.push({
          entityType: "MANUFACTURER",
          entityId: row.id,
          label: row.nameEn,
          matchedOn: needle,
          matchKind: "preferred_name",
          similarityPct: 100,
        });
      }
    }
  }
  return matches;
}

export async function detectRegionDuplicates(input: {
  nameEn?: string;
  nameTr?: string;
  code?: string;
}): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];
  const regions = await prisma.region.findMany();
  for (const row of regions) {
    for (const [needle, kind] of [
      [input.code, "slug"] as const,
      [input.nameEn, "preferred_name"] as const,
      [input.nameTr, "preferred_name"] as const,
    ]) {
      if (!needle?.trim()) continue;
      const n = normalize(needle);
      if (normalize(row.code) === n || normalize(row.nameEn) === n || normalize(row.nameTr) === n) {
        matches.push({
          entityType: "REGION",
          entityId: row.id,
          label: `${row.nameEn} (${row.code})`,
          matchedOn: needle,
          matchKind: kind,
          similarityPct: 100,
        });
      }
    }
  }
  return matches;
}

export async function detectDuplicates(
  entityType: AiReviewEntityType,
  input: Record<string, unknown>,
): Promise<DuplicateMatch[]> {
  switch (entityType) {
    case "SPECIES":
      return detectSpeciesDuplicates(input as SpeciesSeedInput);
    case "TECHNIQUE":
      return detectTechniqueDuplicates(input as TechniqueSeedInput);
    case "MANUFACTURER":
      return detectManufacturerDuplicates(input as { nameEn?: string; nameTr?: string });
    case "REGION":
      return detectRegionDuplicates(input as { nameEn?: string; nameTr?: string; code?: string });
    default:
      return [];
  }
}
