# Master Context

**Document:** 003_MASTER_CONTEXT  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Status:** Living domain reference  
**Authority:** Subordinate to `001_PROJECT_CHARTER.md`; informs all implementation  
**Audience:** Engineers, curators, moderators, product owners, AI agents

**Onboarding summary:** [`AI_CONTEXT.md`](../AI_CONTEXT.md). This document is the **domain encyclopedia** — workflows, module interaction, and operational narrative in depth.

---

## 1. What This Document Is

This is the **living domain encyclopedia** for Balık Oltamda Guide. It explains how the platform thinks about fishing knowledge, how modules interact, and how daily operations (curation, moderation, ingestion) map to the business model in `007_DATABASE_VISION.md`.

It does not duplicate the charter’s goals or the engineering constitution line-by-line. It answers: **“What are we building, in domain language, and how do the pieces fit?”**

When terminology conflicts arise, `011_GLOSSARY.md` wins on definitions; this document wins on narrative and workflow context.

---

## 2. Platform in One Page

Product identity, mission, and current implementation: [`AI_CONTEXT.md`](../AI_CONTEXT.md).

This document adds **domain framing** — how the platform aspires to combine:

- **Discogs-style catalog discipline** (manufacturers, lines, variants, external IDs, merges).
- **IMDb-style credits and verification** (who said what, who confirmed it).
- **Wikipedia-style community evidence** (assertions, disputes, consensus, revision history).

Launch locales: Turkish (`tr`) and English (`en`). First module: **LureAtlas**. Trust model: Knowledge Claims + Provenance + Verification Events (long-horizon — see `007`).

---

## 3. Problem the Platform Solves

Anglers face fragmented knowledge: forum threads, manufacturer marketing, regional guidebooks, and social video. They cannot reliably answer:

> *Which lure, for which species, with which technique, in which conditions—and why should I trust the answer?*

Balık Oltamda Guide structures that answer into **queryable, attributable records** with moderation gates before publication. Community field experience ranks above AI inference. Manufacturer specifications are visible but distinguished from community effectiveness claims.

---

## 4. Architectural Layers (Domain View)

The business model organizes into layers documented fully in `007_DATABASE_VISION.md`:

| Layer | Domain responsibility |
|-------|----------------------|
| **L0 Identity** | Platform Users, roles, sanctions, notification preferences |
| **L1 Knowledge Graph** | Stable IDs, slugs, merges, redirects, typed entity links |
| **L2 Trust** | Knowledge Claims, Provenance Attribution, Verification Events, quality assessments |
| **L3 Reference Ontology** | Species, techniques, geography, seasons, conservation references |
| **L4 Module Catalogs** | LureAtlas today; SpeciesCompass, TechniqueLibrary, LocationInsights later |
| **L5 Community Evidence** | Catch Reports, Usage Assertions, votes, reputation, consensus groups |
| **L6 Media** | Images and future video; licenses; deduplication |
| **L7 AI** | Suggestions, RAG sessions, citation links—provisional until promoted |
| **L8 Editorial** | Typed moderation cases, corrections, disputes, appeals |
| **L9 Discovery Projection** | Search index and RAG corpus—derived from published truth |
| **L10 Ethical Commerce** | Retailers, sponsored links, disclosure policy, click ledger |

**Rule:** Modules own catalog aggregates (e.g., LureAtlas Model). The platform owns taxonomies and trust primitives. Modules **reference** platform ids; they never fork species or technique lists.

