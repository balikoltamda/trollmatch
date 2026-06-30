# Architecture Decision Records

**Document:** 004_DECISIONS  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Status:** Sprint 0 — Initial ADR set  
**Format:** [MADR-inspired](https://adr.github.io/madr/) — Context, Decision, Consequences

---

## Index

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](#adr-001-modular-monolith-repository-structure) | Modular monolith repository structure | Accepted |
| [ADR-002](#adr-002-primary-database-postgresql) | Primary database: PostgreSQL | Accepted |
| [ADR-003](#adr-003-search-engine-meilisearch) | Search engine: Meilisearch | Accepted |
| [ADR-004](#adr-004-public-api-rest-over-graphql) | Public API: REST over GraphQL | Accepted |
| [ADR-005](#adr-005-ui-nextjs-app-router) | UI: Next.js App Router | Accepted |
| [ADR-006](#adr-006-knowledge-claim-trust-model) | Knowledge Claim trust model | Accepted |
| [ADR-007](#adr-007-localized-text-as-child-rows) | Localized Text as child rows | Accepted |
| [ADR-008](#adr-008-authentication-email-and-oauth) | Authentication: email + OAuth | Accepted |
| [ADR-009](#adr-009-object-storage-s3-compatible) | Object storage: S3-compatible | Accepted |
| [ADR-010](#adr-010-outbox-pattern-for-projections) | Outbox pattern for projections | Accepted |
| [ADR-011](#adr-011-turkish-locale-and-collation) | Turkish locale and collation | Accepted |
| [ADR-012](#adr-012-ai-provider-abstraction) | AI provider abstraction | Accepted |
| [ADR-013](#adr-013-sponsored-links-isolated-from-ranking) | Sponsored links isolated from ranking | Accepted |
| [ADR-014](#adr-014-species-taxonomy-seed-strategy) | Species taxonomy seed strategy | Accepted |
| [ADR-015](#adr-015-hosting-production-environment) | Hosting: production environment | Accepted |

---

## ADR-001: Modular Monolith Repository Structure

**Date:** 2026-06-30  
**Status:** Accepted

### Context

The charter requires modular boundaries (LureAtlas first; SpeciesCompass, TechniqueLibrary later) while the team is small. Microservices prematurely would multiply operational cost without traffic justification.

### Decision

Deploy a **modular monolith**: single repository (`TrollMatch`), packages `api/` and `ui/`, PostgreSQL schemas `platform` and `lure_atlas`. Module APIs namespaced `/v1/lure-atlas/...`. Shared platform services in `api/src/platform/`. Extract services only when ADR triggers in engineering principles are met.

### Consequences

- **Positive:** Simple deploy, shared types, transactional consistency for publish workflows.
- **Positive:** Module boundaries enforced by schema namespace and import rules, not network boundaries.
- **Negative:** Discipline required to prevent lure logic leaking into platform kernel.
- **Follow-up:** Module Registry Entry documented in `007`; lint rule blocking cross-module deep imports.

---

## ADR-002: Primary Database: PostgreSQL

**Date:** 2026-06-30  
**Status:** Accepted

### Context

The business model requires relational integrity (Knowledge Claims, provenance chains, moderation cases, merge lineage), JSON for qualifiers, and strong transactional publish semantics. Charter assumes relational store.

### Decision

**PostgreSQL 16+** as system of record. Schemas: `platform`, `lure_atlas`, `audit` (append-heavy tables optional partition). Migrations via linear forward-only files in `database/migrations/`. UUID v7 or ULID for Platform Canonical Identifier—exact type chosen at first migration.

### Consequences

- **Positive:** FK integrity across module boundaries via platform ids; mature ecosystem.
- **Positive:** Row-level security available for future multi-tenant partner API.
- **Negative:** Full-text search in PostgreSQL not used for primary faceted search—see ADR-003.
- **Follow-up:** Read replicas when read QPS exceeds single-node comfort; not required for beta.

---

## ADR-003: Search Engine: Meilisearch

**Date:** 2026-06-30  
**Status:** Accepted

### Context

Faceted lure discovery (species, technique, manufacturer, form factor, depth, locale text) must not use SQL `LIKE` across translation tables. Turkish collation requires explicit analyzer configuration.

### Decision

**Meilisearch** as dedicated search index. One index per public locale (`lures_tr`, `lures_en`) with shared attribute schema. Incremental upsert from Domain Event Outbox worker. Search Index Registry entity tracks schema version.

### Consequences

- **Positive:** Fast faceted UI; simpler ops than Elasticsearch for current scale.
- **Negative:** Second system to keep in sync—mitigated by ADR-010 outbox.
- **Alternative rejected:** PostgreSQL tsvector—insufficient faceting UX; Typesense viable but team selects Meilisearch for Turkish docs maturity.

---

## ADR-004: Public API: REST over GraphQL

**Date:** 2026-06-30  
**Status:** Accepted

### Context

Charter leaves API style open. Clients: Next.js UI, future mobile, partner read API. GraphQL adds schema complexity for a catalog-heavy read model.

### Decision

**REST JSON API** versioned `/v1/`. OpenAPI 3.1 spec generated or maintained alongside handlers. Cursor pagination for lists. GraphQL deferred until partner demand documented.

### Consequences

- **Positive:** Cache-friendly public read endpoints; straightforward CDN caching for immutable lure slugs.
- **Negative:** Comparison endpoints may require dedicated aggregate routes to avoid over-fetching.
- **Follow-up:** `GET /v1/lure-atlas/models/compare?ids=` returns bounded four-model aggregate.

---

## ADR-005: UI: Next.js App Router

**Date:** 2026-06-30  
**Status:** Accepted

### Context

Charter requires SSR/SEO for guide pages, bilingual routing, mobile-first. Repository `.gitignore` already implies Next.js.

### Decision

**Next.js 15+ App Router** in `ui/`. Locale prefix routes `/[locale]/...` with `tr` and `en`. Server Components for lure detail SEO; client components for filters and comparison. Shared TypeScript types imported from `api/` contracts package or `shared/` directory.

### Consequences

- **Positive:** hreflang and metadata API for bilingual SEO.
- **Positive:** Aligns with Node hosting on VPS.
- **Negative:** Moderator tools may share UI monorepo or split later—initially same app under `/[locale]/moderation` guarded by RBAC.

---

## ADR-006: Knowledge Claim Trust Model

**Date:** 2026-06-30  
**Status:** Accepted

### Context

`007` normalizes Provenance Attribution vs Verification Event vs Knowledge Claim. Implementers need a single persistence pattern.

### Decision

All canonical catalog facts decompose to **Knowledge Claim** rows (`subject_id`, `predicate`, `value`, `unit`, `qualifier_json`). **Provenance Attribution** and **Verification Event** attach to claims or Localized Text bodies. Publish Requirement Rules evaluated by Data Quality Assessment before `published` transition.

UI trust ladder follows `007` §4.1 exactly.

### Consequences

- **Positive:** Field-level diffs, expert partial endorsement, AI citation to claim ids.
- **Negative:** More rows than wide lure table—acceptable for data quality mission.
- **Rejected:** Single JSON blob per lure for specs—loses provenance granularity.

---

## ADR-007: Localized Text as Child Rows

**Date:** 2026-06-30  
**Status:** Accepted

### Context

ADR needed between `description_tr` columns vs normalized translation table. Charter G2 requires independent locale publication states.

### Decision

**Localized Text** child rows: `(parent_type, parent_id, field_path, locale, body, lifecycle_state, provenance_id)`. Fallback chain implemented in read service per `007` §4.6.

### Consequences

- **Positive:** Scales to many locales; per-field translation workflow.
- **Negative:** Joins on read—mitigated by search index denormalization and aggregate API.
- **Rejected:** JSONB map per entity—harder moderation per locale.

---

## ADR-008: Authentication: Email and OAuth

**Date:** 2026-06-30  
**Status:** Accepted

### Context

Charter requires global accounts; contributors and moderators need persistent identity. Shop accounts remain separate.

### Decision

**Email magic link or password** (product choice at implementation) plus **OAuth 2.0 Google** at launch. Session via HTTP-only secure cookies; JWT for optional API token export later. Platform User is distinct from Contributor Profile (created on first contribution).

### Consequences

- **Positive:** Low friction for international anglers.
- **Negative:** Apple Sign-In may be required for iOS wrapper future—add when mobile app scoped.
- **Follow-up:** GDPR consent capture on registration; data export job.

---

## ADR-009: Object Storage: S3-Compatible

**Date:** 2026-06-30  
**Status:** Accepted

### Context

Media pipeline requires originals + derivatives; CDN origin; no app server byte proxying in steady state.

### Decision

**S3-compatible object storage** (provider selected per ADR-015: e.g., Cloudflare R2, AWS S3, or Hetzner Object Storage) with public CDN bucket for published derivatives. Private bucket for originals and pending moderation uploads.

### Consequences

- **Positive:** Media Fingerprint dedup reduces storage.
- **Negative:** Upload URL signing and virus scan hook required—see architecture doc.

---

## ADR-010: Outbox Pattern for Projections

**Date:** 2026-06-30  
**Status:** Accepted

### Context

Published truth must propagate to Meilisearch and RAG Retrieval Corpus Snapshot without dual-write races.

### Decision

**Transactional outbox** in PostgreSQL: same transaction as publish writes Domain Event Outbox row. Workers: `search-indexer`, `rag-indexer`, `analytics-projector`. Idempotent consumers keyed by `(event_id, consumer_name)`.

### Consequences

- **Positive:** Observable lag via Search Index Sync Record.
- **Negative:** Worker infrastructure required on day one of public publish—acceptable.

---

## ADR-011: Turkish Locale and Collation

**Date:** 2026-06-30  
**Status:** Accepted

### Context

Turkish is co-primary locale. Incorrect İ/ı handling breaks search, slugs, and sorting.

### Decision

- PostgreSQL: `tr-TR-x-icu` collation on slug and search-normalized columns where sorted.
- Meilisearch: Turkish locale tokenizer configured per index.
- Application: `Intl` and library utilities for case mapping—never raw `toLowerCase()` on user-facing Turkish text.
- Tests: fixture cases for `İstanbul`, `ısı`, species synonyms.

### Consequences

- **Positive:** G2 credibility for Turkish anglers.
- **Negative:** CI must run locale tests on every search-related change.

---

## ADR-012: AI Provider Abstraction

**Date:** 2026-06-30  
**Status:** Accepted

### Context

AI assists RAG discovery and moderator copilots. Vendor lock-in and data retention policies vary.

### Decision

**AI orchestration service** with provider adapter interface. Initial provider: OpenAI-compatible API (model selection in environment config). Prompt Template ids version-controlled in repository. Zero-retention / enterprise terms required before production contributor content in prompts. Retrieval Citation Link mandatory on public AI Response Segments.

Public AI feature-flagged; stubs in CI.

### Consequences

- **Positive:** Swappable provider; audit trail via template id + corpus snapshot id.
- **Negative:** Cost metering required—token budgets per ADR in engineering principles.

---

## ADR-013: Sponsored Links Isolated from Ranking

**Date:** 2026-06-30  
**Status:** Accepted

### Context

Charter and engineering principles forbid undisclosed paid influence on discovery ranking.

### Decision

Organic ranking functions accept `(filter_criteria, entity_ids)` only—no sponsored boolean on LureAtlas Model. Sponsored Links rendered only in Sponsored Placement Slots after organic results computed. Disclosure Policy Version id stored on render audit log. Sponsored Click Ledger append-only.

Balık Oltamda Retailer same Organization as manufacturer triggers COI badge, not ranking change.

### Consequences

- **Positive:** Editorial audits can prove independence.
- **Negative:** Revenue requires explicit user purchase-intent UI—by design.

---

## ADR-014: Species Taxonomy Seed Strategy

**Date:** 2026-06-30  
**Status:** Accepted

### Context

Global platform needs canonical Fish Species. LureAtlas tags species from day one.

### Decision

Seed **platform taxonomy** from curated subset aligned with WoRMS / FishBase Latin names for initial Mediterranean and global sport species (~500 launch taxa). Platform Taxonomy Term + Fish Species facade. Taxonomy Synonym table for tr/en common names. Full WoRMS sync deferred to automated ingestion job with moderation review—not bulk unreviewed import.

### Consequences

- **Positive:** Biological credibility; extensible to SpeciesCompass.
- **Negative:** Editorial effort to maintain launch subset—scheduled in backlog BL-010.

---

## ADR-015: Hosting: Production Environment

**Date:** 2026-06-30  
**Status:** Accepted

### Context

Planned DNS `guide.balikoltamda.net` currently on Plesk default page. Next.js, PostgreSQL, Meilisearch, and workers require Node-friendly compute—not typical shared hosting.

### Decision

**Production:** Linux VPS or cloud VM (e.g., Hetzner, DigitalOcean, AWS EC2) running Docker Compose or lightweight k8s later. Reverse proxy Caddy or Nginx with TLS. **Separate** from PrestaShop retail host. Staging environment mirrors production topology with anonymized subset data.

Plesk retains DNS only unless all-in-one VPS managed via Plesk Docker extension—ops choice at provisioning.

### Consequences

- **Positive:** Node SSR, background workers, Meilisearch co-located or managed.
- **Negative:** Team owns ops runbooks—documented in `006`.

---

## Amendment Process

New ADRs append to this file with next sequential id. Superseded ADRs marked **Superseded by ADR-xxx**—never deleted. Charter conflicts require charter amendment first, then ADR update.

---

*End of document.*
