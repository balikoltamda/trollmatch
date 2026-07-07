import type { AiSuggestionDraft } from "@/modules/studio/ai-review/types";

export async function analyzeManufacturerSeed(input: {
  nameEn?: string;
  nameTr?: string;
}): Promise<AiSuggestionDraft[]> {
  const suggestions: AiSuggestionDraft[] = [];
  const nameEn = input.nameEn?.trim() ?? "";

  if (nameEn) {
    suggestions.push({
      fieldKey: "nameEn",
      fieldLabel: "Name (EN)",
      suggestedValue: nameEn,
      confidencePct: 85,
      source: "AI_ENRICHMENT",
      reasoning: "Manufacturer brand name from seed input.",
      provenance: { generator: "seed-input" },
    });
    suggestions.push({
      fieldKey: "slug",
      fieldLabel: "Slug",
      suggestedValue: nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      confidencePct: 75,
      source: "AI_ENRICHMENT",
      reasoning: "Suggested slug — verify against existing manufacturer registry.",
      provenance: { generator: "slugify" },
    });
  }

  if (input.nameTr?.trim()) {
    suggestions.push({
      fieldKey: "nameTr",
      fieldLabel: "Name (TR)",
      suggestedValue: input.nameTr.trim(),
      confidencePct: 70,
      source: "AI_ENRICHMENT",
      reasoning: "Optional Turkish display name for Studio.",
      provenance: { generator: "seed-input" },
    });
  }

  return suggestions;
}

