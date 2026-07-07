# TrollMatch

> **AI agents: read this file first.** It is the single onboarding entry point. Do not read the whole repo before starting — use the Reading Order section when you need depth.

**TrollMatch** is the private engineering repository for **Balık Oltamda Guide** — a global, bilingual (Turkish and English) fishing **knowledge platform** planned at `guide.balikoltamda.net`. It is **not** an e-commerce website: there is no cart, checkout, inventory, or payment processing. Commerce may appear only as optional, clearly labeled sponsored outbound links when users explicitly seek purchase options.

**Mission:** Collect, verify, and organize the world's fishing knowledge. The product is built around **real angling experience** — structured field reports, editorial review, manufacturer specifications, and community evidence — not generic AI guesswork or undifferentiated content.

The first module is **LureAtlas** (artificial lure catalog and discovery). Parent brand **Balık Oltamda** (Cyprus tackle retailer) is editorially independent from the Guide.

**What TrollMatch is NOT:** a shop, a forum, a wiki without moderation gates, an AI chatbot that guesses specs, or a content farm. It does not share a production database with balikoltamda.net retail.

**Editorial lens:** Eastern Mediterranean (Aegean, Cyprus, Turkish coasts) is the default regional context — but the platform is global in ambition.

**Brand voice:** Sound like an experienced angler, not a software company. TR tagline: *Gerçek av tecrübeleriyle doğrulanmış balıkçılık platformu.*

---

# Getting Started (Dev)

Developed on **Windows**, deployed to **Linux**. npm **workspaces** monorepo — run all commands from **repo root**; app code lives in `ui/`.

```bash
npm install
npm run db:up              # Postgres 16 via Docker
# Create ui/.env.local with:
#   DATABASE_URL=postgresql://trollmatch:trollmatch@localhost:5432/trollmatch
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000
npm run db:migrate         # apply Prisma migrations
npm run dev                # http://localhost:3000/tr (default locale)
```

**Path alias:** `@/` → `ui/src/` (e.g. `@/modules/discovery`, `@/lib/prisma`).

| Command | Purpose |
|---------|---------|
| `npm run verify` | lint + typecheck + build — **run before every commit** |
| `npm run db:check` | verify DB connectivity |
| `npm run import:run -- duel` | CLI import (`duel` is default when code omitted) |
| `npm run import:batch -- <id>` | run queued Studio batch manually |

**Required env** (`ui/.env.local`): `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`. Never commit secrets.

**Prisma:** schema at `ui/prisma/schema.prisma` · client import `@/generated/prisma/client` · singleton at `@/lib/prisma`.

---

# Current Status

## Completed work (high level)

Angler-facing product sprints (see `docs/010_ANGLER_PRODUCT.md` for full delivery record):

| Sprint | Delivered |
|--------|-----------|
| **7.1** | Discovery loop — `/search`, `/lures`, `/species`, species detail, live DB wiring |
| **7.2** | Fishing Lexicon foundation — terminology docs + `LEXICON_REGISTRY` |
| **7.3** | Catch Reports — public submit, Studio review, species/lure surfacing |
| **7.4** | Knowledge Acquisition Pipeline — schema, Studio inbox, audited actions |
| **7.4.1** | Taxonomy & naming — `SpeciesConfusion`, search disambiguation |
| **7.5** | Knowledge Hub — source scoring, graph relations, public related-knowledge |
| **8.0** | Brand & copy consistency — angler voice, full locale pass |
| **8.2** | Premium UI refresh — design tokens, discovery/detail/Studio presentation |
| **8.3** | Authority & trust UX — editorial module, author pages, source badges |
| **Working product** | Real manufacturer imports (Halco, Yo-Zuri, Maria, Shimano, Daiwa, Jackson, DUEL), live catalog |
| **Prod stability** | Async Import Center — queued batches, detached worker, polling (no 504 timeouts) |

