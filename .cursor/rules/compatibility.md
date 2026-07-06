# Species → Technique → Lure Rules

Before modeling or displaying any species–lure relationship:

1. Read `docs/fishing/SPECIES_TECHNIQUE_LURE_POLICY.md`

## Mandatory triple

**Species → Technique → Lure** — never Species → Lure for recommendations or effectiveness.

| Required | Forbidden |
|----------|-----------|
| Catch report with `techniqueId` | Species-wide “top lures” without technique |
| Rankings grouped by technique | Generalizing lure advice to entire species |
| Discovery: species + technique filters | `LureSpecies` driving effectiveness UI |

## Catalog vs effectiveness

- `LureSpecies` = catalog/metadata (manufacturer marketing, browse index) only
- Effectiveness = Catch Reports, Usage Assertions — always include technique

## Independent dimensions

Model presentation, depth, speed, and environment separately — attached to the triple, not species alone.

Technique names: Fishing Lexicon first (`docs/fishing/TERMINOLOGY.md`).