**Evolutionary design:** [`AI_CONTEXT.md` § Core Product Philosophy](../AI_CONTEXT.md#core-product-philosophy) and `002` §2. `007` describes the long-horizon model; the running product implements only what current sprints require.

---

## 5. First Module: LureAtlas

### 5.1 Purpose

LureAtlas is the structured catalog and discovery experience for **artificial lures and related tackle attributes** (action, buoyancy, depth profile, hooks, color variants). It exercises the full platform stack: ingestion, bilingual content, search, media, moderation, provenance, and optional AI-assisted discovery.

### 5.2 Core Catalog Hierarchy

```
Organization (manufacturer role)
  └── Manufacturer facade
        └── Product Line
              └── LureAtlas Model
                    └── LureAtlas Variant (SKU / size / color)
```

Each **LureAtlas Model** carries manufacturer **Knowledge Claims** (weight, length, diving depth, etc.) with **Manufacturer Attribution**. Each model has a **Lure Form Factor** (crankbait, jerkbait, soft plastic, …) and links to platform taxonomies: **Lure Action**, **Buoyancy Class**, **Diving Depth Profile**, **Fishing Technique**, **Fish Species** (via typed association links).

### 5.3 Three Species Link Semantics

Species associations are never undifferentiated tags:

| Association kind | Meaning | Discovery use |
|------------------|---------|---------------|
| `manufacturer_marketing_target` | Factory packaging claim | Manufacturer context; not primary filter until promoted |
| `moderator_curated_target` | Editorially approved target list | Primary curated discovery |
| `community_effectiveness` | On Usage Assertion, not bare model tag | Field-supported suitability ranking |

### 5.4 Community Layer on Catalog

**Usage Assertion** — structured effectiveness claim: lure + species + technique + **Geographic Context** + **Temporal Scope** + optional rig template + narrative. Distinct from manufacturer specs forever.

**Catch Report** — field observation with evidence (photo, date, conditions). On approval may derive **at most one** Usage Assertion per deduplication hash; see relationship law §4.4 in `007`.

**Rigging Tip** — knot, hook upgrade, tie point—approvable separately from effectiveness claims.

### 5.5 Primary User Journeys

1. **Discover by context** — species + technique + geographic/climate filter → ranked lure list with provenance and community signal summaries.
2. **Compare lures** — two to four LureAtlas Models side-by-side on normalized attributes and assertion summaries.
3. **Inspect trust** — manufacturer claims vs community assertions vs verification badges vs expert endorsements (future).
4. **Contribute** — correction request, catch report, usage assertion, photo with license → typed **Moderation Case**.
5. **Purchase intent (optional)** — explicit “find retailers” → **Sponsored Links** in labeled slots only; never mixed into organic ranking.

---

## 6. Trust and Provenance (How Readers Judge Truth)

### 6.1 Trust Ladder (UI precedence)

1. Expert Endorsement (valid, no blocking COI)
2. Verification Event (moderator or manufacturer rep)
3. Community Consensus Group
4. Published community Knowledge Claim / Usage Assertion
5. Manufacturer Attribution on catalog fields
6. AI Suggestion (moderator draft only until promoted)

**Provenance Attribution** = where information originated.  
**Verification Event** = who confirmed it and when.  
Never merge these badges in the UI.

### 6.2 Lifecycle States

All publishable aggregates and Localized Text use: `draft` → `pending_review` → `published` | `rejected` | `deprecated` (+ `scheduled_publish`, `archived` over time).

Only **`published`** entities enter public search index and RAG corpus partitions.

### 6.3 Geographic and Temporal Context

**Geographic Context** enforces one primary classifier (Region, Climate Band, or Water Body) plus optional refinement—never ambiguous dual-primary regions.

**Temporal Scope** separates seasonal effectiveness from ever-green claims. Catch Reports carry observation dates; assertions should carry Season Window or Month Window when seasonality matters.

---

## 7. Platform Services (Shared Kernel)

These services support all modules; they do not embed lure-specific business rules beyond registered module hooks.

| Service | Responsibility |
|---------|----------------|
| **Identity** | Registration, login, RBAC, account sanctions |
| **i18n** | Locale routing, Localized Text, translation jobs, Turkish/English fallbacks |
| **Media** | Upload, resize, WebP/AVIF derivatives, license gate, fingerprint dedup |
| **Moderation** | Typed cases, SLA queues, audit log, appeals |
| **Search** | Faceted full-text index per locale; sync via outbox |
| **AI orchestration** | RAG over published corpus, moderator copilots, citation links |
| **Analytics** | Privacy-respecting usage events; no precise GPS in analytics |
| **Sponsored links** | Registry, disclosure policy version, click ledger—isolated from ranking |
| **Ingestion** | Research → batch → draft entities → moderation |

Repository layout mirrors separation: `database/`, `api/`, `ui/`, `research/` (evidence only, never production runtime reads).

---

## 8. Relationship to Balık Oltamda Retail

Balık Oltamda operates **balikoltamda.net** (PrestaShop e-commerce). The Guide is **editorially independent** software:

- No shared production database in initial phases.
- Guide accounts are not shop accounts.
- Balık Oltamda may appear as one **Retailer** among others in sponsored link slots.
- Catalog accuracy must hold for all brands, not only stocked products.

Cross-promotion (newsletter, homepage links) is marketing. Architecture integrates only via explicit outbound URLs or future affiliate feed APIs documented in ADRs.

---

## 9. Content Supply Chain

### 9.1 Research (Non-Production)

`research/manufacturers`, `research/species`, `research/techniques`, `research/competitors`, `research/community`, `research/images` hold **evidence**—PDFs, notes, screenshots. Nothing in `research/` is read by production API at request time.

### 9.2 Ingestion (Promotion)

**Ingestion Batch** jobs parse licensed manufacturer data into draft LureAtlas entities with **Source Document** references and **External Identifier Registry** keys. Idempotent re-runs update by stable external id, never duplicate.

### 9.3 Curation (Human Gate)

Editors and moderators promote drafts through **Verification Events**, merge duplicates via **Entity Merge Record**, resolve **Correction Requests**, and close typed **Moderation Cases**. Community submissions enter the same pipeline with **Community Attribution**.

### 9.4 Publication (Projection)

On publish, **Domain Event Outbox** rows drive search index updates and RAG **Retrieval Corpus Snapshot** increments. Public site reads published projections; never `pending_review` rows.

---

## 10. Moderation Operating Model

Moderation is a **product surface**, not an afterthought.

| Case kind | Source |
|-----------|--------|
| `community_submission` | Catch report, usage assertion, photo |
| `correction_request` | Spec challenge with evidence |
| `ingestion_batch` | Bulk manufacturer import |
| `merge_review` | Duplicate lure candidates |
| `translation_review` | Localized Text promotion |
| `abuse_report` | Spam, stolen media |
| `dispute` | IP, manufacturer complaint |
| `appeal` | Rejected submission or sanction |
| `ai_promotion_review` | AI draft accepted to canonical |

Target SLA (Year 1): median case resolution under **72 hours**. Queue prioritization uses case kind, reputation-weighted contributor trust, and contest scores—not FIFO alone.

---

## 11. AI Operating Model

AI assists; humans remain accountable.

| Surface | Behavior |
|---------|----------|
| Public discovery assistant | RAG over published corpus; **Retrieval Citation Links** on every segment; degrades to faceted browse on low confidence or quota |
| Moderator copilot | Duplicate suggestions, translation drafts, tag proposals—feeds **AI Suggestion** into cases |
| Ingestion assist | Normalization hints only; no auto-publish |

AI output becomes canonical only through **Verification Event** after moderator action, with audit log entry naming model and prompt template version.

Training on contributor content requires explicit consent policy—not default.

---

## 12. Internationalization

- **UI strings:** externalized; Turkish is not secondary.
- **Content:** Localized Text rows per field with own lifecycle; fallback chain documented in `007` §4.6.
- **Species names:** Latin taxonomic invariant; common names per locale via taxonomy synonyms.
- **Units:** metric canonical storage; imperial display per user preference.
- **Slugs:** per-locale Slug Registry Entry with redirect chain on merge/rename.

Turkish dotted-I (`İ`/`ı`) collation is a first-class search requirement—see ADR-011 in `004_DECISIONS.md`.

---

## 13. Future Modules (Context Only)

| Module | Scope | Depends on |
|--------|-------|------------|
| **SpeciesCompass** | Rich species profiles keyed to Fish Species id | Platform taxonomy L3 |
| **TechniqueLibrary** | Long-form technique articles; RAG partition | Fishing Technique taxonomy |
| **LocationInsights** | Aggregated anonymized catch patterns | Catch Reports, Geographic Context |

LureAtlas must not absorb species biology or technique article CMS concerns—those modules extend shared ids.

---

## 14. Personas (Quick Reference)

| ID | Who | Needs |
|----|-----|-------|
| P1 | Curious angler, mobile | Filters, comparison, tr/en, honest sponsored labels |
| P2 | Experienced contributor | Attribution, structured submit forms, impact visibility |
| P3 | Moderator / curator | Typed queues, diff tools, AI assist, audit trail |
| P4 | Content editor | Ingestion batches, manufacturer relationships, publish rules |
| P5 | International visitor | Equal quality without feeling like a sales funnel |
| P6 | Expert verifier (future) | Scoped endorsement, visible COI |

---

## 15. Document Map

| Question | Read |
|----------|------|
| Onboarding summary | [`AI_CONTEXT.md`](../AI_CONTEXT.md) |
| Goals, scope, non-goals | `001_PROJECT_CHARTER.md` |
| Coding, review, AI, security law | `002_ENGINEERING_PRINCIPLES.md` |
| Domain narrative (this doc) | `003_MASTER_CONTEXT.md` |
| Why we chose X | `004_DECISIONS.md`, `KNOWN_DECISIONS.md` |
| What to build next | `005_BACKLOG.md` |
| Shipped angler sprints | `010_ANGLER_PRODUCT.md` |
| Components, deployment, data flow | `006_SYSTEM_ARCHITECTURE.md` |
| Entities and relationship law | `007_DATABASE_VISION.md` |
| Languages, frameworks, infra | `008_TECH_STACK.md` |
| When we build it | `009_ROADMAP.md` |
| Cursor agent rules | `010_CURSOR_RULES.md` |
| Term definitions | `011_GLOSSARY.md` |

---

## 16. Sprint 0 Exit Criteria (Context)

Sprint 0 completes when discovery, architecture, tech stack, backlog, and ADRs are actionable and aligned with the charter. Implementation of LureAtlas database migrations and API begins in Sprint 1 per `009_ROADMAP.md`.

---

*This document is revised when domain workflows change. Last ratified: Sprint 0 completion.*
