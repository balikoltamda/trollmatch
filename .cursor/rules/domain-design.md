# Domain Design Rules

Read `docs/002_ENGINEERING_PRINCIPLES.md` §2 before adding schema, types, or fishing domain concepts.

## Simplicity gate (mandatory)

**Do not over-model fishing knowledge.**

| Do | Don't |
|----|-------|
| Model only what the current product requires | Build full `007` ontology ahead of product need |
| Design entities to be extensible (nullable fields, stable slugs) | Add sub-techniques, rigging matrices, presentation enums prematurely |
| Prefer evolutionary design | Premature complexity for “completeness” |
| Keep domain understandable for anglers and developers | Abstract layers that need diagrams for daily use |

## Defer until sprint demands

Sub-techniques · advanced rigging · lure presentations · speed/depth aggregate tables · environmental taxonomies beyond current catch-report fields

## Before adding a new entity

1. Name the current product requirement
2. Check if an existing entity can carry it
3. Add minimum schema with extension points
4. Document what remains deferred

Cross-gates still apply: lexicon-first, Species → Technique → Lure.
