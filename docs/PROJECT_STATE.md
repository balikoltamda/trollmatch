# Project State

**Document:** PROJECT_STATE  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Purpose:** Single source of truth for project progress  
**Last updated:** 2026-06-30  
**Maintainer:** Update this file at the end of every sprint or significant milestone.

---

## Current Sprint

**Sprint S003** — **Complete**

First Add Lure page at `/[locale]/add-lure`: mobile-first layout, drag-and-drop image zone (UI only), cascading manufacturer/model/variant/color autocompletes with mock data, live preview card, disabled save button. No API, upload, or AI.

---

## Current Phase

**Phase 1 — Platform Foundation** (roadmap §4, `009_ROADMAP.md`)

Partially complete: monorepo shell, UI app, PostgreSQL schema slice, Docker Compose, domain documentation. Not started: full platform kernel (users, claims, outbox), auth, taxonomy seeds, API server.

Early **Phase 2 / Phase B** work has started ahead of schedule (LureAtlas catalog tables, lure detail UI with mock data, domain model docs).

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
| **Sprint S003** | *(uncommitted)* | Add Lure page (`/[locale]/add-lure`) — form UI with mock autocompletes, image drop zone, preview card, disabled save |

---

## Current Branch

`main` — up to date with `origin/main`

Remote: `https://github.com/balikoltamda/trollmatch.git`

---

## Last Commit

| Field | Value |
|-------|-------|
| **Hash** | `d07f17d` |
| **Message** | refactor(core): modular project structure |
| **Date** | 2026-06-30 |

---

## Next Planned Sprint

**Sprint 4 — Platform kernel OR catalog ingestion** (product owner to prioritize)

Recommended sequence per `005_BACKLOG.md`:

1. **Phase A remainder (P0):** BL-003–BL-011 — migrations CI proof, platform user/claims/outbox tables, taxonomy seeds (500 species, core techniques)
2. **Phase B start:** BL-020–BL-026 — complete LureAtlas schema alignment with `007`, Knowledge Claims, ingestion pipeline
3. **Wire Add Lure form** — connect S003 UI to API when catalog write path exists

Parallel UI track: wire lure detail page to real data (BL-042).

---

## Blockers

| Blocker | Impact | Mitigation |
|---------|--------|------------|
| **`api/` not initialized** | No REST layer; UI uses mock repository only | BL-001; Fastify scaffold per `008_TECH_STACK.md` |
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

Full ADR list: `docs/004_DECISIONS.md` (ADR-001 through ADR-015).

---

## Current Architecture Status

### Repository layout

| Path | Status | Notes |
|------|--------|-------|
| `docs/` | **Rich** | Charter, architecture, backlog, domain model, UI specs |
| `ui/` | **Active** | Next.js 15, App Router, i18n, modular `src/modules/`, `src/shared/`, lure detail (mock), Prisma client |
| `api/` | **Empty** | Planned Fastify REST + workers |
| `shared/` (repo root) | **Empty** | Planned monorepo-wide Zod schemas + domain types |
| `database/` | **Empty** | Migrations live in `ui/prisma/` today |
| `research/` | **Placeholder** | Evidence pipeline not wired |
| `docker-compose.yml` | **Active** | PostgreSQL 16; UI service under `full` profile |

### UI source layout (`ui/src/`)

| Path | Status | Notes |
|------|--------|-------|
| `modules/lure/` | **Active** | Lure detail + Add Lure form (`components/add-lure/`), services, repositories, types, mock data |
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

**Applied migrations (3):**

1. `20250630140000_lure_atlas_core` — catalog core  
2. `20250701120000_canonical_product_identity` — Color, ProductAlias, ColorAlias  
3. `20250701130000_canonical_species_identity` — SpeciesScientificName, SpeciesCommonName, SpeciesAlias  

**Not yet in schema:** Platform User, Knowledge Claim, Provenance Attribution, Verification Event, Localized Text rows, Slug Registry, Outbox, Meilisearch sync, Usage Assertion, Catch Report, Moderation Case (per `007` long-horizon model).

### UI

| Capability | Status |
|------------|--------|
| App shell, header, footer, locale switcher | Done |
| Home route (empty) | Done |
| Lure detail page | Done — **mock data only** |
| Add Lure page | Done — **UI only** (`/[locale]/add-lure`); save disabled, mock autocompletes |
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
| Docker Compose (Postgres) | Configured |
| `npm run db:migrate` / `db:check` | Scripts present |
| CI (GitHub Actions) | Not configured |
| Production deploy | Not configured — `guide.balikoltamda.net` planned |

### Charter goals (G1–G5) snapshot

| Goal | Progress |
|------|----------|
| G1 — Trustworthy lure reference | Early — schema + 1 mock UI page; 0 curated records |
| G2 — Bilingual experience | UI i18n framework done; content mostly mock |
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
| `docs/004_DECISIONS.md` | ADRs |

---

*Update this file when a sprint closes, a phase gate is passed, or a blocker is resolved.*
