# Terminology & Taxonomy Rules

Before introducing any fishing vocabulary in code, copy, seeds, migrations, importers, or AI prompts:

1. Read `docs/fishing/TERMINOLOGY.md`
2. For species names: also read `docs/fishing/TAXONOMY_POLICY.md`

## Lexicon-first gate (mandatory)

**No fishing terminology or taxonomy may be introduced without being added to the Fishing Lexicon first.**

| Step | Action |
|------|--------|
| 1 | Add or update term in `ui/src/modules/terminology/data/` |
| 2 | Update `docs/fishing/TERMINOLOGY.md` (and `TAXONOMY_POLICY.md` for species) |
| 3 | Wire into UI, search, DB seeds, importers — only after steps 1–2 |

Forbidden:

- Hard-coded angler labels in components without a lexicon term id
- New species aliases or regional names in seeds without lexicon registration
- Literal translation of fishing terms (see `LOCALIZATION_GUIDE.md`)
- Internet consensus as authority — scientific taxonomy and lexicon win

Species taxonomy: scientific name is canonical identity; preferred tr/en and aliases still require lexicon-first authoring.