Foundation: Next.js 15 app, Prisma + PostgreSQL, import framework, unified import runner, DUEL connector, Docker Compose, GitHub CI.

## Current sprint

**Next: Sprint 7.6 — Regional experience** (`docs/010_ANGLER_PRODUCT.md`)

Goal: every lure page answers *"How does this work here?"* — surface regional editor notes, Eastern Mediterranean lens, collections by region + species + technique, **replace enrichment mocks with real approved catch reports** in trust/community stats.

**Following:** Sprint 7.7 — AI summaries (angler-facing, cited sources, lexicon-resolved vocabulary).

## Current architecture

**Modular monolith** — one deployable Next.js app today; boundaries allow future split.

| Layer | Reality today |
|-------|---------------|
| **UI + server logic** | `ui/` — Next.js 15 App Router, server components, minimal API routes in `ui/src/app/api/` |
| **Database** | PostgreSQL 16; Prisma schema + migrations in `ui/prisma/` |
| **API server** | Root `api/` — **empty scaffold**; no separate REST service |
| **Shared types** | Root `shared/` — **empty scaffold**; cross-cutting code in `ui/src/shared/` |
| **SQL migrations (planned)** | Root `database/` — **empty scaffold** |
| **Research** | `research/` — evidence only; never read at production request time |

Public catalog reads PostgreSQL via Prisma in Next.js server code. Search is Prisma-backed (Meilisearch deferred). Imports run as CLI/background workers, not inline HTTP.

## Current modules (`ui/src/modules/`)

| Module | Role |
|--------|------|
| **discovery** | Public catalog queries, species/lure browse, search, visibility rules |
| **lure** | Lure detail pages, sections, add-lure form UI, `PrismaLureRepository` |
| **catch-report** | Public submit forms, lure/species surfacing, Studio review panel |
| **taxonomy** | Species search, disambiguation, taxonomy sections, reference seeds |
| **terminology** | Fishing Lexicon types + `LEXICON_REGISTRY` seed data |
| **editorial** | Author registry, attribution, editorial notes |
| **trust** | Trust indicators, source badges; still uses enrichment mock for some stats |
| **knowledge-pipeline** | Knowledge Hub, source scoring, graph links, public related knowledge |
| **import** | Manufacturer importers, canonical DTO, registry, persistence, DUEL connector |
| **studio** | Editor UI — products, imports, community, knowledge, media |
| **home** | Homepage feed and layout |
| **stability** | Error/loading/empty states |
| **species**, **manufacturer**, **technique** | Scaffolded placeholders |
| **add-lure** (`/[locale]/add-lure`) | Form UI only — save disabled; not production workflow yet |

## Studio

Editor-facing surface at `/studio` — **no auth gate yet** (settings page notes this ships later).

| Route | Purpose |
|-------|---------|
| `/studio` | Dashboard — live DB stats, recent import batches |
| `/studio/products`, `/studio/products/[id]` | Catalog editing, completeness, verification |
| `/studio/import`, `/studio/import/batch/[id]` | Import Center — queue batches, poll status |
| `/studio/community/reports` | Catch report approve/reject/merge |
| `/studio/knowledge` | Knowledge Hub inbox |
| `/studio/notes` | Editorial notes |
| `/studio/manufacturers` | Manufacturer management |
| `/studio/media` | Image assets |

Logic: `ui/src/modules/studio/` (data loaders, server actions in `actions/`). Studio actions perform real DB work with audit trails where implemented.

## Importer

Pipeline: **Discover → Download → Parse → Normalize → Persist → Images → Audit → Report** (shared in `ui/src/modules/import/pipeline/manufacturer-import-pipeline.ts`).

| Entry point | Purpose |
|-------------|---------|
| `npm run import:run -- [code]` | Unified CLI import |
| `npm run import:batch -- <batch-id>` | Detached worker for queued Studio batches |
| `ui/src/modules/import/registry/registered-manufacturers.ts` | **Register new manufacturers here** |
| `ui/src/modules/import/pipeline/manufacturer-import-pipeline.ts` | Shared persist, lifecycle reconcile, images, reports |
| `ui/src/modules/import/persistence/canonical-import-persister.ts` | Canonical Prisma upsert (all manufacturers) |
| `research/manufacturers/` | Source snapshots and static catalog JSON |

