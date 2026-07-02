# Project State

**Document:** PROJECT_STATE  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Purpose:** Single source of truth for project progress  
**Last updated:** 2026-07-02  
**Maintainer:** Update this file at the end of every sprint or significant milestone.

---

## Current Sprint

**Sprint S015 — DUEL Mapper** — **Complete**

`ui/src/modules/import/providers/duel/duel-mapper.ts` — maps `DuelParsedProduct` → `CanonicalLureImport` with normalized length, weight, diving depth, buoyancy, technique tags, colors, images, and product codes. Parser delegates mapping; no Prisma, UI, or import framework changes.

---

## Current Phase

**Phase 1 — Platform Foundation** (roadmap §4, `009_ROADMAP.md`)

Partially complete: monorepo shell, UI app, PostgreSQL schema slice, Docker Compose, domain documentation, DB-backed lure detail. Not started: full platform kernel (users, claims, outbox), auth, taxonomy seeds, API server.

Early **Phase 2 / Phase B** work has started ahead of schedule (LureAtlas catalog tables, lure detail UI, domain model docs, end-to-end import).

---

## Completed Sprints

| Sprint | Commit(s) | Deliverables |
|--------|-----------|--------------|
| **Sprint 0** | `e6b3b74` | Project charter stack, architecture docs, ADRs, backlog, roadmap, cursor rules |
| **Sprint 1** | `3d97589` | Next.js 15 app in `ui/`, TypeScript, Tailwind, ESLint, Prettier, shadcn/ui, Prisma, Docker Compose, health endpoint, i18n (tr/en), npm workspaces |
| **Sprint 2** | `86c5b90` | Lure detail page (`/[locale]/lures/[slug]`) with mock data, reusable section components |
| **Sprint 2.1** | `4a2beb8` | Initial LureAtlas Prisma schema (Manufacturer, ProductLine, LureModel, LureVariant, Image, FishSpecies, Technique, joins) |
| **Sprint 2.2** | `e03a121`, `d45c8fe` | Lure domain model doc, PostgreSQL dev wiring, env layout, `db:check` script, security fix for tracked env files |
| **Sprint Foundation F001** | `149de4c` | Canonical product identity: `Color`, `ColorAlias`, `ProductAlias`; variant → color FK |
| **Sprint Foundation F002** | `294a9f4` | Canonical species identity: `SpeciesScientificName`, `SpeciesCommonName`, `SpeciesAlias` |
| **Refactor Sprint R001** | `d07f17d` | Move `src/features/lures` → `src/modules/lure`; add empty `species`, `technique`, `manufacturer` modules; scaffold `src/shared/{db,ai,auth,seo,utils,types}` |
| **Sprint S003** | `5d06937` | Add Lure page (`/[locale]/add-lure`) — form UI with mock autocompletes, image drop zone, preview card, disabled save |
| **Sprint S004** | `382a2b7` | Import framework interfaces (`modules/import/`) — parser, validator, mapper, job, provider contracts |
| **Sprint S005** | `679bdcd` | `CanonicalLureImport` DTO — canonical import contract for all manufacturer mappers |
| **Sprint S006** | `b8d1576` | Demo importer — static JSON → `CanonicalLureImport`; `npm run import:demo` |
| **Sprint S007** | `65e6302` | End-to-end import — JSON → canonical → Prisma (transactional, dedupe); `npm run import:run` |
| **Sprint S008** | `20777cc` | Manufacturer registry YAML configs (`manufacturer-registry/*.yaml`) |
| **Sprint S009** | `233edf1` | `PrismaLureRepository` — lure detail reads from PostgreSQL; enrichment data isolated for non-catalog UI sections |
| **Sprint S010** | `9bb48a8`* | `docs/connectors/DUEL_CONNECTOR.md` — DUEL manufacturer connector specification |
| **Sprint S011** | `c4f04dd` | DUEL fetcher — raw HTML snapshots; `npm run import:duel:fetch` |
| **Sprint S012** | `9bb48a8` | `docs/connectors/DUEL_FETCHER_REPORT.md` — snapshot field verification |
| **Sprint S013** | `d96e48d` | DUEL HTML parser — snapshots → `CanonicalLureImport`; `npm run import:duel:parse` |
| **Sprint S014** | `248319c` | Manufacturer lifecycle schema + `docs/domain/MANUFACTURER_LIFECYCLE.md` — policy only, no runtime logic |
| **Sprint S015** | *(uncommitted)* | DUEL mapper — parsed product → normalized `CanonicalLureImport`; `duel-mapper.ts` |

