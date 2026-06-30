# Backlog

**Document:** 005_BACKLOG  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Status:** Sprint 0 — Prioritized backlog  
**Priority scale:** P0 (blocker) → P1 (critical) → P2 (important) → P3 (defer)  
**Size:** S (<3d), M (3–8d), L (>8d)

---

## 1. How to Use This Backlog

- Items reference charter goals **G1–G5** and ADRs in `004_DECISIONS.md`.
- Sprint 1 pulls from **Phase A** only unless noted.
- IDs are stable for commits and PR titles (`feat/BL-021-...`).
- New items append; completed items move to release notes, not deleted.

---

## 2. Phase A — Sprint 1: Foundation (Platform Kernel)

| ID | Priority | Size | Title | Goal | Dependencies |
|----|----------|------|-------|------|--------------|
| BL-001 | P0 | M | Initialize monorepo: `api/`, `ui/`, `shared/`, `database/` | G5 | ADR-001 |
| BL-002 | P0 | S | Git repository, branch protection, CI lint + typecheck | G5 | BL-001 |
| BL-003 | P0 | M | PostgreSQL local dev + migration runner | G5 | ADR-002, BL-001 |
| BL-004 | P0 | L | Platform schema v1: Platform User, Role Assignment, Audit Log Entry | G5 | BL-003 |
| BL-005 | P0 | M | Content Lifecycle State machine library + tests | G4, G5 | BL-004 |
| BL-006 | P0 | L | Knowledge Claim + Provenance Attribution + Verification Event tables | G4 | BL-004, ADR-006 |
| BL-007 | P0 | M | Localized Text model + fallback read service | G2, G4 | BL-006, ADR-007 |
| BL-008 | P0 | M | Platform Canonical Identifier + Slug Registry + Redirect | G5 | BL-004 |
| BL-009 | P0 | M | Domain Event Outbox + noop consumer tests | G5 | BL-004, ADR-010 |
| BL-010 | P0 | L | Fish Species + Fishing Technique taxonomy seed (500 taxa) | G1, G5 | ADR-014, BL-003 |
| BL-011 | P0 | M | Geographic reference seed: Country, Region, Climate Band starter set | G1 | BL-010 |
| BL-012 | P1 | M | Authentication: email + Google OAuth | G3 | BL-004, ADR-008 |
| BL-013 | P1 | M | Contributor Profile on first contribution | G3 | BL-012 |
| BL-014 | P1 | S | Notification Preference defaults | G3 | BL-012 |

---

## 3. Phase B — Sprint 2–3: LureAtlas Catalog Core

| ID | Priority | Size | Title | Goal | Dependencies |
|----|----------|------|-------|------|--------------|
| BL-020 | P0 | L | `lure_atlas` schema: Organization, Manufacturer, Product Line, Model, Variant | G1, G5 | BL-006, BL-008 |
| BL-021 | P0 | M | Lure Form Factor, Lure Action, Buoyancy, Diving Depth Profile taxonomies | G1 | BL-010 |
| BL-022 | P0 | M | Knowledge Claims for model specs + Publish Requirement Rules v1 | G1, G4 | BL-020, BL-006 |
| BL-023 | P0 | M | Entity Association Link: species/technique tag kinds | G1, G4 | BL-020, BL-010 |
| BL-024 | P0 | M | External Identifier Registry + idempotent ingestion script skeleton | G1 | BL-020 |
| BL-025 | P0 | L | Ingestion Batch pipeline from `research/manufacturers` | G1 | BL-024 |
| BL-026 | P0 | M | Data Quality Assessment on publish transition | G1, G4 | BL-022 |
| BL-027 | P1 | M | Entity Merge Record + slug redirect workflow | G1, G5 | BL-008, BL-020 |
| BL-028 | P1 | M | Manufacturer press kit Source Document attachment | G4 | BL-025 |

---

## 4. Phase C — Sprint 4–5: Media, Search, Public Read API

| ID | Priority | Size | Title | Goal | Dependencies |
|----|----------|------|-------|------|--------------|
| BL-030 | P0 | L | Media Asset pipeline: upload, resize, WebP, license gate | G1 | ADR-009, BL-004 |
| BL-031 | P0 | M | Media Attachment to LureAtlas Model/Variant | G1 | BL-030, BL-020 |
| BL-032 | P0 | M | Meilisearch indexes `lures_tr`, `lures_en` + Turkish analyzer | G1, G2 | ADR-003, BL-009 |
| BL-033 | P0 | L | Search indexer outbox consumer + Sync Record | G1 | BL-032, BL-009 |
| BL-034 | P0 | L | REST API: list/filter/search LureAtlas Models | G1 | BL-033, ADR-004 |
| BL-035 | P0 | M | REST API: model detail aggregate (claims, variants, media, provenance) | G1, G4 | BL-034 |
| BL-036 | P0 | M | REST API: compare up to four models | G1 | BL-035 |
| BL-037 | P1 | M | OpenAPI spec published from handlers | G5 | BL-034 |

---

## 5. Phase D — Sprint 6–7: Public UI (LureAtlas)

| ID | Priority | Size | Title | Goal | Dependencies |
|----|----------|------|-------|------|--------------|
| BL-040 | P0 | L | Next.js locale routing `tr` / `en` + hreflang | G2 | ADR-005, BL-034 |
| BL-041 | P0 | M | Lure browse: faceted filters (species, technique, manufacturer, form factor) | G1 | BL-040, BL-032 |
| BL-042 | P0 | M | Lure detail page: specs, provenance badges, variants, gallery | G1, G4 | BL-040, BL-035 |
| BL-043 | P0 | M | Comparison UI (2–4 models) + shareable URL | G1 | BL-036, BL-040 |
| BL-044 | P1 | M | Empty/error states with filter suggestions | G2 | BL-041 |
| BL-045 | P1 | M | Unit toggle metric/imperial display | G2 | BL-042 |
| BL-046 | P2 | S | Entity Bookmark + Saved Comparison Set (authenticated) | — | BL-012, BL-043 |