export async function analyzeLureSeed(input: {
  nameEn?: string;
  nameTr?: string;
  manufacturerSlug?: string;
  shortDescriptionEn?: string | null;
  shortDescriptionTr?: string | null;
  divingDepthMinM?: number | null;
  divingDepthMaxM?: number | null;
  buoyancySlug?: string | null;
  actionSlug?: string | null;
  primaryLengthMm?: number | null;
  primaryWeightG?: number | null;
  bodyTypeSlug?: string | null;
  techniqueSlugs?: string[];
  speciesSlugs?: string[];
  technologySlugs?: string[];
  imageCount?: number;
  hasHeroImage?: boolean;
  editorialRelationshipHints?: {
    techniques?: string[];
    lureCategories?: string[];
    species?: string[];
    regions?: string[];
    waterTypes?: string[];
    seasons?: string[];
  };
}): Promise<AiSuggestionDraft[]> {
  const suggestions: AiSuggestionDraft[] = [];
  if (input.nameEn?.trim()) {
    suggestions.push({
      fieldKey: "nameEn",
      fieldLabel: "Model name (EN)",
      suggestedValue: input.nameEn.trim(),
      confidencePct: 80,
      source: "AI_ENRICHMENT",
      reasoning: "Use importer or manufacturer catalog for canonical specs — this is a draft label only.",
      provenance: { generator: "seed-input" },
    });
  }
  if (input.manufacturerSlug?.trim()) {
    suggestions.push({
      fieldKey: "manufacturerSlug",
      fieldLabel: "Manufacturer",
      suggestedValue: input.manufacturerSlug.trim(),
      confidencePct: 85,
      source: "AI_ENRICHMENT",
      reasoning: "Link lure to manufacturer before import.",
      provenance: { generator: "seed-input" },
    });
  }

  if (!input.shortDescriptionTr?.trim()) {
    suggestions.push({
      fieldKey: "shortDescriptionTr",
      fieldLabel: "Short description (TR)",
      suggestedValue: "",
      confidencePct: 88,
      source: "AI_ENRICHMENT",
      reasoning: "Generate localized short description with Turkish fishing terminology after import.",
      provenance: { generator: "editorial-import-7.7", category: "missing-localized-content" },
    });
  }

  if (input.divingDepthMinM == null && input.divingDepthMaxM == null) {
    suggestions.push({
      fieldKey: "divingDepth",
      fieldLabel: "Diving depth",
      suggestedValue: "",
      confidencePct: 90,
      source: "AI_ENRICHMENT",
      reasoning: "Parse manufacturer range spec — topwater products should surface as 0 m.",
      provenance: { generator: "editorial-import-7.7", category: "missing-specification" },
    });
  }

  if (!input.buoyancySlug) {
    suggestions.push({
      fieldKey: "buoyancySlug",
      fieldLabel: "Buoyancy",
      suggestedValue: "floating",
      confidencePct: 75,
      source: "AI_ENRICHMENT",
      reasoning: "Infer floating/sinking/suspend from manufacturer type column.",
      provenance: { generator: "editorial-import-7.7", category: "missing-specification" },
    });
  }

  if (!input.actionSlug) {
    suggestions.push({
      fieldKey: "actionSlug",
      fieldLabel: "Action",
      suggestedValue: "",
      confidencePct: 70,
      source: "AI_ENRICHMENT",
      reasoning: "Extract swimming action from manufacturer marketing copy or spec table.",
      provenance: { generator: "editorial-import-7.7", category: "missing-specification" },
    });
  }

  if (!input.primaryLengthMm && !input.primaryWeightG) {
    suggestions.push({
      fieldKey: "sizeWeight",
      fieldLabel: "Length / weight",
      suggestedValue: "",
      confidencePct: 85,
      source: "AI_ENRICHMENT",
      reasoning: "Populate variant length and weight from manufacturer SKU table.",
      provenance: { generator: "editorial-import-7.7", category: "missing-specification" },
    });
  }

  if ((input.techniqueSlugs?.length ?? 0) === 0) {
    const hinted = input.editorialRelationshipHints?.techniques ?? [];
    suggestions.push({
      fieldKey: "techniqueLinks",
      fieldLabel: "Compatible techniques",
      suggestedValue: JSON.stringify(hinted),
      confidencePct: hinted.length > 0 ? 78 : 72,
      source: "AI_ENRICHMENT",
      reasoning:
        hinted.length > 0
          ? "Import enrichment inferred these techniques from specs — review before linking."
          : "Infer compatible techniques from buoyancy, depth, and product type.",
      provenance: { generator: "editorial-import-7.7", category: "missing-relationship" },
    });
  }

  if ((input.speciesSlugs?.length ?? 0) === 0) {
    const hinted = input.editorialRelationshipHints?.species ?? [];
    if (hinted.length > 0) {
      suggestions.push({
        fieldKey: "speciesLinks",
        fieldLabel: "Compatible fish species",
        suggestedValue: JSON.stringify(hinted),
        confidencePct: 65,
        source: "AI_ENRICHMENT",
        reasoning: "Manufacturer marketing tags mention these species — verify before linking.",
        provenance: { generator: "editorial-import-7.7", category: "missing-relationship" },
      });
    } else {
      suggestions.push({
        fieldKey: "speciesLinks",
        fieldLabel: "Compatible fish species",
        suggestedValue: "",
        confidencePct: 70,
        source: "AI_ENRICHMENT",
        reasoning: "No species links yet — add manufacturer marketing or editor-curated targets.",
        provenance: { generator: "editorial-import-7.7", category: "missing-relationship" },
      });
    }
  }

  const regionHints = input.editorialRelationshipHints?.regions ?? [];
  if (regionHints.length > 0) {
    suggestions.push({
      fieldKey: "regionLinks",
      fieldLabel: "Compatible fishing regions",
      suggestedValue: JSON.stringify(regionHints),
      confidencePct: 60,
      source: "AI_ENRICHMENT",
      reasoning: "Manufacturer copy references these regions — editor review required.",
      provenance: { generator: "editorial-import-7.7", category: "missing-relationship" },
    });
  }

  const waterHints = input.editorialRelationshipHints?.waterTypes ?? [];
  if (waterHints.length > 0) {
    suggestions.push({
      fieldKey: "waterTypes",
      fieldLabel: "Potential water types",
      suggestedValue: JSON.stringify(waterHints),
      confidencePct: 68,
      source: "AI_ENRICHMENT",
      reasoning: "Inferred from buoyancy and diving depth — suggestions only, not auto-linked.",
      provenance: { generator: "editorial-import-7.7", category: "missing-relationship" },
    });
  }

  const seasonHints = input.editorialRelationshipHints?.seasons ?? [];
  if (seasonHints.length > 0) {
    suggestions.push({
      fieldKey: "seasonalUsage",
      fieldLabel: "Potential seasonal usage",
      suggestedValue: JSON.stringify(seasonHints),
      confidencePct: 55,
      source: "AI_ENRICHMENT",
      reasoning: "Manufacturer seasonal tags detected — verify against regional experience.",
      provenance: { generator: "editorial-import-7.7", category: "missing-relationship" },
    });
  }

  const categoryHints = input.editorialRelationshipHints?.lureCategories ?? [];
  if (categoryHints.length > 0 && !input.bodyTypeSlug) {
    suggestions.push({
      fieldKey: "lureCategory",
      fieldLabel: "Compatible lure category",
      suggestedValue: JSON.stringify(categoryHints),
      confidencePct: 75,
      source: "AI_ENRICHMENT",
      reasoning: "Body type inferred from manufacturer categories — confirm taxonomy mapping.",
      provenance: { generator: "editorial-import-7.7", category: "missing-specification" },
    });
  }

  if ((input.technologySlugs?.length ?? 0) === 0) {
    suggestions.push({
      fieldKey: "technologyLinks",
      fieldLabel: "Manufacturer technologies",
      suggestedValue: "",
      confidencePct: 80,
      source: "AI_ENRICHMENT",
      reasoning: "Extract reusable technology blocks from manufacturer feature sections.",
      provenance: { generator: "editorial-import-7.7", category: "missing-relationship" },
    });
  }

  if ((input.imageCount ?? 0) === 0 || !input.hasHeroImage) {
    suggestions.push({
      fieldKey: "heroImage",
      fieldLabel: "Hero image",
      suggestedValue: "",
      confidencePct: 92,
      source: "AI_ENRICHMENT",
      reasoning: "Import pipeline should attach at least one hero product image.",
      provenance: { generator: "editorial-import-7.7", category: "missing-media" },
    });
  }

  if (!input.nameTr?.trim()) {
    suggestions.push({
      fieldKey: "nameTr",
      fieldLabel: "Model name (TR)",
      suggestedValue: "",
      confidencePct: 80,
      source: "AI_ENRICHMENT",
      reasoning: "Turkish model label missing — required for bilingual SEO and discovery.",
      provenance: { generator: "editorial-import-7.7", category: "missing-translation" },
    });
  }

  const seoReady =
    Boolean(input.shortDescriptionEn?.trim()) &&
    Boolean(input.shortDescriptionTr?.trim()) &&
    Boolean(input.nameEn?.trim()) &&
    (input.imageCount ?? 0) > 0;
  if (!seoReady) {
    suggestions.push({
      fieldKey: "seoReadiness",
      fieldLabel: "SEO readiness",
      suggestedValue: "incomplete",
      confidencePct: 90,
      source: "AI_ENRICHMENT",
      reasoning: "Publication SEO requires EN/TR names, short descriptions, and product imagery.",
      provenance: { generator: "editorial-import-7.7", category: "seo" },
    });
  }

  const publicationReady =
    seoReady &&
    input.actionSlug &&
    input.buoyancySlug &&
    (input.primaryLengthMm != null || input.primaryWeightG != null) &&
    (input.techniqueSlugs?.length ?? 0) > 0;
  suggestions.push({
    fieldKey: "publicationReadiness",
    fieldLabel: "Publication readiness",
    suggestedValue: publicationReady ? "ready-for-review" : "draft-incomplete",
    confidencePct: 95,
    source: "EDITOR",
    reasoning: publicationReady
      ? "Core specs and relationships present — editor can advance lifecycle after review."
      : "Draft missing required specs or relationships — complete before publishing.",
    provenance: { generator: "editorial-import-7.7", category: "readiness" },
  });

  suggestions.push({
    fieldKey: "lifecycleState",
    fieldLabel: "Lifecycle",
    suggestedValue: "DRAFT",
    confidencePct: 99,
    source: "EDITOR",
    reasoning: "New lures always start as DRAFT — AI never publishes.",
    provenance: { policy: "no-auto-publish" },
  });
  return suggestions;
}