\* S010 spec landed in repo with S011 fetcher commit `c4f04dd` (combined push).

---

## Current Branch

`main` — up to date with `origin/main`

Remote: `https://github.com/balikoltamda/trollmatch.git`

---

## Last Commit

| Field | Value |
|-------|-------|
| **Hash** | `248319c` |
| **Message** | feat(domain): manufacturer lifecycle model |
| **Date** | 2026-07-02 |

---

## Next Planned Sprint

**Sprint S016 — DUEL provider wiring or lifecycle reconciler** (product owner to prioritize)

Recommended sequence:

1. **Wire DUEL parser + mapper to `ManufacturerImportProvider`** — validate + optional persist for `pid=1332`
2. **`IngestionBatch` table + batch completion hook** — per `MANUFACTURER_LIFECYCLE.md` §9
3. **Lifecycle reconciler job** — observed-key set → `ACTIVE` / `MISSING` / `DISCONTINUED` transitions
4. **JP snapshot fetch** — JAN/UPC rows from `detail.php` (per fetcher report)
5. **Add `manufacturer-registry/duel.yaml`**

---

## Blockers

| Blocker | Impact | Mitigation |
|---------|--------|------------|
| **`api/` not initialized** | No REST layer; UI reads DB via repository in Next.js server components | BL-001; Fastify scaffold per `008_TECH_STACK.md` |
| **Root `shared/` empty** | Monorepo-level Zod types not yet extracted | BL-001; `ui/src/shared/` scaffolded in R001 |
| **Platform kernel tables missing** | No Knowledge Claim, Provenance, User, Outbox | BL-004–BL-009 |
| **No taxonomy seed data** | Catalog and filters cannot be populated | BL-010, BL-011 |
| **Migrations not verified on all dev machines** | Schema drift risk | Run `npm run db:up`, `db:migrate`, `db:check` locally |
| **Stack doc drift** | `008_TECH_STACK.md` specifies Drizzle; implementation uses Prisma in `ui/` | ADR update or align ORM choice in Sprint 3 |
| **Auth not implemented** | Contributor/moderator flows blocked | BL-012 |
| **Legacy `FishSpecies.scientificName` column** | Duplicates `SpeciesScientificName` until migration | Data backfill + column deprecation in future sprint |

---

## Important Decisions

| Decision | Source | Status |
|----------|--------|--------|
| Modular monolith, single deployable unit initially | ADR-001, `004_DECISIONS.md` | Active |
| PostgreSQL as system of record | ADR-002 | Active — Postgres 16 in Docker Compose |
| Next.js 15 App Router for public UI | ADR-005, charter | Active — `ui/` |
| Turkish + English at launch | Charter G2 | Active — next-intl, default `tr` |
| Knowledge Claim + Provenance separation | ADR-006, `007_DATABASE_VISION.md` | Documented — **not yet in schema** |
| LureAtlas first module | Charter §10 | Active |
| Prisma ORM in `ui/` (implementation choice) | Sprint 1–2 | Active — **differs from 008 Drizzle note** |
| Canonical product identity via Color + aliases | F001 | **In schema** |
| Canonical species identity via scientific/common/alias tables | F002 | **In schema** |
| Commerce isolated from ranking | Charter §17 | Policy only — no sponsored links code yet |
| Env files not committed (`.env.local` for secrets) | `d45c8fe` | Active |
| UI domain code under `src/modules/`; cross-cutting code under `src/shared/` | R001 | Active |
| Manufacturer imports via `ManufacturerImportProvider` (parse → validate → map) | S004 | Active — interfaces only |
| `CanonicalLureImport` as universal mapper target | S005 | Active |
| Demo importer proves parse → validate → canonical map pipeline | S006 | Active |
| Manufacturer registry YAML drives future connector selection | S008 | Active — config only |
| Lure detail reads catalog from PostgreSQL via `PrismaLureRepository` | S009 | Active — enrichment for non-schema UI sections |
| DUEL connector spec drives future `duel` provider | S010 | Active — `docs/connectors/DUEL_CONNECTOR.md`; no code |
| DUEL fetcher saves raw HTML snapshots only | S011 | Active — `import:duel:fetch` |
| DUEL parser maps snapshots → `CanonicalLureImport` | S013 | Active — `import:duel:parse`; no persistence |
| Manufacturer feed lifecycle on `lure_models`; importers never delete catalog rows | S014 | Active — schema + `docs/domain/MANUFACTURER_LIFECYCLE.md`; reconciler not implemented |
| `ManufacturerProductStatus` separate from editorial `ContentLifecycleState` | S014 | Active — `ACTIVE` / `MISSING` / `DISCONTINUED` / `UNKNOWN` |
| DUEL mapper normalizes parse output to `CanonicalLureImport` | S015 | Active — `duel-mapper.ts`; parser delegates; no persistence |

