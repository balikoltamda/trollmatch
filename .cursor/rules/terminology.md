# Terminology & Taxonomy Rules

**Platform law summary:** [`AI_CONTEXT.md` § Fishing Knowledge Rules](../../AI_CONTEXT.md#fishing-knowledge-rules)  
**Authoritative references:** `docs/fishing/TERMINOLOGY.md` · `docs/fishing/TAXONOMY_POLICY.md` · `docs/fishing/LOCALIZATION_GUIDE.md`

## Lexicon-first workflow (mandatory)

| Step | Action |
|------|--------|
| 1 | Add or update term in `ui/src/modules/terminology/data/` |
| 2 | Update `docs/fishing/TERMINOLOGY.md` (and `TAXONOMY_POLICY.md` for species) |
| 3 | Wire into UI, search, DB seeds, importers — only after steps 1–2 |

Forbidden: hard-coded angler labels · new species names without lexicon · literal translation · internet consensus over scientific taxonomy.