export async function analyzeRegionSeed(input: {
  nameEn?: string;
  nameTr?: string;
  code?: string;
}): Promise<AiSuggestionDraft[]> {
  const suggestions: AiSuggestionDraft[] = [];
  if (input.nameEn?.trim()) {
    suggestions.push({
      fieldKey: "nameEn",
      fieldLabel: "Name (EN)",
      suggestedValue: input.nameEn.trim(),
      confidencePct: 85,
      source: "AI_ENRICHMENT",
      reasoning: "Region English name from seed input.",
      provenance: { generator: "seed-input" },
    });
  }
  if (input.nameTr?.trim()) {
    suggestions.push({
      fieldKey: "nameTr",
      fieldLabel: "Name (TR)",
      suggestedValue: input.nameTr.trim(),
      confidencePct: 85,
      source: "AI_ENRICHMENT",
      reasoning: "Independent Turkish region label — verify angler usage.",
      provenance: { generator: "seed-input" },
    });
  }
  if (input.code?.trim()) {
    suggestions.push({
      fieldKey: "code",
      fieldLabel: "Region code",
      suggestedValue: input.code.trim().toUpperCase(),
      confidencePct: 90,
      source: "AI_ENRICHMENT",
      reasoning: "Stable region code for distribution and catch reports.",
      provenance: { generator: "seed-input" },
    });
  }
  return suggestions;
}