Imports upsert catalog rows, set **manufacturer feed status**, and create new models as `PENDING_REVIEW` — they do **not** auto-publish editorial content, bypass moderation, overwrite editor-selected cover (HERO) images, or delete catalog rows. Default provider: **duel** (live crawl); others use static JSON under `research/manufacturers/<slug>/products/`.

## Discovery (public routes)

All public pages are locale-prefixed: `/tr/...` and `/en/...` (default locale: **tr**).

| Route | Purpose |
|-------|---------|
| `/[locale]/` | Homepage — live DB feed + static fallback |
| `/[locale]/search?q=` | Full-text search (catalog + knowledge) |
| `/[locale]/lures` | Browse lures |
| `/[locale]/lures/[slug]` | Lure detail |
| `/[locale]/species` | Species index |
| `/[locale]/species/[slug]` | Species detail — lure rankings **by technique** |
| `/[locale]/manufacturers/[slug]` | Manufacturer page |
| `/[locale]/authors/[slug]` | Editorial author profile |

`/studio` and `/api` are **outside** locale middleware.

## Trust

**Today:** `InformationSourceBadge`, `TrustIndicators`, author attribution, editorial notes from DB, catch report verification status, knowledge pipeline audit.

**Still mock (Sprint 7.6 target):** `ui/src/modules/lure/data/lure-detail-enrichment.ts` feeds community stats and some trust fields on lure pages — replace with real approved catch reports, not new mocks.

**Long-horizon (`007`):** Knowledge Claim + Provenance Attribution + Verification Event — partially in schema/docs; implement incrementally.

## Terminology

Fishing Lexicon: `ui/src/modules/terminology/` + `docs/fishing/TERMINOLOGY.md`. Standards defined; **full app-wide wiring ongoing** — lexicon-first gate applies to all new vocabulary.

## Taxonomy

Species module: `ui/src/modules/taxonomy/`. Scientific name canonical; preferred tr/en names; aliases vs `SpeciesConfusion` separated. Reference pair: *Lichia amia* (Akya) ↔ *Seriola dumerili* (Kuzu).

---

# Core Product Philosophy

Platform laws — override convenience and generic web-app patterns.

| Law | Meaning |
|-----|---------|
| **Scientific taxonomy is canonical** | Latin name identifies a fish; common names are display/search layers only |
| **Lexicon first** | No fishing terminology or taxonomy in code, copy, seeds, or data without a Fishing Lexicon entry first |
| **Species → Technique → Lure** | Effectiveness and recommendations require all three — never bare Species → Lure |
| **Probability-based recommendations** | Field evidence accumulates under context — not guaranteed outcomes |
| **Manufacturer ≠ editorial** | Factory specs and packaging claims ≠ community effectiveness and editor-verified knowledge |
| **AI assists. Humans verify.** | AI drafts and summarizes; canonical publication requires human/editorial action |
| **Real fishing experience is highest-value evidence** | Verified catch reports outrank marketing and model inference |
| **Evolutionary domain design** | Model only what the current product needs; defer sub-techniques, advanced rigging, presentation matrices |
| **Never over-model** | `007_DATABASE_VISION.md` is the long-horizon map — not a build-everything checklist |

**Feature gate (angler-facing work):** *Will this make TrollMatch more valuable than ChatGPT for anglers?* Advantage = verified knowledge + structured relationships + editorial trust — not raw AI.

---

# Fishing Knowledge Rules

Summaries only — authoritative detail in linked docs.

## TERMINOLOGY.md

The **Fishing Lexicon** is canonical vocabulary — **not** a translation dictionary.

