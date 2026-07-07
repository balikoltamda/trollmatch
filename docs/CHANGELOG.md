# Changelog

**Project:** TrollMatch / Balık Oltamda Guide  
**Purpose:** Platform evolution from Sprint 0 onward — high-level only.  
**Detail:** [`AI_CONTEXT.md`](../AI_CONTEXT.md) (current state) · [`010_ANGLER_PRODUCT.md`](010_ANGLER_PRODUCT.md) (product sprints) · [`PROJECT_STATE.md`](PROJECT_STATE.md) (engineering log)

Two sprint numbering schemes were used early (engineering `S0xx` / product `7.x+`). Both are listed chronologically below.

---

## Sprint 0 — Project foundation

| | |
|---|---|
| **Purpose** | Ratify vision, architecture, and delivery plan before code |
| **Major changes** | Charter, engineering principles, master context, ADRs, backlog, roadmap, cursor rules |
| **Architectural decisions** | Modular monolith · LureAtlas first · knowledge platform not e-commerce · bilingual tr/en · trust/provenance model documented in `007` |
| **Commit** | `e6b3b74` |

---

## Sprint 1 — Initial application

| | |
|---|---|
| **Purpose** | Runnable monorepo shell with UI, database, and i18n |
| **Major changes** | Next.js 15 app, TypeScript, Tailwind, shadcn/ui, Prisma, Docker Compose (Postgres), health endpoint, next-intl (tr/en), npm workspaces |
| **Architectural decisions** | **Prisma in `ui/`** (implementation choice vs ADR Drizzle target) · single deployable Next.js unit · default locale `tr` |
| **Commit** | `3d97589` |

---

## Sprint 2 — Lure detail UI

| | |
|---|---|
| **Purpose** | First public lure page experience |
| **Major changes** | `/[locale]/lures/[slug]` with mock data, reusable section components |
| **Architectural decisions** | Section-based lure detail layout (carried forward to DB-backed pages) |
| **Commit** | `86c5b90` |

---

## Sprint 2.1 — Initial Prisma schema

| | |
|---|---|
| **Purpose** | Persist LureAtlas catalog core |
| **Major changes** | Manufacturer, ProductLine, LureModel, LureVariant, Image, FishSpecies, Technique, join tables |
| **Architectural decisions** | Catalog hierarchy matches LureAtlas domain model · PostgreSQL as system of record |
| **Commit** | `4a2beb8` |

---

## Sprint 2.2 — Database foundation

| | |
|---|---|
| **Purpose** | Dev database wiring and domain documentation |
| **Major changes** | Lure domain model doc, PostgreSQL dev env, `db:check`, env file layout |
| **Architectural decisions** | Secrets in `ui/.env.local` only — env files removed from git (`d45c8fe`) |
| **Commit** | `e03a121`, `d45c8fe` |

---

## Sprint Foundation F001 — Canonical product identity

| | |
|---|---|
| **Purpose** | Stable product/color identity for variants and imports |
| **Major changes** | `Color`, `ColorAlias`, `ProductAlias`; variant → color FK |
| **Architectural decisions** | **Canonical product identity** via Color + aliases — frozen until Milestone 1 |
| **Commit** | `149de4c` |

---

## Sprint Foundation F002 — Canonical species identity

| | |
|---|---|
| **Purpose** | Stable species identity separate from display names |
| **Major changes** | `SpeciesScientificName`, `SpeciesCommonName`, `SpeciesAlias` |
| **Architectural decisions** | Scientific name as identity anchor; common names as display layer |
| **Commit** | `294a9f4` |

---

## Refactor R001 — Modular project structure

| | |
|---|---|
| **Purpose** | Align codebase with modular monolith layout |
| **Major changes** | `features/lures` → `modules/lure`; scaffold `species`, `technique`, `manufacturer`, `shared/*` |
| **Architectural decisions** | Domain code under `ui/src/modules/` — no return to `features/` |
| **Commit** | `d07f17d` |

---

## Sprint S003 — Add Lure UI

| | |
|---|---|
| **Purpose** | Contributor form scaffold (UI only) |
| **Major changes** | `/[locale]/add-lure` — autocompletes, image drop zone, preview; save disabled |
| **Architectural decisions** | Form UI precedes auth and persistence |
| **Commit** | `5d06937` |

---

## Sprint S004 — Importer framework

| | |
|---|---|
| **Purpose** | Pluggable manufacturer import architecture |
| **Major changes** | `modules/import/` — parser, validator, mapper, job, provider interfaces |
| **Architectural decisions** | **ManufacturerImportProvider** pipeline — frozen import framework |
| **Commit** | `382a2b7` |

---

## Sprint S005 — Canonical import DTO

