# STUDIO_001 — Balık Oltamda Studio

**Sprint:** 6  
**Working title:** Balık Oltamda Studio  
**Route prefix:** `/studio`  
**Status:** First version shipped (no auth)

## Purpose

Balık Oltamda Studio is the internal operating system for TrollMatch — not a generic admin panel. It is where imports land, editors enrich catalog data, and publish workflow begins.

Brand separation:

| Layer | Owner | Editable in Studio |
|-------|--------|-------------------|
| Manufacturer feed | Importer | Read-only |
| Canonical catalog | Editorial | Yes (`LureModel`) |
| Editor notes | Balık Oltamda | Yes (`LureEditorNote`) |
| Community | Anglers (later) | Read-only for now |

**Core rule:** imports must never overwrite `lure_editor_notes`.

## Architecture

```
/studio                    Dashboard (live DB stats)
/studio/import             Import Center
/studio/import/[code]      Per-manufacturer batch history
/studio/products           Server-side product table
/studio/products/[id]      Product editor (tabbed)
/studio/manufacturers      Manufacturer list
/studio/species            Fish species reference
/studio/techniques         Technique reference
/studio/community          Placeholder (moderation later)
/studio/media              Image library (latest 50)
/studio/notes              Editor notes queue
/studio/settings           Local admin notice
```

Studio routes sit **outside** `next-intl` locale routing. Middleware excludes `/studio`.

## Database (Sprint 6 additions)

### `lure_editor_notes`

1:1 with `lure_models`. Stores Balık Oltamda field notes (bilingual), regional notes (Mediterranean, Aegean, Northern Cyprus), seasonality, retrieve, warnings, best colors, confidence, and `internal_notes` (never public).

### `import_batches`

One row per import run. Powers Import Center and dashboard. Stores counts, duration, `report_path`, and optional `report_json` snapshot.

### `catalog_audit_entries`

Append-only change log: import batches, editor canonical saves, editor note saves. Product editor History tab reads from here.

Migration: `20250704180000_studio_editor_notes`

## Module layout

```
ui/src/modules/studio/
  actions/          Server actions (import, product save)
  components/       Sidebar, tables, product editor
  data/             Prisma queries (dashboard, products, import)
  types.ts          Shared Studio types
```

## Workflow (target state)

```
Importer → product appears (DRAFT) → needs review → editor enriches
  → published → community reports (later) → AI summary (later)
```

Imports set `lifecycleState: DRAFT`. Editors move to `PENDING_REVIEW` or `PUBLISHED` via canonical tab.

## Import integration

- CLI (`npm run import`) and Studio **Import now** both call `persistImportBatch()` after each run.
- JSON reports still written under `reports/import/` at repo root.
- Studio Import Center reads `import_batches` + registry metadata.

## Product editor tabs

1. **General** — summary identifiers  
2. **Manufacturer** — importer-owned, read-only  
3. **Canonical** — editable names, slug, lifecycle, fishing attributes, techniques, species  
4. **Editor Notes** — Balık Oltamda layer (upsert, never touched by importer)  
5. **Images** — gallery from DB  
6. **Community** — placeholder  
7. **History** — `catalog_audit_entries`

## Scale considerations

Designed for growth without schema duplication:

- Editor notes in separate table (import upserts skip it)
- Import batches indexed by `manufacturer_code`, `started_at`
- Product list uses server-side pagination (default 25, max 100)
- Audit log append-only with `lure_model_id` index

Future: auth/roles, community moderation, dedicated media upload pipeline, full species/technique CRUD.

## Not in this sprint

Authentication, roles, permissions, notifications, analytics.

Single local admin assumed — do not expose `/studio` on public internet without a gate in production.

---

## Sprint 6.1 — Editorial workflow

### Editorial status

`DRAFT` → `PENDING_REVIEW` (Needs Review) → `READY` → `PUBLISHED` → `ARCHIVED`

Importers set `PENDING_REVIEW` on create — never auto-publish.

### Review queue (`/studio/review`)

Products with completeness gaps, sorted lowest-first. Dashboard shows top 10.

### Completeness score

Weighted checklist: Turkish name, images, cover, fishing attributes, species, editor note.

### Import diffs

`import_field_changes` table — accept/reject UI on product **Import Changes** tab.

### Bulk actions

Products list: publish, unpublish, assign species/techniques, delete editor notes, CSV export.

### Manufacturer hub (`/studio/manufacturers/[slug]`)

Last import, product counts, needs review, published, missing, import history with report links.

### Import reports (`/studio/import/batch/[id]`)

Human-readable report sections from `import_batches.report_json`.

---

## Sprint 6.2 — Verification-first Studio

### Philosophy

Balık Oltamda **validates** content; it does not write most of it. Editors approve, reject, correct, or merge — they should not type thousands of products.

### Pipeline

```
Manufacturer → Importer → AI enrichment → Community reports → AI summary
  → Editorial verification → Published
```

### `catalog_suggestions`

Every pending change is a suggestion with **confidence**, **source**, **reasoning**, and **provenance**:

| Source | Origin |
|--------|--------|
| `IMPORTER` | Synced from `import_field_changes` |
| `AI_ENRICHMENT` | Gap-filling from completeness + catalog context |
| `COMMUNITY_REPORT` | Angler effectiveness data (mock enrichment today) |
| `AI_SUMMARY` | RAG-style field note drafts |

Actions: `SUGGESTION_APPROVE`, `SUGGESTION_REJECT`, `SUGGESTION_CORRECT`, `SUGGESTION_MERGE` in audit log.

### Attention inbox (`/studio`)

Dashboard answers one question: **What requires my attention today?** No stat cards — only actionable verification items sorted by urgency.

### Product editor

Default tab is **Verify** (suggestion cards). **Manual override** collapses canonical + editor notes for exceptions only.

Migration: `20250704200000_studio_verification_suggestions`


