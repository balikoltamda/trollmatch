# Manufacturer Product Lifecycle

**Document:** MANUFACTURER_LIFECYCLE  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Module:** LureAtlas / Import  
**Status:** Sprint S014 — Schema + policy (logic not yet implemented)  
**Authority:** Subordinate to `007_DATABASE_VISION.md`, `LURE_DOMAIN_MODEL.md`, and `CanonicalLureImport` import contract

---

## 1. Purpose

Manufacturer catalogs change continuously: new SKUs appear, colors are renamed, products vanish from public websites without announcement, and old pages remain cached long after factory discontinuation.

This document defines how **LureAtlas Models** (`lure_models`) track **manufacturer feed presence** across repeated imports — without deleting catalog rows, without breaking the existing S007 import persister, and without conflating editorial publish state with manufacturer availability.

---

## 2. Scope

| In scope | Out of scope (deferred) |
|----------|-------------------------|
| `LureModel` lifecycle columns (S014 migration) | Variant-level lifecycle |
| `ManufacturerProductStatus` enum | Full Ingestion Batch table (007 §15.1) |
| State transition rules (policy) | Runtime implementation (S015+) |
| Import compatibility guarantees | Automatic unpublish of public UI |
| Recovery when product reappears | Manufacturer portal self-service |

**Granularity:** One lifecycle record per **LureAtlas Model** (`lure_models` row). Variants inherit contextual meaning from the parent model until variant-level tracking is specified.

---

## 3. Distinction from editorial lifecycle

Two independent axes apply to every lure model:

| Axis | Field | Question answered |
|------|-------|-------------------|
| **Editorial** | `lifecycleState` (`ContentLifecycleState`) | Should moderators show this on the public guide? (`DRAFT`, `PUBLISHED`, `DEPRECATED`, …) |
| **Manufacturer feed** | `manufacturerStatus` (`ManufacturerProductStatus`) | Is this product still present in the manufacturer's import feed? |

A model may be `PUBLISHED` + `MISSING` (still on site, absent from latest Halco scrape).  
A model may be `DRAFT` + `ACTIVE` (imported but not yet moderated).

Neither axis triggers **physical deletion**.

---

## 4. Schema (Sprint S014)

Columns on `lure_models`:

| Column | Type | Default | Meaning |
|--------|------|---------|---------|
| `first_seen_at` | `timestamptz`, nullable | `null` | Timestamp when the product first appeared in any import batch for this manufacturer |
| `last_seen_at` | `timestamptz`, nullable | `null` | Timestamp when the product was last present in an import feed snapshot |
| `last_imported_at` | `timestamptz`, nullable | `null` | Timestamp when catalog fields were last successfully written by an importer |
| `missing_import_count` | `int` | `0` | Consecutive import batches where the product was **not** observed in the feed |
| `manufacturer_status` | `ManufacturerProductStatus` | `UNKNOWN` | Current manufacturer feed presence classification |

### Enum: `ManufacturerProductStatus`

| Value | Meaning |
|-------|---------|
| `ACTIVE` | Observed in the most recent completed import batch for its manufacturer scope |
| `MISSING` | Not observed in the most recent batch; `missing_import_count >= 1` |
| `DISCONTINUED` | Not observed for **N** consecutive batches (configurable threshold reached) |
| `UNKNOWN` | Never evaluated by a batch reconciler, or legacy row predating lifecycle tracking |

---

## 5. State transitions

```
                    ┌──────────────────────────────────────┐
                    │              UNKNOWN                  │
                    │  (initial / pre-lifecycle / legacy)   │
                    └───────────────┬──────────────────────┘
                                    │ first observation in import batch
                                    ▼
                    ┌──────────────────────────────────────┐
         ┌─────────│               ACTIVE                  │─────────┐
         │         └───────────────┬──────────────────────┘         │
         │                         │ absent from batch               │ present in batch
         │                         ▼                                 │
         │         ┌──────────────────────────────────────┐         │
         │         │               MISSING                 │─────────┘
         │         │     missing_import_count += 1         │  (recovery)
         │         └───────────────┬──────────────────────┘
         │                         │ missing_import_count >= N
         │                         ▼
         │         ┌──────────────────────────────────────┐
         └────────►│            DISCONTINUED             │
   (recovery)      │   terminal until re-observed        │
                   └───────────────┬──────────────────────┘
                                   │ observed again in feed
                                   └──────────► ACTIVE (reset count)
```

### Transition rules

| From | Event | To | Side effects |
|------|-------|-----|--------------|
| `UNKNOWN` | Product appears in import batch | `ACTIVE` | Set `first_seen_at` if null; set `last_seen_at`; optionally set `last_imported_at` on persist |
| `ACTIVE` | Product absent from batch | `MISSING` | `missing_import_count = 1`; do **not** clear `last_seen_at` |
| `MISSING` | Product absent again | `MISSING` | `missing_import_count += 1`; if count >= **N** → `DISCONTINUED` |
| `MISSING` | Product present in batch | `ACTIVE` | `missing_import_count = 0`; update `last_seen_at` |
| `DISCONTINUED` | Product present in batch | `ACTIVE` | `missing_import_count = 0`; update `last_seen_at` (recovery) |
| `DISCONTINUED` | Product absent | `DISCONTINUED` | Increment count (optional); remain discontinued |
| Any | Import touches row (create/update) | unchanged status* | Update `last_imported_at` only when lifecycle worker runs or persister extended |

\* Until lifecycle logic is implemented, S007 persister does **not** mutate lifecycle fields — defaults and migration backfill apply.

### Threshold **N** (discontinued after consecutive misses)

