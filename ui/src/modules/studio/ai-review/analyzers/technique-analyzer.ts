import { prisma } from "@/lib/prisma";
import { LEXICON_SEED_TERMS } from "@/modules/terminology";
import { normalizeSpeciesLabel } from "@/modules/taxonomy/lib/normalize-species-label";
import type { AiSuggestionDraft, TechniqueSeedInput } from "@/modules/studio/ai-review/types";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function analyzeTechniqueSeed(
  input: TechniqueSeedInput,
): Promise<AiSuggestionDraft[]> {
  const suggestions: AiSuggestionDraft[] = [];
  const nameEn = input.nameEn?.trim() ?? "";
  const nameTr = input.nameTr?.trim() ?? "";

  const lexiconHit = LEXICON_SEED_TERMS.find((term) => {
    const labels = [term.preferred.en, term.preferred.tr, ...term.aliases.map((a) => a.label)];
    const nEn = nameEn ? normalizeSpeciesLabel(nameEn) : "";
    const nTr = nameTr ? normalizeSpeciesLabel(nameTr) : "";
    return labels.some((label) => {
      const nl = normalizeSpeciesLabel(label);
      return (nEn && (nl.includes(nEn) || nEn.includes(nl))) || (nTr && (nl.includes(nTr) || nTr.includes(nl)));
    });
  });

  if (nameEn) {
    suggestions.push({
      fieldKey: "nameEn",
      fieldLabel: "Name (EN)",
      suggestedValue: nameEn,
      confidencePct: 85,
      source: "AI_ENRICHMENT",
      reasoning: lexiconHit
        ? `Similar lexicon term "${lexiconHit.id}" — confirm technique is distinct.`
        : "English technique name from seed input.",
      provenance: lexiconHit ? { lexiconTermId: lexiconHit.id } : { generator: "seed-input" },
    });
    suggestions.push({
      fieldKey: "slug",
      fieldLabel: "Slug",
      suggestedValue: slugify(nameEn),
      confidencePct: 80,
      source: "AI_ENRICHMENT",
      reasoning: "Slug derived from English name.",
      provenance: { generator: "slugify" },
    });
  }

  if (nameTr) {
    suggestions.push({
      fieldKey: "nameTr",
      fieldLabel: "Name (TR)",
      suggestedValue: nameTr,
      confidencePct: 85,
      source: "AI_ENRICHMENT",
      reasoning: "Turkish technique name — verify angler-natural wording.",
      provenance: { generator: "seed-input" },
    });
  }

  const similar = await prisma.technique.findMany({
    where: { deletedAt: null },
    take: 20,
  });

  for (const row of similar) {
    if (
      (nameEn && normalizeSpeciesLabel(row.nameEn) === normalizeSpeciesLabel(nameEn)) ||
      (nameTr && normalizeSpeciesLabel(row.nameTr) === normalizeSpeciesLabel(nameTr))
    ) {
      suggestions.push({
        fieldKey: "duplicateWarning",
        fieldLabel: "Possible duplicate",
        suggestedValue: row.slug,
        confidencePct: 99,
        source: "AI_ENRICHMENT",
        reasoning: `Existing technique "${row.nameEn}" matches this name — do not create a silent duplicate.`,
        provenance: { existingId: row.id, matchKind: "exact" },
      });
    }
  }

  if (lexiconHit?.deprecatedTerms.length) {
    for (const dep of lexiconHit.deprecatedTerms) {
      suggestions.push({
        fieldKey: "deprecatedNameWarning",
        fieldLabel: "Deprecated name",
        suggestedValue: dep.label,
        confidencePct: 90,
        source: "AI_ENRICHMENT",
        reasoning: dep.reason,
        provenance: { lexiconTermId: lexiconHit.id, deprecated: true },
      });
    }
  }

  return suggestions;
}
