import type { StudioReviewEntityType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { QualityCheckItem } from "@/modules/studio/ai-review/lib/quality-report";

function graphWarn(
  id: string,
  label: string,
  detail: string,
  weight = 1,
  category: QualityCheckItem["category"] = "relationships",
): QualityCheckItem {
  return { id, label, status: "warn", category, detail, weight };
}

function graphPass(
  id: string,
  label: string,
  detail?: string,
  weight = 1,
  category: QualityCheckItem["category"] = "relationships",
): QualityCheckItem {
  return { id, label, status: "pass", category, detail, weight };
}

function graphFail(
  id: string,
  label: string,
  detail: string,
  weight = 1,
  category: QualityCheckItem["category"] = "relationships",
): QualityCheckItem {
  return { id, label, status: "fail", category, detail, weight };
}

/** Analyze connected entities in the TrollMatch knowledge graph. */
export async function analyzeKnowledgeGraph(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<QualityCheckItem[]> {
  const checks = await analyzeGraphForEntity(entityType, entityId);
  const integrity = await analyzeGraphIntegrity(entityType, entityId);
  return [...checks, ...integrity];
}

async function analyzeGraphForEntity(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<QualityCheckItem[]> {
  switch (entityType) {
    case "SPECIES":
      return analyzeSpeciesGraph(entityId);
    case "LURE":
      return analyzeLureGraph(entityId);
    case "TECHNIQUE":
      return analyzeTechniqueGraph(entityId);
    case "MANUFACTURER":
      return analyzeManufacturerGraph(entityId);
    case "REGION":
      return analyzeRegionGraph(entityId);
    case "CATCH_REPORT":
      return analyzeCatchReportGraph(entityId);
    case "KNOWLEDGE_SOURCE":
      return analyzeKnowledgeSourceGraph(entityId);
    default:
      return [];
  }
}

async function analyzeSpeciesGraph(entityId: string): Promise<QualityCheckItem[]> {
  const species = await prisma.fishSpecies.findUnique({
    where: { id: entityId },
    include: {
      techniqueLinks: { where: { deletedAt: null }, include: { technique: true } },
      lureLinks: { where: { deletedAt: null }, include: { lureModel: true } },
      regionLinks: { include: { region: true } },
      catchReports: { where: { verificationStatus: "APPROVED", mergedIntoId: null }, take: 1 },
      knowledgeItems: { where: { status: "APPROVED" as const }, take: 1 },
    },
  });
  if (!species) return [];

  const name = species.nameEn || species.nameTr;
  const checks: QualityCheckItem[] = [];

  if (species.techniqueLinks.length === 0) {
    checks.push(
      graphWarn("graph.techniques", "Techniques", `${name} has no linked techniques in graph`),
    );
  } else {
    checks.push(
      graphPass("graph.techniques", "Techniques", `${species.techniqueLinks.length} linked`),
    );
  }

  if (species.lureLinks.length === 0) {
    checks.push(graphWarn("graph.lures", "Lures", `${name} has no compatible lure`));
  } else {
    checks.push(graphPass("graph.lures", "Lures", `${species.lureLinks.length} catalog links`));
  }

  if (species.regionLinks.length === 0) {
    checks.push(graphWarn("graph.regions", "Regions", `${name} has no distribution regions`));
  } else {
    checks.push(graphPass("graph.regions", "Regions", `${species.regionLinks.length} regions`));
  }

  if (species.catchReports.length === 0) {
    checks.push(
      graphWarn(
        "graph.catchReports",
        "Catch reports",
        `${name} has no approved catch report`,
        1,
        "knowledge",
      ),
    );
  } else {
    checks.push(
      graphPass("graph.catchReports", "Catch reports", "Approved reports exist", 1, "knowledge"),
    );
  }

  if (species.knowledgeItems.length === 0) {
    checks.push(
      graphWarn(
        "graph.knowledge",
        "Knowledge sources",
        `${name} has no linked knowledge sources`,
        1,
        "knowledge",
      ),
    );
  } else {
    checks.push(
      graphPass("graph.knowledge", "Knowledge sources", "Sources linked", 1, "knowledge"),
    );
  }

  return checks;
}

async function analyzeLureGraph(entityId: string): Promise<QualityCheckItem[]> {
  const lure = await prisma.lureModel.findUnique({
    where: { id: entityId },
    include: {
      manufacturer: true,
      productLine: true,
      variants: { where: { deletedAt: null } },
      lureTechniques: { where: { deletedAt: null } },
      lureSpeciesLinks: { where: { deletedAt: null } },
    },
  });
  if (!lure) return [];

  const name = lure.nameEn;
  const checks: QualityCheckItem[] = [
    graphPass("graph.manufacturer", "Manufacturer", lure.manufacturer.nameEn),
    graphPass("graph.productLine", "Product line", lure.productLine.nameEn),
  ];

  if (lure.lureTechniques.length === 0) {
    checks.push(graphWarn("graph.techniques", "Techniques", `${name} has no technique links`));
  } else {
    checks.push(graphPass("graph.techniques", "Techniques", `${lure.lureTechniques.length} linked`));
  }

  if (lure.lureSpeciesLinks.length === 0) {
    checks.push(graphWarn("graph.species", "Species", `${name} has no target species links`));
  }

  if (lure.variants.length === 0) {
    checks.push(graphWarn("graph.variants", "Variants", `${name} has no variants in graph`));
  } else {
    checks.push(graphPass("graph.variants", "Variants", `${lure.variants.length} variants`));
  }

  return checks;
}

async function analyzeTechniqueGraph(entityId: string): Promise<QualityCheckItem[]> {
  const technique = await prisma.technique.findUnique({
    where: { id: entityId },
    include: {
      speciesTechniques: { where: { deletedAt: null } },
      lureTechniques: { where: { deletedAt: null } },
      catchReports: { where: { verificationStatus: "APPROVED" }, take: 1 },
      parent: { select: { id: true, nameEn: true } },
    },
  });
  if (!technique) return [];

  const name = technique.nameEn;
  const checks: QualityCheckItem[] = [];

  if (technique.speciesTechniques.length === 0) {
    checks.push(graphWarn("graph.species", "Target species", `${name} has zero linked species`));
  } else {
    checks.push(
      graphPass("graph.species", "Target species", `${technique.speciesTechniques.length} linked`),
    );
  }

  if (technique.lureTechniques.length === 0) {
    checks.push(graphWarn("graph.lures", "Compatible lures", `${name} has no lure links`));
  }

  if (technique.catchReports.length === 0) {
    checks.push(
      graphWarn("graph.catchReports", "Catch reports", `${name} has no field evidence`, 1, "knowledge"),
    );
  }

  if (technique.parentId && technique.parent?.id === entityId) {
    checks.push(graphFail("graph.circular", "Circular reference", `${name} references itself as parent`));
  }

  return checks;
}

async function analyzeManufacturerGraph(entityId: string): Promise<QualityCheckItem[]> {
  const m = await prisma.manufacturer.findUnique({
    where: { id: entityId },
    include: { lureModels: { where: { deletedAt: null }, take: 5 } },
  });
  if (!m) return [];

  const checks: QualityCheckItem[] = [];
  if (m.lureModels.length === 0) {
    checks.push(graphWarn("graph.products", "Products", `${m.nameEn} has no lure models in catalog`));
  } else {
    checks.push(graphPass("graph.products", "Products", `${m.lureModels.length}+ models`));
  }

  if (m.lureModels.length > 0 && !m.logoUrl) {
    checks.push(
      graphWarn("graph.logo", "Brand media", `${m.nameEn} has products but no logo`, 1, "media"),
    );
  }

  return checks;
}

async function analyzeRegionGraph(entityId: string): Promise<QualityCheckItem[]> {
  const region = await prisma.region.findUnique({
    where: { id: entityId },
    include: {
      speciesLinks: { include: { fishSpecies: { select: { profile: { select: { lifecycleState: true } } } } } },
    },
  });
  if (!region) return [];

  const published = region.speciesLinks.filter(
    (link) => link.fishSpecies.profile?.lifecycleState === "PUBLISHED",
  );

  if (region.speciesLinks.length === 0) {
    return [graphWarn("graph.species", "Species", `${region.nameEn} has no species assigned`)];
  }

  if (published.length === 0) {
    return [
      graphWarn(
        "graph.publishedSpecies",
        "Published species",
        `${region.nameEn} has no published species`,
      ),
    ];
  }

  return [
    graphPass("graph.species", "Species", `${region.speciesLinks.length} species`),
    graphPass("graph.publishedSpecies", "Published species", `${published.length} published`),
  ];
}

async function analyzeCatchReportGraph(entityId: string): Promise<QualityCheckItem[]> {
  const report = await prisma.catchReport.findUnique({
    where: { id: entityId },
    include: {
      fishSpecies: { select: { nameEn: true } },
      lureVariant: { select: { labelEn: true, lureModel: { select: { nameEn: true } } } },
      technique: { select: { nameEn: true } },
    },
  });
  if (!report) return [];

  const checks: QualityCheckItem[] = [
    graphPass("graph.species", "Species", report.fishSpecies.nameEn),
    graphPass("graph.lure", "Lure", `${report.lureVariant.lureModel.nameEn} · ${report.lureVariant.labelEn}`),
  ];
  if (!report.techniqueId) {
    checks.push(
      graphWarn("graph.technique", "Technique", "Required for Species → Technique → Lure chain"),
    );
  } else {
    checks.push(graphPass("graph.technique", "Technique", report.technique?.nameEn));
  }
  return checks;
}

async function analyzeKnowledgeSourceGraph(entityId: string): Promise<QualityCheckItem[]> {
  const source = await prisma.knowledgeSource.findUnique({
    where: { id: entityId },
    include: { items: { where: { status: "APPROVED" }, take: 1 } },
  });
  if (!source) return [];

  if (source.items.length === 0) {
    return [
      graphWarn(
        "graph.knowledgeLinks",
        "Knowledge links",
        `${source.nameEn} is not linked to any catalog entity`,
        1,
        "knowledge",
      ),
    ];
  }

  return [
    graphPass("graph.knowledgeLinks", "Knowledge links", "Linked to catalog entities", 1, "knowledge"),
  ];
}

/** Detect broken foreign keys, orphans, and circular references. */
async function analyzeGraphIntegrity(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<QualityCheckItem[]> {
  switch (entityType) {
    case "LURE_VARIANT": {
      const variant = await prisma.lureVariant.findUnique({
        where: { id: entityId },
        include: { lureModel: { select: { deletedAt: true, nameEn: true } } },
      });
      if (!variant) return [graphFail("integrity.orphan", "Orphan record", "Variant not found")];
      if (variant.lureModel.deletedAt) {
        return [
          graphFail(
            "integrity.brokenFk",
            "Broken foreign key",
            `Variant orphaned — parent lure ${variant.lureModel.nameEn} is archived`,
          ),
        ];
      }
      return [graphPass("integrity.parent", "Parent lure", variant.lureModel.nameEn)];
    }
    case "TECHNIQUE": {
      const technique = await prisma.technique.findUnique({
        where: { id: entityId },
        select: { parentId: true, nameEn: true },
      });
      if (!technique?.parentId) return [];
      const parent = await prisma.technique.findUnique({
        where: { id: technique.parentId },
        select: { parentId: true, nameEn: true },
      });
      if (!parent) {
        return [
          graphFail(
            "integrity.brokenFk",
            "Broken foreign key",
            `${technique.nameEn} parent technique missing`,
          ),
        ];
      }
      if (parent.parentId === entityId) {
        return [
          graphFail(
            "integrity.circular",
            "Circular reference",
            `${technique.nameEn} ↔ ${parent.nameEn} circular hierarchy`,
          ),
        ];
      }
      return [];
    }
    case "CATCH_REPORT": {
      const report = await prisma.catchReport.findUnique({
        where: { id: entityId },
        select: { fishSpeciesId: true, lureVariantId: true, mergedIntoId: true },
      });
      if (!report) return [];
      if (report.mergedIntoId) {
        return [graphWarn("integrity.merged", "Merged report", "Report merged into another record")];
      }
      const [species, variant] = await Promise.all([
        prisma.fishSpecies.findUnique({ where: { id: report.fishSpeciesId }, select: { deletedAt: true } }),
        prisma.lureVariant.findUnique({ where: { id: report.lureVariantId }, select: { deletedAt: true } }),
      ]);
      if (!species || species.deletedAt) {
        return [graphFail("integrity.brokenFk", "Broken foreign key", "Linked species missing or archived")];
      }
      if (!variant || variant.deletedAt) {
        return [graphFail("integrity.brokenFk", "Broken foreign key", "Linked lure variant missing or archived")];
      }
      return [];
    }
    default:
      return [];
  }
}