| | |
|---|---|
| **Purpose** | Single target shape for all manufacturer mappers |
| **Major changes** | `CanonicalLureImport` DTO and contract |
| **Architectural decisions** | All importers map to one canonical type before persistence |
| **Commit** | `679bdcd` |

---

## Sprint S006 — Demo importer

| | |
|---|---|
| **Purpose** | Prove parse → validate → map pipeline |
| **Major changes** | Static JSON → canonical; `npm run import:demo` |
| **Architectural decisions** | Research JSON as evidence; importer as promotion path |
| **Commit** | `b8d1576` |

---

## Sprint S007 — End-to-end import

| | |
|---|---|
| **Purpose** | First catalog writes to PostgreSQL |
| **Major changes** | JSON → canonical → Prisma upsert (transactional, dedupe); `npm run import:run` |
| **Architectural decisions** | Idempotent upsert by external id; no hard deletes |
| **Commit** | `65e6302` |

---

## Sprint S008 — Manufacturer registry

| | |
|---|---|
| **Purpose** | Declarative connector configuration |
| **Major changes** | `manufacturer-registry/*.yaml` per brand |
| **Architectural decisions** | YAML metadata + code registry (registration in TypeScript) |
| **Commit** | `20777cc` |

---

## Sprint S009 — Prisma lure repository

| | |
|---|---|
| **Purpose** | Lure detail reads live catalog from DB |
| **Major changes** | `PrismaLureRepository`; enrichment mock isolated from catalog rows |
| **Architectural decisions** | Repository pattern; non-catalog UI sections may use enrichment until real data exists |
| **Commit** | `233edf1` |

---

## Sprint S010 — DUEL connector spec

| | |
|---|---|
| **Purpose** | Specify first live manufacturer connector |
| **Major changes** | `docs/connectors/DUEL_CONNECTOR.md` |
| **Architectural decisions** | Research snapshots → parse → canonical; no runtime scrape in production API |
| **Commit** | `9bb48a8` *(landed with S011 push)* |

---

## Sprint S011 — DUEL fetcher

| | |
|---|---|
| **Purpose** | Capture manufacturer HTML as evidence |
| **Major changes** | Raw HTML snapshots under `research/manufacturers/duel/`; `import:duel:fetch` |
| **Architectural decisions** | Fetch and parse are separate CLI stages |
| **Commit** | `c4f04dd` |

---

## Sprint S012 — DUEL fetcher report

| | |
|---|---|
| **Purpose** | Verify snapshot fields against connector spec |
| **Major changes** | `docs/connectors/DUEL_FETCHER_REPORT.md` |
| **Architectural decisions** | Evidence verification before parser investment |
| **Commit** | `9bb48a8` |

---

## Sprint S013 — DUEL parser

| | |
|---|---|
| **Purpose** | Turn HTML snapshots into canonical DTOs |
| **Major changes** | Snapshots → `CanonicalLureImport`; `import:duel:parse` |
| **Architectural decisions** | Parser output is provisional until validator + persistence |
| **Commit** | `d96e48d` |

---

## Sprint S014 — Manufacturer lifecycle

| | |
|---|---|
| **Purpose** | Track manufacturer feed presence separately from editorial publish |
| **Major changes** | `ManufacturerProductStatus` on `lure_models`; lifecycle policy doc |
| **Architectural decisions** | **Two lifecycles:** editorial `ContentLifecycleState` ≠ feed `ManufacturerProductStatus` · importers never delete rows |
| **Commit** | `248319c` |

---

## Sprint S015 — DUEL mapper

| | |
|---|---|
| **Purpose** | Normalize parser output to canonical contract |
| **Major changes** | `duel-mapper.ts`; parser delegates mapping |
| **Architectural decisions** | Mapper layer between parse and validate |
| **Commit** | `9f2c161` |

---

## Sprint S016 — Canonical validator

| | |
|---|---|
| **Purpose** | Enforce publish-ready rules on import DTOs |
| **Major changes** | `canonical-lure-validator.ts` — errors, warnings, normalized result |
| **Architectural decisions** | Validation before any upsert |
| **Commit** | `9192d83` |

---

## Sprint S017 — First real DUEL import

| | |
|---|---|
| **Purpose** | End-to-end live manufacturer catalog in Postgres |
| **Major changes** | Fetch/parse/map/validate/upsert; `import:duel:run`; import report in research |
| **Architectural decisions** | First production importer path proven |
| **Commit** | `7395539` |

---

## Sprint S018 — Unified import runner

| | |
|---|---|
| **Purpose** | Single CLI entry for all manufacturers |
| **Major changes** | Import registry; `import:run [provider]` with DUEL default |
| **Architectural decisions** | Register new brands in `registered-manufacturers.ts` only |
| **Commit** | `cc03d18` |