Full ADR list: `docs/004_DECISIONS.md` (ADR-001 through ADR-015).

---

## Frozen Decisions (until Milestone 1)

The following architecture decisions are **frozen** until Milestone 1 is complete. Do not refactor, rename, or replace these without explicit product-owner approval.

| Area | Frozen scope | Current implementation |
|------|--------------|------------------------|
| **Folder structure** | Monorepo layout; `ui/src/modules/*`, `ui/src/shared/*`, `ui/src/app/*` | R001 — `modules/lure`, `modules/import`, placeholder `species` / `technique` / `manufacturer` |
| **Prisma core schema** | LureAtlas catalog tables in `ui/prisma/schema.prisma` (Manufacturer → Variant, Color, aliases, species identity, manufacturer lifecycle on `lure_models`) | Sprint 2.1, F001, F002, S014 — migrations through `20250702120000_manufacturer_product_lifecycle` |
| **Canonical Identity** | Color + ProductAlias + ColorAlias; SpeciesScientificName + CommonName + Alias | F001, F002 — variant requires `colorId`; no duplicate identity models |
| **Import Framework** | `ManufacturerImportProvider` pipeline: parse → validate → map → `CanonicalLureImport` → persistence | S004–S007 — `modules/import/{core,parsers,validators,mappers,jobs,providers,persistence}` |
| **Module naming** | Domain modules under `ui/src/modules/` (`lure`, `import`, `species`, `technique`, `manufacturer`); no return to `features/` | R001, S004 |

**Milestone 1 exit** (indicative): first real manufacturer catalog in Postgres, lure detail reads from DB, platform kernel or ingestion batch audit in place — see `009_ROADMAP.md` Phase 1 gate.

---

## Change Control Policy

Changes are classified into three levels.

### Level 1 — Allowed

These changes may be implemented immediately.

- Bug fixes
- Performance improvements
- UI polish
- Documentation updates
- Tests
- Small refactoring without architectural impact

### Level 2 — Requires Approval

These require explicit Product Owner approval.

- Database schema changes
- New modules
- New folders
- Route changes
- API contract changes
- Import pipeline changes
- Canonical model changes

### Level 3 — Forbidden Until Milestone Completion

These are frozen.

- Folder structure
- Core module names
- Canonical identity model
- Import framework
- Prisma core entities

---

## Current Architecture Status

### Repository layout

| Path | Status | Notes |
|------|--------|-------|
| `docs/` | **Rich** | Charter, architecture, backlog, domain model, manufacturer lifecycle policy, UI specs, connector specs |
| `ui/` | **Active** | Next.js 15, App Router, i18n, modular `src/modules/`, `src/shared/`, lure detail (PostgreSQL), Prisma client |
| `api/` | **Empty** | Planned Fastify REST + workers |
| `shared/` (repo root) | **Empty** | Planned monorepo-wide Zod schemas + domain types |
| `database/` | **Empty** | Migrations live in `ui/prisma/` today |
| `research/` | **Active** | DUEL HTML snapshots under `manufacturers/duel/snapshots/` (S011 fetcher) |
| `manufacturer-registry/` | **Active** | Declarative YAML configs per manufacturer (S008) |
| `docker-compose.yml` | **Active** | PostgreSQL 16; UI service under `full` profile |

### UI source layout (`ui/src/`)

