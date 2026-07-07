import { prisma } from "@/lib/prisma";
import {
  LEXICON_SEED_TERMS,
  lexiconTermToSpeciesSeed,
} from "@/modules/terminology";
import { normalizeSpeciesLabel } from "@/modules/taxonomy/lib/normalize-species-label";
import { slugifySpeciesEn, slugifySpeciesTr } from "@/modules/species/lib/slug";
import type { AiSuggestionDraft, SpeciesSeedInput } from "@/modules/studio/ai-review/types";

function matchesTerm(input: string, candidates: string[]): boolean {
  const n = normalizeSpeciesLabel(input);
  return candidates.some((c) => normalizeSpeciesLabel(c).includes(n) || n.includes(normalizeSpeciesLabel(c)));
}

function findLexiconMatch(input: SpeciesSeedInput) {
  for (const term of LEXICON_SEED_TERMS) {
    if (term.domain !== "species") continue;
    const scientific = term.scientificTerms ?? [];
    const labels = [
      term.preferred.en,
      term.preferred.tr,
      ...scientific,
      ...term.aliases.map((a) => a.label),
      ...term.internationalTerms,
    ];
    const hit =
      (input.nameTr && matchesTerm(input.nameTr, labels)) ||
      (input.nameEn && matchesTerm(input.nameEn, labels)) ||
      (input.scientificName && matchesTerm(input.scientificName, scientific));
    if (hit) return term;
  }
  return null;
}