---

## Milestone — Build, CI & deploy

| | |
|---|---|
| **Purpose** | Reliable production builds on Linux from Windows dev |
| **Major changes** | Stable Next.js production build; cross-platform native deps; lockfile CI; standalone bundle includes static/public |
| **Architectural decisions** | Develop on Windows, deploy on Linux (`012`) · standalone Next.js output for VPS Docker |
| **Commit** | `03f8e33`, `e5842f4`, `09e4804`, `018379d`, `eae14a4` |

---

## Milestone — Catalog domain & registry

| | |
|---|---|
| **Purpose** | Extend lure model for global knowledge; harden registry CLI |
| **Major changes** | Global fishing knowledge fields on domain model; production-ready manufacturer registry |
| **Architectural decisions** | Evolutionary schema extension — not full `007` ontology |
| **Commit** | `e05caea`, `592c18c` |

---

## Milestone — Design system & homepage

| | |
|---|---|
| **Purpose** | Public shell before angler discovery sprint |
| **Major changes** | Premium design system, homepage, Balık Oltamda footer, regional angler copy |
| **Architectural decisions** | Presentation layer separate from catalog truth |
| **Commit** | `03584c7`, `cfab1d3`, `c54d0fd`, `fafc855` |

---

## Sprint 6 — Balık Oltamda Studio v1

| | |
|---|---|
| **Purpose** | Internal CMS for imports, catalog editing, editor notes |
| **Major changes** | `/studio` routes; `LureEditorNote`, `ImportBatch`, `CatalogAuditEntry`; Import Center |
| **Architectural decisions** | Studio outside locale routing · **imports never overwrite editor notes** · no auth gate yet |
| **Commit** | `0bae1a4` |

---

## Sprint 6.1 — Editorial workflow

| | |
|---|---|
| **Purpose** | Structured publish pipeline for editors |
| **Major changes** | Editorial status machine, review queue, completeness score, import field diffs, bulk actions, manufacturer hub |
| **Architectural decisions** | Importers set `PENDING_REVIEW` — never auto-publish |
| **Commit** | `2a20d0f` |

---

## Sprint 6.2 — Verification-first Studio

| | |
|---|---|
| **Purpose** | Editors verify suggestions instead of typing catalog data |
| **Major changes** | `catalog_suggestions`, attention inbox, Verify-first product editor |
| **Architectural decisions** | Manufacturer → Importer → suggestions → editorial verification → published |
| **Commit** | `52a3db8` |

---

## Sprint 6.3 — Trust is the product

| | |
|---|---|
| **Purpose** | Make confidence and provenance visible in Studio and on lure pages |
| **Major changes** | `trust` module, `TrustProfile`, public “Why trust this?” on lure detail |
| **Architectural decisions** | Trust as primary Studio UX metric |
| **Commit** | `31b0284` |

---

## Sprint 7.1 — Discovery loop

| | |
|---|---|
| **Purpose** | Anglers can find fish → lures → detail |
| **Major changes** | `/search`, `/lures`, `/species`; discovery module; live DB homepage; public visibility `PUBLISHED` + `READY` |
| **Architectural decisions** | **Species as primary discovery axis** · search via Prisma (Meilisearch deferred) |
| **Commit** | `3cbf298` |

---

## Sprint 7.2 — Fishing Lexicon foundation

| | |
|---|---|
| **Purpose** | Canonical terminology standards before app-wide wiring |
| **Major changes** | `TERMINOLOGY.md`, `LOCALIZATION_GUIDE.md`, `TAXONOMY_POLICY.md`, `LEXICON_REGISTRY` |
| **Architectural decisions** | **Lexicon-first gate** · tr/en independently authored — not literal translation |
| **Commit** | `04079dd`, `d669bbb` |

---

## Sprint 7.3 — Catch Reports

| | |
|---|---|
| **Purpose** | Community field evidence with editorial gate |
| **Major changes** | `catch_reports` schema; public submit on lure pages; Studio review; species top-lures by technique |
| **Architectural decisions** | **`techniqueId` required** on catch reports · only `APPROVED` reports public |
| **Commit** | `85e2c64` |

---

## Sprint 7.4 — Knowledge Acquisition Pipeline

| | |
|---|---|
| **Purpose** | Platform learns from sources without mirroring third-party content |
| **Major changes** | Knowledge schema; Studio inbox; audited approve/reject/merge |
| **Architectural decisions** | **Index metadata + URL only** — no republishing body text · no crawlers in this sprint |
| **Commit** | `7fd04fc` |

---

## Sprint 7.5 — Knowledge Hub & source intelligence

