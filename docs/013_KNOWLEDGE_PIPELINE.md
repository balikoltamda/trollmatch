# Knowledge Acquisition Pipeline

**Document:** 013_KNOWLEDGE_PIPELINE  
**Status:** Active architecture (Sprint 7.4)  
**Module:** `ui/src/modules/knowledge-pipeline/`

**Onboarding summary:** [`AI_CONTEXT.md`](../AI_CONTEXT.md) (Knowledge Hub module, index policy). **This document** covers pipeline architecture, schema, Studio workflow, and source scoring.

---

## Philosophy

TrollMatch must not depend on users constantly contributing data — primary growth from manufacturer data, trusted sources, and editor verification. Community reports are valuable but optional.

Platform laws: [`AI_CONTEXT.md` § Core Product Philosophy](../AI_CONTEXT.md#core-product-philosophy).

---

## External knowledge sources — index, not mirror

TrollMatch does **not** republish third-party content.

The platform stores only:

| Stored | Not stored |
|--------|------------|
| Source metadata | Full article text |
| Canonical URL | Mirrored photos |
| Title | Embedded videos |
| AI-generated summary | Copied forum posts |
| Editor verification | Scraped social feeds |
| Confidence score | |
| Related species, lure, technique | |

When possible, users and editors are **directed to the original source**. Photos and videos remain hosted by their original platform (YouTube, manufacturer sites, forums, journals).

`rawSnippet*` fields are internal discovery fingerprints for deduplication — never shown publicly. `aiSummary*` is the only user-facing prose from external sources. `KnowledgeEvidence` holds reference labels and URLs, not republished excerpts.

---

## Subsystem placement

Knowledge Pipeline is a first-class subsystem beside:

- Importers
- Studio
- Discovery
- Trust
- Community

---

## Source types (architecture only)

Designed to support multiple source types. **No crawlers in Sprint 7.4.**

| Type | Purpose |
|------|---------|
| `MANUFACTURER` | Catalog specs, variant data, official claims |
| `COMMUNITY` | Catch reports, trends (optional input) |
| `YOUTUBE` | Angling channel content |
| `FISHING_FORUM` | Forum threads and local knowledge |
| `FISHING_BLOG` | Angling blog posts |
| `MAGAZINE` | Magazine articles |
| `PUBLIC_ARTICLE` | Legacy article type (prefer MAGAZINE / FISHING_BLOG) |
| `SCIENTIFIC_PUBLICATION` | Peer-reviewed fisheries research |
| `OTHER` | Future sources |

Do not scrape Facebook or Instagram. Do not implement external APIs in this sprint.

---

## Data model

### `KnowledgeSource`

Registered source feed (manufacturer catalogs, YouTube channels, forums, etc.).

### `KnowledgeItem`

A discovered finding awaiting or after editorial review.

Required fields per item:

| Field | Notes |
|-------|-------|
| `source` | FK → `KnowledgeSource` |
| `url` | Canonical source URL |
| `discoveredAt` | When the pipeline recorded the finding |
| `confidence` | `HIGH` · `MEDIUM` · `LOW` |
| `status` | Pipeline + review lifecycle |
| `editorDecision` | Approve / reject / merge / ignore outcome |
| `aiSummary` | Future AI-generated summary (nullable) |
| `relatedSpecies` | FK → `FishSpecies` |
| `relatedLure` | FK → `LureModel` |
| `relatedTechnique` | FK → `Technique` |
| `region` | Regional scope |
| `country` | Country code |

Supporting models:

- **`KnowledgeEvidence`** — citations, quotes, or structured proof fragments
- **`KnowledgeSuggestion`** — proposed taxonomy or catalog changes
- **`KnowledgeGraphLink`** — edges between knowledge items and catalog entities
- **`KnowledgeAuditEntry`** — append-only editor action log

Migration: `ui/prisma/migrations/20250706140000_knowledge_pipeline/`  
Sprint 7.5: `ui/prisma/migrations/20250706160000_knowledge_hub/`

---

## Knowledge Hub (Studio) — Sprint 7.5

Route: `/studio/source-archive` (legacy redirect from `/studio/knowledge`)

Replaces the basic inbox with a richer editorial workspace. Items sorted by **source score**, then confidence, then recency.

Every knowledge item displays:

- Source metadata, title, original URL, source type, language
- Discovery date, country, region
- AI summary and source preview (synthesized — never mirrored)
- Related species, lures, techniques, manufacturers (multiple via graph)
- Source score and category
- Editor status

### Source scoring (no AI)

Category-based engine in `lib/source-scoring.ts`:

| Category | Base score |
|----------|------------|
| Manufacturer | 95 |
| Scientific publication | 90 |
| Official documentation | 85 |
| Balık Oltamda | 80 |
| Trusted forum | 65 |
| General forum | 45 |
| Community | 35 |
| Unknown | 20 |

Trust tier (1–5) adjusts ±8 points.

### Editor actions (all audited)

| Action | Effect |
|--------|--------|
| **Approve** | Mark verified; surfaces on public pages |
| **Reject** | Discard finding |
| **Merge** | Collapse duplicate into primary item |
| **Archive** | Remove from active review |
| **Flag outdated** | Mark superseded source |
| **View original** | Log URL visit (audit only) |

---

## Public related knowledge — Sprint 7.5

Approved knowledge appears on lure and species pages as **Related knowledge** cards. Each card links directly to the original source. Search (`/search`) includes knowledge titles and summaries alongside lure results.

---

## Knowledge graph

`KnowledgeGraphLink` connects:

- Species
- Lures (`LureModel`)
- Manufacturers
- Techniques
- Knowledge items

Relation kinds: `MENTIONS`, `SUPPORTS`, `CONFLICTS_WITH`, `DUPLICATE_OF`, `RELATED_TO`.

Preparation for future AI reasoning — no graph traversal UI in Sprint 7.4.

---

## Vision pipeline (interfaces only)

File: `ui/src/modules/knowledge-pipeline/lib/vision-pipeline.ts`

Future capabilities (not implemented):

- Fish recognition
- Lure recognition
- Lure colour recognition
- Catch estimation
- Species confidence scoring

`VisionPipelineService` interface + `visionPipelineStub` that throws `VisionPipelineNotImplementedError`.

---

## Localization

Follow:

- `docs/fishing/TERMINOLOGY.md`
- `docs/fishing/TAXONOMY_POLICY.md`
- `docs/fishing/LOCALIZATION_GUIDE.md`

Never introduce literal translations. Turkish and English are independently localized angler languages.

---

## Future roadmap (enabled by this sprint)

- AI agents for automatic discovery
- Vision recognition on catch photos
- Automatic knowledge discovery crawlers
- Automatic trend detection
- Source verification scoring

---

## What is explicitly out of scope

- Crawlers and scrapers
- Facebook / Instagram scraping
- External API integrations
- AI summary generation
- Public angler-facing knowledge pages (Studio workflow only)
