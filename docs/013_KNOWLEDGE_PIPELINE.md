# Knowledge Acquisition Pipeline

**Document:** 013_KNOWLEDGE_PIPELINE  
**Status:** Active architecture (Sprint 7.4)  
**Module:** `ui/src/modules/knowledge-pipeline/`

---

## Philosophy

TrollMatch must not depend on users constantly contributing data.

Most anglers consume information. Very few produce it. The platform should continuously expand its knowledge from trustworthy sources and present only verified information.

| Role | Responsibility |
|------|----------------|
| **Editor** | Verifies |
| **System** | Discovers |

Community reports are valuable but optional. Primary knowledge growth comes from manufacturer data, trusted public information, future AI agents, and editor verification.

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
| `PUBLIC_ARTICLE` | Editorial and magazine content |
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

---

## Knowledge inbox (Studio)

Route: `/studio/knowledge`

The editor's primary workspace for discovered knowledge. Items sorted by **confidence** (HIGH first), then recency.

Sections surfaced in the inbox:

- New manufacturer findings
- New YouTube findings
- Forum findings
- Scientific findings
- Community trends
- Duplicate findings
- Potential taxonomy conflicts

### Editor actions (all audited)

| Action | Effect |
|--------|--------|
| **Approve** | Mark verified; ready for catalog integration |
| **Reject** | Discard finding |
| **Merge** | Collapse duplicate into primary item |
| **Ignore** | Defer without rejection |
| **Open source** | Log URL visit (audit only) |

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
