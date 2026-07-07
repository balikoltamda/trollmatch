import type { StudioReviewEntityType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { QualityCheckItem, ScoreCategory } from "@/modules/studio/ai-review/lib/quality-report";
import { checkLureMediaHealth } from "@/modules/studio/media/lib/media-health";

function pass(
  id: string,
  label: string,
  weight = 1,
  detail?: string,
  category: ScoreCategory = "editorial",
): QualityCheckItem {
  return { id, label, status: "pass", category, weight, detail };
}

function warn(
  id: string,
  label: string,
  weight = 1,
  detail?: string,
  category: ScoreCategory = "editorial",
): QualityCheckItem {
  return { id, label, status: "warn", category, weight, detail };
}

function fail(
  id: string,
  label: string,
  weight = 1,
  detail?: string,
  category: ScoreCategory = "editorial",
): QualityCheckItem {
  return { id, label, status: "fail", category, weight, detail };
}

function checkText(
  value: string | null | undefined,
  id: string,
  label: string,
  weight = 1,
  category: ScoreCategory = "editorial",
) {
  return value?.trim()
    ? pass(id, label, weight, undefined, category)
    : warn(id, label, weight, "Missing value", category);
}

async function validateSpeciesEntity(entityId: string): Promise<QualityCheckItem[]> {
  const species = await prisma.fishSpecies.findUnique({
    where: { id: entityId },
    include: {
      profile: true,
      editorNote: true,
      aliases: { where: { deletedAt: null } },
      confusions: true,
      regionLinks: true,
      techniqueLinks: { where: { deletedAt: null } },
      images: { where: { deletedAt: null } },
    },
  });
  if (!species) return [fail("entity", "Species record", 5, "Entity not found")];

  const checks: QualityCheckItem[] = [
    checkText(species.scientificName, "scientific", "Scientific taxonomy verified", 3, "scientific"),
    checkText(species.nameTr, "nameTr", "Turkish localization complete", 2, "localization"),
    checkText(species.nameEn, "nameEn", "English localization complete", 2, "localization"),
    species.aliases.length > 0
      ? pass("aliases", "Search aliases present", 1, undefined, "seo")
      : warn("aliases", "Search aliases", 1, "Add aliases for search coverage", "seo"),
    species.confusions.length > 0
      ? pass("confusions", "Species confusions documented", 1, undefined, "scientific")
      : warn("confusions", "Species confusions", 1, "Document common misidentifications", "scientific"),
    species.regionLinks.length > 0
      ? pass("regions", "Distribution regions linked", 2, undefined, "relationships")
      : warn("regions", "Distribution regions", 2, "Missing region links", "relationships"),
    species.techniqueLinks.length > 0
      ? pass("techniques", "Fishing techniques linked", 2, undefined, "relationships")
      : warn("techniques", "Fishing techniques", 2, "Missing technique links", "relationships"),
    checkText(species.profile?.habitatEn ?? species.profile?.habitatTr, "habitat", "Habitat documented", 1, "scientific"),
    species.profile?.maxLengthCm
      ? pass("maxLength", "Maximum length", 1)
      : warn("maxLength", "Maximum length", 1),
    species.profile?.maxWeightG
      ? pass("maxWeight", "Maximum weight", 1)
      : warn("maxWeight", "Maximum weight", 1),
    species.profile?.depthMinM != null || species.profile?.depthMaxM != null
      ? pass("depth", "Depth range", 1)
      : warn("depth", "Depth range", 1),
    checkText(species.profile?.iucnStatus, "iucn", "IUCN status", 1, "scientific"),
    checkText(species.profile?.descriptionEn, "descEn", "Public description (EN)", 2, "localization"),
    checkText(species.profile?.descriptionTr, "descTr", "Public description (TR)", 2, "localization"),
    checkText(species.slugEn, "slugEn", "Canonical slug (EN)", 2, "seo"),
    checkText(species.slugTr, "slugTr", "Canonical slug (TR)", 1, "seo"),
    species.editorNote?.internalNotes?.trim()
      ? pass("editorNotes", "Editor notes", 1, undefined, "editorial")
      : warn("editorNotes", "Editor notes", 1, undefined, "editorial"),
  ];

  const hero = species.images.find((img) => img.role === "HERO");
  checks.push(
    hero ? pass("hero", "Hero image", 2, undefined, "media") : warn("hero", "Missing hero image", 2, undefined, "media"),
    species.images.filter((img) => img.role === "GALLERY").length > 0
      ? pass("gallery", "Gallery images", 1, undefined, "media")
      : warn("gallery", "Missing gallery", 1, undefined, "media"),
    hero?.creditEn || hero?.creditTr
      ? pass("credits", "Photo credits", 1, undefined, "media")
      : warn("credits", "Photo credits", 1, undefined, "media"),
    hero?.copyrightEn || hero?.copyrightTr
      ? pass("copyright", "Copyright metadata", 1, undefined, "media")
      : warn("copyright", "Copyright metadata", 1, undefined, "media"),
  );

  if (species.profile?.lifecycleState === "PUBLISHED" && !hero) {
    checks.push(fail("publishMedia", "Publish readiness — media", 3, "Published species needs hero image", "media"));
  }

  const hasOgBasics =
    Boolean(species.profile?.descriptionEn?.trim()) &&
    Boolean(species.slugEn?.trim()) &&
    Boolean(hero);
  checks.push(
    hasOgBasics
      ? pass("openGraph", "OpenGraph metadata", 1, undefined, "seo")
      : warn("openGraph", "OpenGraph metadata", 1, "Needs description, slug, and hero image", "seo"),
  );

  const hasStructuredData =
    Boolean(species.scientificName?.trim()) &&
    Boolean(species.slugEn?.trim()) &&
    Boolean(species.profile?.descriptionEn?.trim());
  checks.push(
    hasStructuredData
      ? pass("structuredData", "Structured data", 1, undefined, "seo")
      : warn("structuredData", "Structured data", 1, "Needs scientific name, slug, and description", "seo"),
  );

  const hasLexicon =
    species.aliases.length > 0 && Boolean(species.nameTr?.trim()) && Boolean(species.nameEn?.trim());
  checks.push(
    hasLexicon
      ? pass("lexicon", "Lexicon compliance", 1, undefined, "knowledge")
      : warn("lexicon", "Lexicon compliance", 1, "Add aliases and bilingual names", "knowledge"),
  );

  if (species.slugEn) {
    const dupSlug = await prisma.fishSpecies.count({
      where: { slugEn: species.slugEn, id: { not: species.id }, deletedAt: null },
    });
    checks.push(
      dupSlug === 0
        ? pass("dupSlug", "No duplicate slug", 1, undefined, "seo")
        : fail("dupSlug", "Duplicate slug", 2, `slugEn "${species.slugEn}" already exists`, "seo"),
    );
  }

  return checks;
}

async function validateTechniqueEntity(entityId: string): Promise<QualityCheckItem[]> {
  const technique = await prisma.technique.findUnique({
    where: { id: entityId },
    include: {
      speciesTechniques: { where: { deletedAt: null } },
      lureTechniques: { where: { deletedAt: null } },
    },
  });
  if (!technique) return [fail("entity", "Technique record", 5, "Entity not found")];

  return [
    checkText(technique.nameEn, "nameEn", "English name", 2),
    checkText(technique.nameTr, "nameTr", "Turkish name", 2),
    checkText(technique.slug, "slug", "Canonical slug", 2),
    technique.parentId
      ? pass("hierarchy", "Hierarchy parent linked", 1)
      : warn("hierarchy", "Hierarchy", 1, "No parent technique"),
    technique.speciesTechniques.length > 0
      ? pass("species", "Target species linked", 2)
      : warn("species", "Target species", 2, "Missing species links"),
    technique.lureTechniques.length > 0
      ? pass("lures", "Compatible lure links", 1)
      : warn("lures", "Compatible lure links", 1),
  ];
}

async function validateLureEntity(entityId: string): Promise<QualityCheckItem[]> {
  const lure = await prisma.lureModel.findUnique({
    where: { id: entityId },
    include: {
      manufacturer: true,
      productLine: true,
      variants: { where: { deletedAt: null } },
      lureTechniques: { where: { deletedAt: null } },
      lureSpeciesLinks: { where: { deletedAt: null } },
      technologyLinks: { include: { technology: true } },
      images: { where: { deletedAt: null } },
    },
  });
  if (!lure) return [fail("entity", "Lure model", 5, "Entity not found")];

  const checks: QualityCheckItem[] = [
    pass("manufacturer", "Manufacturer linked", 2, lure.manufacturer.nameEn),
    lure.productLine
      ? pass("productLine", "Product line", 1)
      : warn("productLine", "Product line", 1),
    checkText(lure.nameEn, "model", "Model name", 2),
    lure.nameTr
      ? pass("nameTr", "Model name (TR)", 2)
      : warn("nameTr", "Model name (TR)", 2, "Missing Turkish model label"),
    lure.shortDescriptionEn
      ? pass("shortDescriptionEn", "Short description (EN)", 2)
      : warn("shortDescriptionEn", "Short description (EN)", 2, "Missing editorial short description"),
    lure.shortDescriptionTr
      ? pass("shortDescriptionTr", "Short description (TR)", 2)
      : warn("shortDescriptionTr", "Short description (TR)", 2, "Missing localized short description"),
    lure.divingDepthMinM != null || lure.divingDepthMaxM != null
      ? pass("divingDepth", "Diving depth", 2)
      : warn("divingDepth", "Diving depth", 2, "Missing diving depth"),
    lure.buoyancySlug
      ? pass("buoyancy", "Buoyancy", 1)
      : warn("buoyancy", "Buoyancy", 1, "Missing buoyancy"),
    lure.actionSlug
      ? pass("action", "Action", 1)
      : warn("action", "Action", 1, "Missing action"),
    lure.variants.some((variant) => variant.lengthMm != null)
      ? pass("length", "Length spec", 1)
      : warn("length", "Length spec", 1, "Missing length on variants"),
    lure.variants.some((variant) => variant.weightG != null)
      ? pass("weight", "Weight spec", 1)
      : warn("weight", "Weight spec", 1, "Missing weight on variants"),
    lure.technologyLinks.length > 0
      ? pass("technologies", "Technology links", 2)
      : warn("technologies", "Technology links", 1, "Missing manufacturer technologies"),
    lure.variants.length > 0
      ? pass("variants", "Variants present", 2)
      : warn("variants", "Variants", 2, "No variants"),
    lure.lureTechniques.length > 0
      ? pass("techniques", "Technique links", 2)
      : warn("techniques", "Technique links", 2, "Missing technique links"),
    lure.lureSpeciesLinks.length > 0
      ? pass("species", "Species links", 1)
      : warn("species", "Species links", 1),
    lure.images.length > 0
      ? pass("images", "Product images", 2)
      : warn("images", "Product images", 2, "Missing images"),
    lure.images.some((image) => image.creditEn)
      ? pass("imageCredits", "Image credits", 1)
      : warn("imageCredits", "Image credits", 1, "Missing manufacturer image attribution"),
    lure.shortDescriptionEn && lure.shortDescriptionTr && lure.nameEn && lure.images.length > 0
      ? pass("seo", "SEO readiness", 2)
      : warn("seo", "SEO readiness", 2, "Missing bilingual copy or imagery for publication SEO"),
  ];

  const dupVariants = new Set(lure.variants.map((v) => v.labelEn.toLowerCase()));
  if (dupVariants.size < lure.variants.length) {
    checks.push(warn("dupVariants", "Duplicate variants", 2, "Check variant labels"));
  } else {
    checks.push(pass("dupVariants", "No duplicate variants", 1));
  }

  checks.push(...(await checkLureMediaHealth(entityId)));

  return checks;
}

async function validateManufacturerEntity(entityId: string): Promise<QualityCheckItem[]> {
  const m = await prisma.manufacturer.findUnique({
    where: { id: entityId },
    include: { lureModels: { where: { deletedAt: null }, take: 1 } },
  });
  if (!m) return [fail("entity", "Manufacturer", 5, "Entity not found")];

  return [
    checkText(m.nameEn, "nameEn", "Official name", 3),
    m.countryCode ? pass("country", "Country", 1) : warn("country", "Country", 1),
    m.website ? pass("website", "Official website", 1) : warn("website", "Official website", 1),
    m.logoUrl ? pass("logo", "Logo", 1) : warn("logo", "Logo", 1),
    m.lureModels.length > 0
      ? pass("products", "Products linked", 2)
      : warn("products", "Products", 2, "No lure models"),
  ];
}

async function validateRegionEntity(entityId: string): Promise<QualityCheckItem[]> {
  const region = await prisma.region.findUnique({
    where: { id: entityId },
    include: { speciesLinks: true },
  });
  if (!region) return [fail("entity", "Region", 5, "Entity not found")];

  const duplicateCode = await prisma.region.count({
    where: { code: region.code, id: { not: region.id } },
  });

  return [
    checkText(region.nameEn, "nameEn", "English name", 2),
    checkText(region.nameTr, "nameTr", "Turkish name", 2),
    checkText(region.code, "code", "Region code", 2),
    duplicateCode === 0
      ? pass("dupCode", "No duplicate region code", 2)
      : fail("dupCode", "Duplicate region code", 2),
    region.isActive ? pass("active", "Region active", 1) : warn("active", "Region inactive", 1),
    region.speciesLinks.length > 0
      ? pass("species", "Species linked", 2)
      : warn("species", "Species linked", 2, "No species in this region"),
  ];
}

async function validateKnowledgeEntity(entityId: string): Promise<QualityCheckItem[]> {
  const source = await prisma.knowledgeSource.findUnique({
    where: { id: entityId },
  });
  if (!source) return [fail("entity", "Knowledge source", 5, "Entity not found")];

  const urlValid = source.baseUrl?.startsWith("http") ?? false;

  return [
    checkText(source.nameEn, "title", "Source title", 2, "knowledge"),
    urlValid ? pass("url", "URL valid", 2, undefined, "knowledge") : warn("url", "Broken or missing URL", 2, undefined, "knowledge"),
    source.trustTier >= 3
      ? pass("credibility", "Source credibility", 2, undefined, "knowledge")
      : warn("credibility", "Source credibility", 2, "Low trust tier", "knowledge"),
    checkText(source.nameTr, "nameTr", "Turkish name", 1, "localization"),
  ];
}

async function validateCatchReportEntity(entityId: string): Promise<QualityCheckItem[]> {
  const report = await prisma.catchReport.findUnique({
    where: { id: entityId },
    include: {
      fishSpecies: { select: { nameEn: true } },
      lureVariant: { select: { labelEn: true } },
      technique: { select: { nameEn: true } },
    },
  });
  if (!report) return [fail("entity", "Catch report", 5, "Entity not found")];

  return [
    pass("species", "Species linked", 3, report.fishSpecies.nameEn),
    pass("lure", "Lure variant linked", 3, report.lureVariant.labelEn),
    report.techniqueId
      ? pass("technique", "Technique linked", 3, report.technique?.nameEn)
      : fail("technique", "Technique required", 3, "Catch reports must include technique"),
    checkText(report.country, "country", "Country", 1),
    checkText(report.region, "region", "Region", 1),
    report.photoCount > 0
      ? pass("photos", "Photo evidence", 1)
      : warn("photos", "Photo evidence", 1),
    report.verificationStatus === "PENDING"
      ? warn("lifecycle", "Awaiting editor review", 1)
      : pass("lifecycle", "Verification status set", 1),
  ];
}

async function validateLureVariantEntity(entityId: string): Promise<QualityCheckItem[]> {
  const variant = await prisma.lureVariant.findUnique({
    where: { id: entityId },
    include: { lureModel: { include: { manufacturer: true } }, color: true },
  });
  if (!variant) return [fail("entity", "Lure variant", 5, "Entity not found")];

  return [
    pass("model", "Lure model linked", 2, variant.lureModel.nameEn, "relationships"),
    checkText(variant.labelEn, "labelEn", "Label (EN)", 2, "localization"),
    checkText(variant.labelTr, "labelTr", "Label (TR)", 2, "localization"),
    variant.weightG != null ? pass("weight", "Weight", 1, undefined, "editorial") : warn("weight", "Weight", 1, undefined, "editorial"),
    variant.lengthMm != null ? pass("length", "Length", 1, undefined, "editorial") : warn("length", "Length", 1, undefined, "editorial"),
  ];
}

async function validateProductLineEntity(entityId: string): Promise<QualityCheckItem[]> {
  const line = await prisma.productLine.findUnique({
    where: { id: entityId },
    include: { manufacturer: true, lureModels: { where: { deletedAt: null }, take: 1 } },
  });
  if (!line) return [fail("entity", "Product line", 5, "Entity not found")];

  return [
    pass("manufacturer", "Manufacturer linked", 2, line.manufacturer.nameEn, "relationships"),
    checkText(line.nameEn, "nameEn", "Name (EN)", 2, "localization"),
    checkText(line.nameTr, "nameTr", "Name (TR)", 2, "localization"),
    line.lureModels.length > 0
      ? pass("models", "Lure models", 1, undefined, "relationships")
      : warn("models", "Lure models", 1, "No models in line", "relationships"),
  ];
}

export async function validateEntity(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<QualityCheckItem[]> {
  switch (entityType) {
    case "SPECIES":
      return validateSpeciesEntity(entityId);
    case "TECHNIQUE":
      return validateTechniqueEntity(entityId);
    case "LURE":
      return validateLureEntity(entityId);
    case "MANUFACTURER":
      return validateManufacturerEntity(entityId);
    case "REGION":
      return validateRegionEntity(entityId);
    case "KNOWLEDGE_SOURCE":
      return validateKnowledgeEntity(entityId);
    case "CATCH_REPORT":
      return validateCatchReportEntity(entityId);
    case "LURE_VARIANT":
      return validateLureVariantEntity(entityId);
    case "PRODUCT_LINE":
      return validateProductLineEntity(entityId);
    default:
      return [];
  }
}

/** Seed-only validation when creating a new entity (no entityId yet). */
export function validateSeedInput(
  entityType: StudioReviewEntityType,
  seed: Record<string, unknown>,
): QualityCheckItem[] {
  const checks: QualityCheckItem[] = [];

  const has = (...keys: string[]) => keys.some((k) => Boolean(String(seed[k] ?? "").trim()));

  switch (entityType) {
    case "SPECIES":
      if (has("nameTr", "nameEn", "scientificName")) {
        checks.push(pass("seed", "Seed name provided", 2));
      } else {
        checks.push(fail("seed", "Seed name required", 2));
      }
      break;
    case "TECHNIQUE":
      checks.push(
        has("nameTr", "nameEn")
          ? pass("seed", "Technique name provided", 2)
          : fail("seed", "Technique name required", 2),
      );
      break;
    case "CATCH_REPORT":
      checks.push(
        seed.techniqueId
          ? pass("technique", "Technique linked", 3)
          : fail("technique", "Technique required", 3),
      );
      break;
    default:
      if (Object.keys(seed).length > 0) {
        checks.push(pass("seed", "Seed input provided", 1));
      }
  }

  checks.push(pass("search", "Searchable seed input", 1));
  return checks;
}