---

## 6. Phase E — Sprint 8–9: Moderation & Community

| ID | Priority | Size | Title | Goal | Dependencies |
|----|----------|------|-------|------|--------------|
| BL-050 | P0 | L | Moderation Case + Case Kind + Subject Link | G3, G4 | BL-005 |
| BL-051 | P0 | L | Moderator UI: queue, approve/reject/request changes | G3 | BL-050, BL-040 |
| BL-052 | P0 | M | Correction Request flow | G3, G4 | BL-050, BL-022 |
| BL-053 | P0 | L | Catch Report submit + moderation | G3 | BL-050, BL-030 |
| BL-054 | P0 | L | Usage Assertion submit + Geographic/Temporal Scope forms | G3 | BL-050, BL-011 |
| BL-055 | P0 | M | Catch Report → Usage Assertion derivation rules | G3 | BL-053, BL-054 |
| BL-056 | P1 | M | Community Vote + Vote Aggregation Snapshot | G3 | BL-054 |
| BL-057 | P1 | M | Reputation Event + Reputation Score snapshot | G3 | BL-013, BL-050 |
| BL-058 | P1 | M | Content Abuse Report + Account Sanction basics | G3 | BL-050 |
| BL-059 | P1 | M | Appeal case kind | G3 | BL-050 |
| BL-060 | P2 | M | Translation Job + moderator translation review | G2 | BL-007, BL-051 |

---

## 7. Phase F — Sprint 10–11: AI & Sponsored Links (Flagged)

| ID | Priority | Size | Title | Goal | Dependencies |
|----|----------|------|-------|------|--------------|
| BL-070 | P1 | L | Prompt Template registry + AI Suggestion storage | G5 | ADR-012, BL-006 |
| BL-071 | P1 | L | Retrieval Corpus Snapshot + RAG indexer worker | G5 | BL-070, BL-009 |
| BL-072 | P1 | M | AI Assistant Session + Response Segment + Citation Links | G5 | BL-071 |
| BL-073 | P2 | M | Public discovery assistant UI (feature flag) | G5 | BL-072, BL-040 |
| BL-074 | P1 | M | Moderator copilot: duplicate suggestion, translation draft | G3 | BL-070, BL-051 |
| BL-075 | P2 | M | Disclosure Policy Version + Sponsored Link registry | — | ADR-013 |
| BL-076 | P2 | M | Sponsored Placement Slot UI on purchase-intent only | — | BL-075, BL-042 |
| BL-077 | P2 | S | Sponsored Click Ledger Entry | — | BL-075 |

---

## 8. Phase G — Sprint 12: Beta Hardening

| ID | Priority | Size | Title | Goal | Dependencies |
|----|----------|------|-------|------|--------------|
| BL-080 | P0 | M | Seed ≥500 published LureAtlas Models (G1 bar) | G1 | BL-025, BL-051 |
| BL-081 | P0 | M | Bilingual content audit: ≥95% UI strings, core entities both locales | G2 | BL-040, BL-060 |
| BL-082 | P0 | S | Provenance coverage report: 100% published claims attributed | G4 | BL-026 |
| BL-083 | P0 | M | Moderation SLA dashboard (72h median target) | G3 | BL-051 |
| BL-084 | P1 | M | E2E tests: discover, compare, submit, moderate | G5 | BL-043, BL-051 |
| BL-085 | P1 | M | Performance smoke: lure detail P95, LCP budget | G5 | BL-042 |
| BL-086 | P1 | M | Staging environment + deploy runbook | G5 | ADR-015 |
| BL-087 | P1 | S | Privacy policy, cookie consent, GDPR export job | G5 | BL-012 |
| BL-088 | P2 | M | Populate `011_GLOSSARY.md` from implemented terms | G5 | — |

---

## 9. Post-Beta (Year 1 Later)

| ID | Priority | Size | Title | Goal |
|----|----------|------|-------|------|
| BL-100 | P2 | L | Expert Profile + Endorsement pilot | Charter §14 |
| BL-101 | P2 | L | SpeciesCompass Extension MVP | Charter §7 |
| BL-102 | P2 | L | TechniqueLibrary Article MVP + RAG partition | Charter §7 |
| BL-103 | P3 | L | LocationInsights Aggregate pipeline | Charter §7 |
| BL-104 | P3 | M | Partner read API keys + rate limits | Charter §17 |
| BL-105 | P3 | M | Dispute Case + manufacturer portal correction API | G4 |

---

## 10. Sprint 1 Recommended Pull Order

1. BL-001 → BL-003 → BL-004 → BL-005 → BL-006 → BL-007 → BL-008 → BL-009  
2. Parallel: BL-010 + BL-011 (taxonomy/geo seeds)  
3. BL-012 → BL-013  

**Sprint 1 exit:** Platform kernel migrates cleanly; auth works; taxonomy seed loads; outbox fires test event; no LureAtlas public UI required yet.

---

## 11. Out of Backlog (Charter Non-Goals)

- Shopping cart, checkout, inventory, payments  
- Native iOS/Android apps  
- Real-time regulation engine  
- Unmoderated public wiki editing  

---

*Backlog groomed at Sprint 0 completion. Product owner reprioritizes at sprint boundaries.*