| | |
|---|---|
| **Purpose** | Central verified knowledge workspace with scoring and graph links |
| **Major changes** | Knowledge Hub UI; source scoring; related knowledge on lure/species pages; search integration |
| **Architectural decisions** | Knowledge graph prep for future AI; editor remains gate |
| **Commit** | `298958e` |

---

## Milestone — Production stability (public errors)

| | |
|---|---|
| **Purpose** | Zero unhandled 500s on angler-facing pages |
| **Major changes** | Runtime error handling, stability module, graceful degradation |
| **Architectural decisions** | Production-ready angler paths — no placeholder failures |
| **Commit** | `f5c7193` |

---

## Sprint 7.4.1 — Taxonomy & naming standard

| | |
|---|---|
| **Purpose** | Scientific taxonomy as canonical; separate aliases from confused species |
| **Major changes** | `SpeciesConfusion`, taxonomy module, species search disambiguation, reference species pair (Akya/Kuzu) |
| **Architectural decisions** | **Scientific name wins** · no city-level regional names · confused species ≠ aliases |
| **Commit** | `591d54e`, `90115e2`, `2d64766`, `496d4da` |

*Includes platform law commits: lexicon-first enforcement, **Species → Technique → Lure**, evolutionary domain design.*

---

## Sprint 8.0 — Brand & copy consistency

| | |
|---|---|
| **Purpose** | One angler voice across tr/en |
| **Major changes** | Brand statement, hero copy, locale pass; removed startup/AI marketing labels |
| **Architectural decisions** | Sound like experienced anglers — not a software company |
| **Commit** | `3d8ce9b` |

---

## Sprint 8.2 — Premium UI refresh

| | |
|---|---|
| **Purpose** | Presentation that inspires confidence |
| **Major changes** | Design tokens, page headers, EmptyState, Studio table polish, skeleton loaders |
| **Architectural decisions** | Presentation-only — no workflow redesign |
| **Commit** | `087a1aa` |

---

## Sprint 8.3 — Authority & trust experience

| | |
|---|---|
| **Purpose** | Visible expertise and source attribution on public pages |
| **Major changes** | Editorial module, author pages, `InformationSourceBadge`, `TrustIndicators` |
| **Architectural decisions** | **Every information block shows its source** · provenance ≠ verification in UI |
| **Commit** | `f8d639d` |

---

## Milestone — Working product (live catalog)

| | |
|---|---|
| **Purpose** | Every visible Studio action performs real work |
| **Major changes** | Static importers (Halco, Yo-Zuri, Maria, Shimano, Daiwa, Jackson); live dashboard; manufacturer pages; species hero images |
| **Architectural decisions** | Multi-manufacturer registry in production use |
| **Commit** | `f1169e9` |

---

## Milestone — Async Import Center

| | |
|---|---|
| **Purpose** | Imports never block HTTP (eliminate 504 timeouts) |
| **Major changes** | Queued `ImportBatch`, detached worker, status polling API |
| **Architectural decisions** | **Heavy work off request thread** — spawn background worker from Studio |
| **Commit** | `c557efb` |

---

## Epic 1 — Importer Framework & Real Catalog Population

| | |
|---|---|
| **Purpose** | Unify manufacturer imports into one production lifecycle; wire Studio batches to field diffs and live progress |
| **Major changes** | `manufacturer-import-pipeline.ts` (persist, reconcile, images, report); `upsertCanonicalImport` with `importBatchId`; editor HERO cover preserved on re-import; enhanced `ImportReport` (imported/updated/failed, image stats, per-product outcomes); Studio **Retry import** for failed batches; live `productsProcessed` during RUNNING |
| **Architectural decisions** | **One shared finalize path** for DUEL and static-json importers — no duplicated reconcile/image/report logic; deprecated `upsertDuelCanonicalImport` alias retained |
| **Commit** | `6f430b1` |

---

## Sprint 7.6B — Region system foundation (shipped)

| | |
|---|---|
| **Purpose** | Canonical fishing geography for editorial and catch-report context — not GIS |
| **Major changes** | `Region` Prisma model; five seeded water bodies; Studio list/edit/enable/sort/search at `/studio/regions` |
| **Architectural decisions** | **No FK wiring yet** — CatchReport still uses free-text `region`; FK relations deferred to future sprint · country/major water body scope only |

---

## Not yet shipped

| Sprint | Purpose |
|--------|---------|
| **7.7** | Angler-facing AI summaries with cited sources |

See [`AI_CONTEXT.md` § Current Roadmap](../AI_CONTEXT.md#current-roadmap).

---

*Update this file when a sprint closes. One row per sprint — link to `010_ANGLER_PRODUCT.md` or `PROJECT_STATE.md` for delivery detail.*