- **Default:** `N = 3` consecutive import batches (product owner configurable per manufacturer in future registry YAML).
- **Rationale:** Single failed scrape, partial category crawl, or site outage must not immediately mark `DISCONTINUED`.
- **Storage (future):** `manufacturer-registry/*.yaml` → `discontinued_after_missing_imports: 3`.

---

## 6. Import rules

These rules govern future **batch reconciler** implementation. The S007 `canonical-persister` remains unchanged in S014.

### 6.1 Hard rules (non-negotiable)

1. **Importers MUST NEVER delete** `lure_models`, `lure_variants`, or related catalog rows based on feed absence.
2. **Importers MUST NEVER hard-delete** manufacturer products — use status transitions only.
3. **Existing create/skip dedupe** in S007 persister continues unchanged; new columns use schema defaults on insert.
4. **Absence detection** runs at **batch completion**, not inside per-record persist transactions.

### 6.2 Per-batch algorithm (future)

After an import batch completes for manufacturer `M`:

1. **Collect observed keys** — set of stable external keys seen in batch (e.g. `duel:pid:{id}`, model slug, manufacturer SKU).
2. **For each observed key** — upsert catalog via existing persister; lifecycle worker sets:
   - `last_seen_at = batch.completedAt`
   - `manufacturer_status = ACTIVE`
   - `missing_import_count = 0`
   - `first_seen_at = COALESCE(first_seen_at, batch.completedAt)`
   - `last_imported_at = batch.completedAt` when row data changed or was created
3. **For each existing `lure_models` row** under manufacturer `M` whose key ∉ observed set:
   - Increment `missing_import_count`
   - Set `manufacturer_status = MISSING`
   - If `missing_import_count >= N` → set `manufacturer_status = DISCONTINUED`
4. **Emit audit event** (future Outbox) listing transitions for moderation review.

### 6.3 Compatibility with current pipeline

| Component | S014 behavior |
|-----------|---------------|
| `canonical-persister.ts` | Unchanged — new columns receive DB defaults on `lureModel.create` |
| `import:run` (demo) | Unaffected — single-record demo does not run batch reconciler |
| `PrismaLureRepository` | Unchanged — may later filter `manufacturerStatus = ACTIVE` for browse |
| `CanonicalLureImport` | Unchanged — lifecycle is post-persist concern |

---

## 7. Recovery rules

When a product **reappears** in a manufacturer feed after `MISSING` or `DISCONTINUED`:

1. Set `manufacturer_status = ACTIVE`.
2. Reset `missing_import_count = 0`.
3. Update `last_seen_at` to batch timestamp.
4. Run normal upsert/import for catalog fields (may refresh specs, images, colors).
5. **Do not** auto-set `lifecycleState = PUBLISHED` — editorial gate remains separate.
6. **Do not** delete community evidence (Usage Assertions, Catch Reports) attached to the model.

**Moderation notification (future):** Flag recovered products for spec diff review — manufacturer may have changed SKU or packaging silently.

---

## 8. Why DELETE is forbidden

| Reason | Detail |
|--------|--------|
| **Provenance** | Charter G4 — community contributions and import history reference stable entity IDs |
| **Foreign keys** | Variants, images, aliases, species links, and future Knowledge Claims cascade from model id |
| **Recovery** | Manufacturer sites drop and restore products; deletion would orphan user bookmarks and SEO slugs |
| **Audit** | 007 vision requires immutable audit trail; soft status + timestamps preserve timeline |
| **Discogs pattern** | Catalog systems retain discontinued entries for search, comparison, and merge resolution |
| **Import idempotency** | Re-import after gap must upsert same slug, not create duplicate |

Soft-delete via `deletedAt` remains reserved for **moderator legal/removal** actions — not importer automation.

---

## 9. Future automation strategy

Phased delivery after S014 schema:

| Phase | Deliverable |
|-------|-------------|
| **S015** | `IngestionBatch` table + batch completion hook |
| **S016** | Lifecycle reconciler job (`pg-boss` worker) reading batch observed-key sets |
| **S017** | Manufacturer registry threshold `discontinued_after_missing_imports` |
| **S018** | Moderator dashboard — products transitioning to `MISSING` / `DISCONTINUED` |
| **S019** | Optional auto-suggest `lifecycleState = DEPRECATED` when `DISCONTINUED` + no community objections |
| **Long-term** | Meilisearch index excludes `DISCONTINUED` by default; detail pages show “discontinued” badge with last seen date |

### Observability

- Metrics: `lure_import_lifecycle_transitions_total{from,to,manufacturer}`
- Alerts: spike in `MISSING` for single manufacturer (likely scrape failure, not mass discontinuation)

### Identity keys for batch membership

Priority order for matching feed rows to existing models:

1. External identifier registry (JAN/EAN/manufacturer SKU) — when F001/F002 extended
2. `ProductAlias` normalized alias + manufacturer scope
3. Stable slug (`lure_models.slug`) within manufacturer

DUEL connector: `duel:pid:{pid}` stored in future `metadata.extras` → alias row.

---

## 10. Related documents

| Document | Role |
|----------|------|
| `ui/prisma/schema.prisma` | `ManufacturerProductStatus` enum + `lure_models` columns |
| `docs/007_DATABASE_VISION.md` | Long-horizon Content Lifecycle State, Ingestion Batch |
| `docs/domain/LURE_DOMAIN_MODEL.md` | Identity & lifecycle aggregate section |
| `docs/connectors/DUEL_CONNECTOR.md` | Manufacturer import source |
| `ui/src/modules/import/persistence/canonical-persister.ts` | Current persist path (unchanged S014) |

---

*Lifecycle logic implementation is explicitly out of scope for Sprint S014. This document is the authoritative policy for S015+ workers.*