export async function analyzeSpeciesSeed(
  input: SpeciesSeedInput,
): Promise<AiSuggestionDraft[]> {
  const suggestions: AiSuggestionDraft[] = [];
  const lexiconTerm = findLexiconMatch(input);

  if (lexiconTerm) {
    const seed = lexiconTermToSpeciesSeed(lexiconTerm);
    suggestions.push(
      {
        fieldKey: "scientificName",
        fieldLabel: "Scientific name",
        suggestedValue: seed.scientificName,
        confidencePct: 99,
        source: "AI_ENRICHMENT",
        reasoning: `Matched Fishing Lexicon entry "${lexiconTerm.id}" from seed input.`,
        provenance: { lexiconTermId: lexiconTerm.id, generator: "lexicon" },
      },
      {
        fieldKey: "nameEn",
        fieldLabel: "Preferred English name",
        suggestedValue: seed.nameEn,
        confidencePct: 98,
        source: "AI_ENRICHMENT",
        reasoning: "Independent English preferred label from lexicon — not a translation.",
        provenance: { lexiconTermId: lexiconTerm.id },
      },
      {
        fieldKey: "nameTr",
        fieldLabel: "Preferred Turkish name",
        suggestedValue: seed.nameTr,
        confidencePct: 98,
        source: "AI_ENRICHMENT",
        reasoning: input.nameTr
          ? `Preferred Turkish name "${input.nameTr}" aligns with lexicon.`
          : "Turkish preferred label from lexicon.",
        provenance: { lexiconTermId: lexiconTerm.id },
      },
      {
        fieldKey: "slugEn",
        fieldLabel: "Slug (EN)",
        suggestedValue: seed.slug,
        confidencePct: 95,
        source: "AI_ENRICHMENT",
        reasoning: "Stable English slug from lexicon term id.",
        provenance: { lexiconTermId: lexiconTerm.id },
      },
      {
        fieldKey: "slugTr",
        fieldLabel: "Slug (TR)",
        suggestedValue: slugifySpeciesTr(seed.nameTr),
        confidencePct: 90,
        source: "AI_ENRICHMENT",
        reasoning: "Turkish slug derived from preferred Turkish name.",
        provenance: { lexiconTermId: lexiconTerm.id },
      },
    );

    if (seed.aliases.length > 0) {
      suggestions.push({
        fieldKey: "aliases",
        fieldLabel: "Search aliases",
        suggestedValue: JSON.stringify(
          seed.aliases.map((a) => ({ alias: a.alias, kind: a.kind })),
        ),
        confidencePct: 92,
        source: "AI_ENRICHMENT",
        reasoning: "Lexicon aliases for search — same species only.",
        provenance: { lexiconTermId: lexiconTerm.id },
      });
    }

    if (lexiconTerm.id === "lichia-amia") {
      const seriola = await prisma.fishSpecies.findFirst({
        where: { slugEn: "seriola-dumerili", deletedAt: null },
        select: { id: true, nameEn: true },
      });
      suggestions.push({
        fieldKey: "speciesConfusion",
        fieldLabel: "Species confusion",
        suggestedValue: JSON.stringify({
          confusedWithSpeciesId: seriola?.id ?? "",
          misappliedNameTr: "Akya",
          misappliedNameEn: "Leerfish",
          reasonEn:
            "Some regions incorrectly use Akya for Seriola dumerili. Akya belongs to Lichia amia.",
          reasonTr:
            "Bazı bölgelerde Akya adı yanlışlıkla Seriola dumerili için kullanılır. Akya, Lichia amia türüne aittir.",
        }),
        confidencePct: 96,
        source: "AI_ENRICHMENT",
        reasoning: "Canonical Akya ↔ Kuzu confusion pair from taxonomy policy.",
        provenance: { policy: "TAXONOMY_POLICY", lexiconTermId: lexiconTerm.id },
      });

      suggestions.push({
        fieldKey: "regionIds",
        fieldLabel: "Distribution regions",
        suggestedValue: JSON.stringify(["AEGEAN", "TURKISH_MEDITERRANEAN", "MARMARA"]),
        confidencePct: 75,
        source: "AI_ENRICHMENT",
        reasoning: "Eastern Mediterranean pelagic — editorial default distribution lens.",
        provenance: { lens: "eastern-mediterranean" },
      });

      suggestions.push({
        fieldKey: "habitatTr",
        fieldLabel: "Habitat (TR)",
        suggestedValue:
          "Kıyı ve açık deniz; yaz aylarında kıyıya yakın sürüler, kışın daha derin sularda.",
        confidencePct: 70,
        source: "AI_SUMMARY",
        reasoning: "Draft habitat note for editor review — verify against field sources.",
        provenance: { draft: true },
      });

      suggestions.push({
        fieldKey: "descriptionTr",
        fieldLabel: "SEO description (TR)",
        suggestedValue:
          "Akya (Lichia amia) — Ege ve Akdeniz'de popüler palagik av balığı. Teknik, yem ve doğrulanmış av raporları Balık Oltamda Rehber'de.",
        confidencePct: 65,
        source: "AI_SUMMARY",
        reasoning: "Draft public description — editor must verify before publish.",
        provenance: { draft: true, seo: true },
      });
    }

    return suggestions;
  }

  const nameEn = input.nameEn?.trim() || input.scientificName?.trim() || "";
  const nameTr = input.nameTr?.trim() || input.nameEn?.trim() || "";
  const scientific = input.scientificName?.trim() || "";

  if (scientific) {
    suggestions.push({
      fieldKey: "scientificName",
      fieldLabel: "Scientific name",
      suggestedValue: scientific,
      confidencePct: input.scientificName ? 95 : 60,
      source: "AI_ENRICHMENT",
      reasoning: "Editor-provided scientific name — verify against authority.",
      provenance: { generator: "seed-input" },
    });
  }

  if (nameEn) {
    suggestions.push({
      fieldKey: "nameEn",
      fieldLabel: "Preferred English name",
      suggestedValue: nameEn,
      confidencePct: input.nameEn ? 85 : 55,
      source: "AI_ENRICHMENT",
      reasoning: "Derived from seed input — confirm independently authored label.",
      provenance: { generator: "seed-input" },
    });
    suggestions.push({
      fieldKey: "slugEn",
      fieldLabel: "Slug (EN)",
      suggestedValue: slugifySpeciesEn(nameEn),
      confidencePct: 80,
      source: "AI_ENRICHMENT",
      reasoning: "Slug generated from English preferred name.",
      provenance: { generator: "slugify" },
    });
  }

  if (nameTr) {
    suggestions.push({
      fieldKey: "nameTr",
      fieldLabel: "Preferred Turkish name",
      suggestedValue: nameTr,
      confidencePct: input.nameTr ? 85 : 55,
      source: "AI_ENRICHMENT",
      reasoning: "Derived from seed input — confirm angler-natural Turkish label.",
      provenance: { generator: "seed-input" },
    });
    suggestions.push({
      fieldKey: "slugTr",
      fieldLabel: "Slug (TR)",
      suggestedValue: slugifySpeciesTr(nameTr),
      confidencePct: 80,
      source: "AI_ENRICHMENT",
      reasoning: "Slug generated from Turkish preferred name.",
      provenance: { generator: "slugify" },
    });
  }

  suggestions.push({
    fieldKey: "editorNote.internalNotes",
    fieldLabel: "Editor notes draft",
    suggestedValue: "Verify taxonomy, distribution regions, and habitat against approved sources before publish.",
    confidencePct: 50,
    source: "AI_SUMMARY",
    reasoning: "Placeholder editorial reminder — replace with verified notes.",
    provenance: { draft: true },
  });

  return suggestions;
}