- Stable `id`, domain, independently authored `preferred.en` / `preferred.tr`, aliases, regional/scientific terms, full `notes`.
- **Order of work:** lexicon entry in `ui/src/modules/terminology/data/` → update `TERMINOLOGY.md` → then wire UI/search/seeds/importers.
- Aliases power search and importers; deprecated terms never appear in primary UI.
- Exemplars: `leader`, `fishing-line`, *Lichia amia*, *Seriola dumerili*.

## TAXONOMY_POLICY.md

- One `FishSpecies` per taxon; **scientific name always wins**.
- Preferred tr/en names align with lexicon — independently authored, not literal translation.
- **Aliases** = same species only. **`SpeciesConfusion`** = different species anglers mix up — never aliases.
- Regional names: country or major region only (`TR`, `KKTC`) — **no city-level names**.
- Search disambiguates misapplied names with explicit editorial reason.

## SPECIES_TECHNIQUE_LURE_POLICY.md

```
ALLOWED:   Species → Technique → Lure
FORBIDDEN: Species → Lure (for effectiveness or rankings)
```

- Catch reports require `techniqueId`.
- Species "top lures" = **per-technique sections**, not species-wide rankings.
- `LureSpecies` = catalog metadata (`MANUFACTURER_MARKETING`, `MODERATOR_CURATED`) — not effectiveness UI.
- AI summaries must cite technique when claiming effectiveness.

## LOCALIZATION_GUIDE.md

- Turkish and English are **independently localized angler languages** — machine translation forbidden for preferred labels.
- Turkish: Türkiye / Northern Cyprus sport-fishing usage; loanwords (Leader, trolling) valid when angler-natural.
- Forbidden: Beden ← Leader, Lider ← Leader.
- UI strings: `ui/messages/tr.json` and `ui/messages/en.json` via next-intl — do not hardcode new user-facing copy.

---

# Architecture

## Repository layout

```
trollmatch/
├── ui/                      # Next.js app — ONLY active application code
│   ├── prisma/              # Schema + migrations
│   ├── messages/            # tr.json, en.json
│   └── src/
│       ├── app/             # Routes (thin) — [locale]/ public, studio/, api/
│       ├── modules/         # Domain logic (primary work location)
│       ├── components/      # Shared UI components
│       ├── lib/             # prisma, env, utilities
│       └── generated/prisma # Generated client — do not edit
├── api/                     # Empty scaffold (future REST)
├── database/                # Empty scaffold (future shared migrations)
├── shared/                  # Empty scaffold (future monorepo types)
├── research/                # Evidence — NOT production runtime
├── docs/                    # Authoritative documentation
├── manufacturer-registry/   # Importer YAML configs
└── AI_CONTEXT.md            # This file
```

## Contributing conventions

| Rule | Detail |
|------|--------|
| **Work location** | Domain logic in `ui/src/modules/<module>/`; keep `app/` routes thin |
| **Server actions** | `ui/src/modules/<module>/actions/` or `studio/actions/` |
| **Data access** | Prisma via `@/lib/prisma`; repositories in `modules/*/repositories/` |
| **Validation** | Zod at HTTP/action boundaries (`ui/src/lib/env.ts` pattern) |
| **Types** | TypeScript strict; prefer existing types over duplication |
| **Diff scope** | Smallest correct change; edit over rewrite; no unrelated refactors |
| **New manufacturers** | Register in `registered-manufacturers.ts`; static JSON under `research/manufacturers/<slug>/products/` |
| **New migrations** | `npm run db:migrate:dev` from repo root; never hand-edit applied migrations |
| **Turkish slugs** | Never raw `toLowerCase()` — locale-aware utilities (ADR-011) |
| **Public visibility** | Only lures with `lifecycleState` in `PUBLISHED` or `READY` and `deletedAt: null` — see `discovery/lib/public-visibility.ts` |

## Key data concepts

**Two independent lifecycles — do not conflate:**