export async function analyzeCatchReportSeed(input: {
  reportId?: string;
  techniqueId?: string;
}): Promise<AiSuggestionDraft[]> {
  const suggestions: AiSuggestionDraft[] = [];
  if (!input.techniqueId) {
    suggestions.push({
      fieldKey: "techniqueId",
      fieldLabel: "Technique",
      suggestedValue: "",
      confidencePct: 99,
      source: "EDITOR",
      reasoning: "Catch reports require a technique — Species → Technique → Lure policy.",
      provenance: { policy: "SPECIES_TECHNIQUE_LURE" },
    });
  } else {
    suggestions.push({
      fieldKey: "techniqueId",
      fieldLabel: "Technique",
      suggestedValue: input.techniqueId,
      confidencePct: 95,
      source: "AI_ENRICHMENT",
      reasoning: "Technique linked — required for field evidence ranking.",
      provenance: { generator: "entity-snapshot" },
    });
  }
  return suggestions;
}

export async function analyzeKnowledgeSourceSeed(input: {
  title?: string;
  url?: string;
}): Promise<AiSuggestionDraft[]> {
  const suggestions: AiSuggestionDraft[] = [];
  if (input.title?.trim()) {
    suggestions.push({
      fieldKey: "title",
      fieldLabel: "Source title",
      suggestedValue: input.title.trim(),
      confidencePct: 80,
      source: "AI_ENRICHMENT",
      reasoning: "Editor-provided source title — verify against original page.",
      provenance: { generator: "seed-input" },
    });
  }
  if (input.url?.trim()) {
    suggestions.push({
      fieldKey: "url",
      fieldLabel: "Source URL",
      suggestedValue: input.url.trim(),
      confidencePct: 90,
      source: "AI_ENRICHMENT",
      reasoning: "Canonical URL for outbound link — never republish body text.",
      provenance: { generator: "seed-input" },
    });
    suggestions.push({
      fieldKey: "aiSummaryEn",
      fieldLabel: "Summary draft (EN)",
      suggestedValue:
        "Draft summary placeholder — replace with cited, editor-verified synopsis after reading the source.",
      confidencePct: 40,
      source: "AI_SUMMARY",
      reasoning: "Sprint 7.7 will wire cited summaries — editor must verify.",
      provenance: { draft: true },
    });
  }
  return suggestions;
}