| Path | Status | Notes |
|------|--------|-------|
| `modules/import/` | **Active** | Framework + demo provider + persistence + DUEL fetcher/parser/mapper |
| `modules/lure/` | **Active** | Lure detail (DB-backed) + Add Lure form (`components/add-lure/`), services, repositories, types, enrichment data |
| `modules/species/` | **Placeholder** | Empty — future SpeciesCompass module |
| `modules/technique/` | **Placeholder** | Empty — future TechniqueLibrary module |
| `modules/manufacturer/` | **Placeholder** | Empty — future manufacturer module |
| `shared/db/` | **Placeholder** | Cross-cutting database helpers (future) |
| `shared/ai/` | **Placeholder** | AI/RAG integration (future) |
| `shared/auth/` | **Placeholder** | Auth helpers (future) |
| `shared/seo/` | **Placeholder** | SEO/metadata utilities (future) |
| `shared/utils/` | **Placeholder** | Shared utilities (future; `lib/utils.ts` still in use) |
| `shared/types/` | **Placeholder** | Shared TypeScript types (future) |
| `app/` | **Active** | Routes, layouts, API health |
| `components/` | **Active** | App shell, shadcn/ui |
| `lib/` | **Active** | Prisma client, env, utils (unchanged in R001) |
| `i18n/` | **Active** | next-intl routing and navigation |

### Database (Prisma / PostgreSQL)

**Applied migrations (4):**

1. `20250630140000_lure_atlas_core` — catalog core  
2. `20250701120000_canonical_product_identity` — Color, ProductAlias, ColorAlias  
3. `20250701130000_canonical_species_identity` — SpeciesScientificName, SpeciesCommonName, SpeciesAlias  
4. `20250702120000_manufacturer_product_lifecycle` — `ManufacturerProductStatus` + lifecycle columns on `lure_models` (S014)  

**Not yet in schema:** Platform User, Knowledge Claim, Provenance Attribution, Verification Event, Localized Text rows, Slug Registry, Outbox, Meilisearch sync, Usage Assertion, Catch Report, Moderation Case (per `007` long-horizon model).

### UI

| Capability | Status |
|------------|--------|
| App shell, header, footer, locale switcher | Done |
| Home route (empty) | Done |
| Lure detail page | Done — **PostgreSQL via `PrismaLureRepository`** (run `npm run import:run` first; slug `laser-pro-190-dd`) |
| Add Lure page | Done — **UI only** (`/[locale]/add-lure`); save disabled, mock autocompletes |
| Import pipeline | Done — `import:demo`; `import:run` (persist); `import:duel:fetch` + `import:duel:parse` (DUEL snapshots → canonical JSON via mapper, no DB) |
| Browse / search / compare | Not started |
| Auth / contributor flows | Not started (Add Lure UI precedes auth gate) |

### API & integrations

| Service | Status |
|---------|--------|
| REST API | Not started |
| Meilisearch | Not started |
| Object storage (S3) | Not started |
| Auth (OAuth / email) | Not started |
| AI / RAG | Not started |
| Sponsored links (L10) | Not started |

### DevOps & quality

| Item | Status |
|------|--------|
| GitHub remote + main branch | Active |
| Docker Compose (Postgres) | Configured — required for `import:run` |
| `npm run db:migrate` / `db:check` | Scripts present |
| CI (GitHub Actions) | Not configured |
| Production deploy | Not configured — `guide.balikoltamda.net` planned |

### Charter goals (G1–G5) snapshot

| Goal | Progress |
|------|----------|
| G1 — Trustworthy lure reference | Early — end-to-end import + DB-backed lure detail for imported catalog |
| G2 — Bilingual experience | UI i18n framework done; catalog fields bilingual in DB; enrichment/mock sections for non-schema UI |
| G3 — Community contribution | Early — Add Lure form UI (no submit yet) |
| G4 — Data provenance | Documented; not in runtime |
| G5 — Modular foundation | Partial — `ui/src/modules/` layout in place; api/root shared/database pending |

---

## Related documents

| Document | Role |
|----------|------|
| `docs/001_PROJECT_CHARTER.md` | Vision, scope, goals |
| `docs/005_BACKLOG.md` | Prioritized work items |
| `docs/009_ROADMAP.md` | Phase timeline |
| `docs/007_DATABASE_VISION.md` | Long-horizon data model |
| `docs/domain/LURE_DOMAIN_MODEL.md` | Lure business domain |
| `docs/domain/MANUFACTURER_LIFECYCLE.md` | Manufacturer feed lifecycle policy (S014) |
| `docs/004_DECISIONS.md` | ADRs |
| `docs/connectors/DUEL_CONNECTOR.md` | DUEL manufacturer connector specification |

---

*Update this file when a sprint closes, a phase gate is passed, or a blocker is resolved.*