| Concept | Enum | Meaning |
|---------|------|---------|
| **Editorial lifecycle** | `ContentLifecycleState` | `DRAFT` → `PENDING_REVIEW` → `READY` / `PUBLISHED` / `REJECTED` / `DEPRECATED` |
| **Manufacturer feed status** | `ManufacturerProductStatus` | `ACTIVE` / `MISSING` / `DISCONTINUED` / `UNKNOWN` — importers set this; importers never delete rows |

**Core models agents touch often:**

| Model | Role |
|-------|------|
| `Manufacturer` → `ProductLine` → `LureModel` → `LureVariant` | Catalog hierarchy |
| `FishSpecies`, `SpeciesAlias`, `SpeciesConfusion` | Taxonomy |
| `Technique` | Required on catch reports and effectiveness rankings |
| `CatchReport` | Community field evidence — species + lure + **technique** + region |
| `LureEditorNote` | Editorial regional/technique notes (Sprint 7.6 surfaces these) |
| `ImportBatch` | Async import job state |
| `KnowledgeItem`, `KnowledgeSource` | Knowledge Hub — public only when `status: APPROVED`; store metadata + URL, **never republish third-party body text** |
| Author registry (code) | `editorial/data/authors.ts` — not a DB table; attribution on notes |

Full long-horizon model: `docs/007_DATABASE_VISION.md` — implement slices only when a sprint requires them.

## Importer pipeline

```
Discover → Download → Parse → Normalize
    → canonical-lure-validator
    → persistValidatedRecords() (per-product isolation; links ImportBatch field diffs)
    → reconcileManufacturerLifecycle() (MISSING / DISCONTINUED)
    → downloadManufacturerImages() (SHA-256 dedupe; never replaces editor HERO)
    → ImportReport JSON in research/import/
```

**Studio async flow:**

1. User clicks Import (or **Retry import** after failure) → `createQueuedImportBatch()` → status `QUEUED` → HTTP 200
2. `spawnImportBatchWorker()` spawns detached `npx tsx scripts/run-import-batch.ts <id>`
3. Worker passes `importBatchId` to importer; updates `productsProcessed` during run
4. Worker: `QUEUED` → `RUNNING` → `COMPLETED` | `FAILED` | `CANCELLED`
5. UI polls `GET /api/studio/import/batch/[id]` every 2s — survives browser close

## Catch reports

Public quick-submit on lure pages (~30s form) via `catch-report/actions/catch-report-actions.ts`. Requires species + lure variant + **technique** + country + region + date.

Verification: `PENDING` → Studio review → `APPROVED` | `REJECTED` | `MERGED`. **Only `APPROVED`** reports surface on public lure/species pages. Rankings grouped by technique.

## Trust system

Every information block should show its source (manufacturer / editorial / community / AI). Do not merge provenance and verification badges. Do not skip audit on moderation approve paths.

---

# Deployment

## GitHub

- Repo: `https://github.com/balikoltamda/trollmatch.git`
- CI (`.github/workflows/ci.yml`): push/PR to `main` → lockfile verify, `npm ci`, lint, typecheck, build
- Policy: `npm run verify` locally before push; regenerate lockfile cleanly when deps change (`docs/012_CROSS_PLATFORM_DEPENDENCIES.md`)

## Production (today)

**No `deploy.sh` in repo yet** (backlog BL-086). Documented target: Linux VPS + Docker Compose + Caddy TLS (ADR-015).

Operator steps:

1. `npm run db:migrate`
2. `npm run build` → `next build` + `prepare-standalone.mjs`
3. Run via `ui/Dockerfile` (`node ui/server.js` :3000) or `docker compose --profile full up`

**Plesk:** DNS for `guide.balikoltamda.net` may live on Plesk; app needs Node + PostgreSQL on a VPS — **production deploy not fully configured yet**.

---

# Current Priorities

1. **Importer stability** — reliable async batches, clear error reports, no timeouts
2. **Real manufacturer imports** — expand live and static catalogs
3. **Real fish images** — species hero photography on cards and detail
4. **Visual polish** — premium, trustworthy presentation
5. **Knowledge quality** — verified sources, taxonomy accuracy, editorial review
6. **SEO** — structured public pages, stable slugs, bilingual content

**Next sprint work:** regional experience on lure pages, replace enrichment mocks with real catch data.

Deferred: Meilisearch, reputation system, manufacturer hub, Studio auth, dashboard polish.

---

# Things AI Must Never Do

1. Invent fishing terminology — lexicon entry first
2. Invent taxonomy — follow scientific authority + lexicon
3. Translate fishing terms literally (Leader → Beden)
4. Use Species → Lure recommendations — always qualify with technique
5. Over-engineer — smallest correct diff
6. Replace scientific taxonomy with internet popularity
7. Overwrite editorial knowledge — imports/AI do not silently replace verified content
8. Add e-commerce (cart, checkout, inventory, payments)
9. Read `research/` at production request time
10. Auto-publish from ingestion or AI without moderation/audit
11. Index unpublished content in public search
12. Commit secrets or `.env` values
13. Create random new docs unless requested
14. Commit git changes unless the user explicitly asks
15. Build full `007` ontology "for completeness"
16. Add city-level regional species names

---

# Current Roadmap

From `docs/010_ANGLER_PRODUCT.md` — **do not invent features beyond this.**

| Milestone | Scope |
|-----------|--------|
| **Sprint 7.6 — Regional experience** *(next)* | Regional editor notes on lure pages; Eastern Mediterranean lens; collections by region + species + technique; wire catch reports into trust/community stats |
| **Sprint 7.7 — AI summaries** | At-a-glance cited summaries; fallback to verified editor notes; lexicon-resolved vocabulary |
| **Deferred** | Meilisearch; reputation; crawlers/scrapers; angler-facing manufacturer hub; Studio auth; stat polish |
| **Long-term (charter)** | SpeciesCompass, TechniqueLibrary, LocationInsights; expert verification; sponsored links |

Charter Year 1: ≥500 curated lures, bilingual UI, community contribution, provenance on published records, modular foundation for second module.

---

# Reading Order

**Documentation hierarchy:** [`README.md`](README.md) → **[`AI_CONTEXT.md`](AI_CONTEXT.md)** (this file) → specialized documents below. Prefer linking over copying — update `AI_CONTEXT.md` when onboarding facts change.

When this document is insufficient:

| # | Document | Why |
|---|----------|-----|
| 1 | `docs/001_PROJECT_CHARTER.md` | Goals, scope, non-goals |
| 2 | `docs/002_ENGINEERING_PRINCIPLES.md` | Coding law, evolutionary design |
| 3 | `docs/003_MASTER_CONTEXT.md` | Domain narrative, workflows |
| 4 | `docs/007_DATABASE_VISION.md` | Long-horizon entity model (not all implemented) |
| 5 | `docs/010_ANGLER_PRODUCT.md` | Shipped sprints, priorities, next work |
| 6 | `docs/fishing/TERMINOLOGY.md` | Fishing Lexicon |
| 7 | `docs/fishing/TAXONOMY_POLICY.md` | Species naming law |
| 8 | `docs/fishing/SPECIES_TECHNIQUE_LURE_POLICY.md` | Species → Technique → Lure |
| 9 | `docs/fishing/LOCALIZATION_GUIDE.md` | tr/en authoring |

**Also useful:** `docs/KNOWN_DECISIONS.md` · `docs/CHANGELOG.md` · `docs/010_CURSOR_RULES.md` · `.cursor/rules/project.md` · `docs/004_DECISIONS.md` · `docs/013_KNOWLEDGE_PIPELINE.md` · `docs/006_SYSTEM_ARCHITECTURE.md` · `docs/008_TECH_STACK.md`

**Conflict resolution:** charter > engineering principles > angler product doc > this file.

---

*Single entry point for AI agents. Summarizes — does not replace authoritative docs.*
