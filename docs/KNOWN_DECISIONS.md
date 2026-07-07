# Known Decisions

**Document:** KNOWN_DECISIONS  
**Project:** TrollMatch / Balık Oltamda Guide  
**Status:** Architectural memory — **do not revisit without strong evidence**  
**Onboarding:** [`AI_CONTEXT.md`](../AI_CONTEXT.md) · **ADR detail:** [`004_DECISIONS.md`](004_DECISIONS.md) · **History:** [`CHANGELOG.md`](CHANGELOG.md)

This document records **why** the platform is shaped the way it is. It is not a backlog and not a spec. When someone proposes reversing a decision here, they must show evidence that the original problem no longer applies — and update the relevant ADR or policy doc.

---

## How to use this document

| If you want to… | Read |
|-----------------|------|
| Quick summary of current laws | `AI_CONTEXT.md` |
| Full ADR context and consequences | `004_DECISIONS.md` |
| Term definitions and examples | `docs/fishing/` |
| Why a sprint chose X | `CHANGELOG.md` |

**Reversal bar:** A convenience argument, trend, or generic best practice is not enough. Required: documented user harm, failed metric, or new constraint — plus a migration plan.

---

# Domain & fishing knowledge

## 1. Lexicon first

| | |
|---|---|
| **Why** | Fishing vocabulary is regional, loanword-heavy, and routinely mistranslated. Ad hoc strings in components, seeds, and importers caused inconsistent UI, broken search, and importer mismatches within weeks of multi-manufacturer import. |
| **Alternatives rejected** | Inline labels in code · machine translation for preferred terms · “fix copy later” · treating `tr.json` as a translation of `en.json` for domain terms |
| **Problems prevented** | Beden/Lider-style literal translations · duplicate synonyms for the same concept · species names invented in UI · AI inventing Turkish equivalents · unreconcilable search aliases |

**Locked in:** Sprint 7.2 · [`TERMINOLOGY.md`](fishing/TERMINOLOGY.md) · `ui/src/modules/terminology/`

---

## 2. Scientific taxonomy is canonical

| | |
|---|---|
| **Why** | Anglers and forums disagree; internet popularity misidentifies fish (e.g. Akya conflated with greater amberjack). The platform must remain trustworthy across regions and decades. Latin names are stable identifiers; common names are display and search layers. |
| **Alternatives rejected** | Regional common name as primary key · one species record per local name · merging confused species because names overlap · city-level regional naming · importer auto-overwriting scientific assignment from marketing text |
| **Problems prevented** | Wrong lure recommendations to wrong fish · SEO pages for non-existent “species” · irreversible alias pollution · Mediterranean advice silently applied globally |

**Locked in:** Sprint 7.4.1 · [`TAXONOMY_POLICY.md`](fishing/TAXONOMY_POLICY.md) · ADR-014

---

## 3. Species → Technique → Lure

| | |
|---|---|
| **Why** | A species never has one fishing method. Effectiveness depends on technique (trolling vs casting vs jigging), which changes tackle, depth, speed, and presentation. Bare species→lure links reproduce the same failure mode as generic AI fishing advice. |
| **Alternatives rejected** | Species-wide “top lures” rankings · undifferentiated `LureSpecies` tags for effectiveness UI · catch reports without technique · AI summaries that omit technique · manufacturer packaging species list as field recommendation |
| **Problems prevented** | Misleading rankings · unfilterable discovery · community data that cannot be compared · false confidence from marketing tags |

**Locked in:** Sprint 7.3–7.4.1 · [`SPECIES_TECHNIQUE_LURE_POLICY.md`](fishing/SPECIES_TECHNIQUE_LURE_POLICY.md)

---

## 4. Probability-based fishing knowledge

| | |
|---|---|
| **Why** | Fishing outcomes are uncertain. The platform aggregates field evidence under context (species, technique, region, season) — it does not guarantee catches or present marketing as certainty. |
| **Alternatives rejected** | “Best lure” absolutes · deterministic recommendation engines · hiding disagreement · presenting AI or manufacturer claims as verified outcomes |
| **Problems prevented** | False certainty that damages trust · legal/reputation risk from guaranteed advice · community evidence drowned by single loud anecdote |

**Locked in:** Charter §9 · `003_MASTER_CONTEXT.md` · catch report and ranking UX

---

## 5. Independent Turkish and English (not literal translation)

| | |
|---|---|
| **Why** | Turkish sport-fishing uses established loanwords and regional usage (Türkiye / Northern Cyprus). Literal dictionary translation produces wrong rigging concepts and alienates core users. |
| **Alternatives rejected** | Machine translation for lexicon preferred labels · single-locale authoring with auto-translate · administrative Turkish for tackle terms |
| **Problems prevented** | Leader→Beden class errors · inconsistent bilingual search · second-class Turkish experience |

**Locked in:** Sprint 7.2 · [`LOCALIZATION_GUIDE.md`](fishing/LOCALIZATION_GUIDE.md) · ADR-011 (collation)

---

## 6. Confused species ≠ aliases

| | |
|---|---|
| **Why** | Some regional mistakes are systematic (same wrong name applied to two taxa). Treating them as aliases would permanently attach a name to the wrong fish. |
| **Alternatives rejected** | Cross-species aliases “for search convenience” · silent merge when names overlap · disambiguation without editorial reason |
| **Problems prevented** | Permanent taxonomy corruption · search that reinforces angler mistakes |

**Locked in:** Sprint 7.4.1 · `SpeciesConfusion` model · [`TAXONOMY_POLICY.md`](fishing/TAXONOMY_POLICY.md)

---

## 7. Regional names at country/major region only

| | |
|---|---|
| **Why** | City-level fish naming is unmaintainable and non-portable. Country and major region (e.g. KKTC) match how editors and taxonomists work. |
| **Alternatives rejected** | City, harbour, or spot-level species naming · GPS-derived regional labels on taxonomy |
| **Problems prevented** | Unbounded alias growth · maintenance collapse · false precision |

**Locked in:** [`TAXONOMY_POLICY.md`](fishing/TAXONOMY_POLICY.md)

---

# Trust & data quality

## 8. Trust-first product

| | |
|---|---|
| **Why** | Anglers have infinite free text advice (forums, video, ChatGPT). TrollMatch wins only if users trust *why* a claim is shown. Sprint 6.3 shifted Studio and public UI from “edit catalog” to “show confidence and provenance.” |
| **Alternatives rejected** | Generic admin CMS · hidden provenance · merged “verified” badge without source · optimizing for catalog volume over confidence |
| **Problems prevented** | Indistinguishable marketing and field evidence · editor burnout typing data AI could guess · user perception as another content farm |

**Locked in:** Sprint 6.3, 8.3 · `ui/src/modules/trust/` · charter product principles §9

---

## 9. Provenance ≠ verification

| | |
|---|---|
| **Why** | “Manufacturer said it” and “editor confirmed it” answer different questions. Merging them in UI recreates manufacturer marketing as editorial endorsement. |
| **Alternatives rejected** | Single “verified” flag · timestamp-only trust · hiding origin on community claims |
| **Problems prevented** | COI blindness · users unable to judge claim strength · moderation disputes without audit trail |

**Locked in:** ADR-006 · `007_DATABASE_VISION.md` §4.1 · Sprint 8.3 source badges

---

## 10. Manufacturer information ≠ editorial knowledge

| | |
|---|---|
| **Why** | Factory specs and packaging targets describe the product; community and editorial layers describe effectiveness in the wild. Collapsing them makes marketing the default recommendation. |
| **Alternatives rejected** | Importer overwriting editor notes · treating `LureSpecies` marketing tags as effectiveness · auto-publishing manufacturer text without review |
| **Problems prevented** | Catalog corruption · loss of Balık Oltamda editorial independence · importers destroying curated context |

**Locked in:** Studio rule (imports never overwrite `lure_editor_notes`) · `LureSpecies` association kinds · Sprint S014 two-lifecycle model

---

## 11. Real fishing experience is highest-value evidence

| | |
|---|---|
| **Why** | Verified catch reports are structured, attributable, and technique-qualified — they encode what actually happened, not what a model predicts. |
| **Alternatives rejected** | AI-generated effectiveness claims · manufacturer tags as primary ranking signal · unmoderated community votes replacing editorial review |
| **Problems prevented** | Hallucinated “works for X” advice · unchallengeable marketing rankings · contributor distrust when AI overrides field data |

**Locked in:** Charter · Sprint 7.3 · catch report verification workflow

---

## 12. AI assists — humans verify

| | |
|---|---|
| **Why** | LLMs confabulate specs and regional advice. AI is valuable for drafts, deduplication hints, and search synthesis — not as silent canonical source. |
| **Alternatives rejected** | Auto-publish from AI · RAG over open web for specs · presenting AI output as community or expert verified · public assistant without citations |
| **Problems prevented** | Brand damage from wrong diving depths · regulatory exposure · destruction of competitive differentiation vs ChatGPT |

**Locked in:** Charter §13 · ADR-012 · `FEATURE_AI_DISCOVERY` gating · Sprint 7.4 index policy

---

## 13. Community over model (when in conflict)

| | |
|---|---|
| **Why** | Repeated independent field observations outweigh a single model inference — but still require moderation before canonical promotion. |
| **Alternatives rejected** | AI wins by default · raw vote counts auto-publish · ignoring community when “AI confident” |
| **Problems prevented** | Contributor exodus · systematic bias toward fluent wrong answers |

**Locked in:** Charter product principle #2

---

## 14. Knowledge index — never mirror third-party content

| | |
|---|---|
| **Why** | Republishing articles, forum posts, or manufacturer pages creates copyright risk, stale copies, and false ownership of knowledge. |
| **Alternatives rejected** | Full-text mirror in DB · scraped social feeds · embedded republished photos · AI trained on unlicensed crawls as canonical |
| **Problems prevented** | DMCA exposure · stale content presented as current · platform becoming a scraper instead of a guide |

**Locked in:** Sprint 7.4 · [`013_KNOWLEDGE_PIPELINE.md`](013_KNOWLEDGE_PIPELINE.md)

---

# Architecture & infrastructure

## 15. Evolutionary domain design (do not over-model)

| | |
|---|---|
| **Why** | `007_DATABASE_VISION.md` describes a ten-year model. Building it all upfront would block angler-facing delivery and produce entities no UI uses. The product earns complexity sprint by sprint. |
| **Alternatives rejected** | Implement full `007` ontology “for completeness” · sub-techniques and presentation matrices before product need · JSON blobs instead of typed fields when the product already needs types · typed fields for concepts no workflow uses |
| **Problems prevented** | Unmaintainable schema · engineers needing diagrams for daily work · angler UX buried in abstraction |

**Locked in:** Sprint 7.4.1 docs · [`002_ENGINEERING_PRINCIPLES.md`](002_ENGINEERING_PRINCIPLES.md) §2

---

## 16. Modular monolith (not microservices first)

| | |
|---|---|
| **Why** | Small team, strong transactional publish workflows, shared types. Network boundaries would multiply ops cost without traffic justification. |
| **Alternatives rejected** | Microservices from day one · separate repos per module · shared production database with PrestaShop retail |
| **Problems prevented** | Distributed transaction pain on publish · duplicated taxonomy · operational overhead before product-market fit |

**Locked in:** ADR-001 · charter §11 · current: single Next.js app in `ui/`

---

## 17. Knowledge platform — not e-commerce

| | |
|---|---|
| **Why** | Balık Oltamda already operates a shop. The Guide is editorially independent reference software; mixing cart/checkout would corrupt ranking, trust, and scope. |
| **Alternatives rejected** | In-app purchase · inventory · checkout · using shop SKUs as primary catalog keys without provenance |
| **Problems prevented** | Architecture rework · ranking polluted by stock · users treating guide as storefront · brand conflict with non-stocked manufacturers |

**Locked in:** Charter non-goals · ADR-013 (sponsored links separate)

---

## 18. Two lifecycles: editorial vs manufacturer feed

| | |
|---|---|
| **Why** | A lure can be editorially published while discontinued on a manufacturer site — or imported but not yet reviewed. One enum cannot represent both. |
| **Alternatives rejected** | Single `status` column · deleting models when SKUs disappear · auto-unpublish on import miss without editor action |
| **Problems prevented** | Accidental public takedown · loss of community/historical data · conflating “missing from feed” with “rejected by editors” |

**Locked in:** Sprint S014 · [`MANUFACTURER_LIFECYCLE.md`](domain/MANUFACTURER_LIFECYCLE.md)

---

## 19. Importers never delete catalog rows

| | |
|---|---|
| **Why** | Community catch reports, editor notes, and merge history attach to stable model ids. Hard deletes fork provenance and break URLs. |
| **Alternatives rejected** | Sync-by-delete import · full table replace per run · orphaning community data on SKU removal |
| **Problems prevented** | Broken foreign keys · dead bookmarks · unrecoverable editorial work |

**Locked in:** Sprint S007+ · manufacturer lifecycle policy · `ManufacturerProductStatus` for feed presence

---

## 20. Background import jobs (async Import Center)

| | |
|---|---|
| **Why** | Manufacturer imports run minutes, not milliseconds. Running them inside HTTP requests caused 504 Gateway Timeouts and blocked Studio users. |
| **Alternatives rejected** | Synchronous import on button click · increasing server timeout without worker · client-only import (lost on tab close) |
| **Problems prevented** | Production timeouts · fragile UX · inability to run large multi-brand imports reliably |

**Locked in:** Sprint milestone `c557efb` · detached worker + `ImportBatch` polling

---

## 21. Research evidence — never production runtime

| | |
|---|---|
| **Why** | `research/` holds HTML snapshots, static JSON, and import reports — unreviewed, unlicensed for direct serving, and mutable by batch jobs. |
| **Alternatives rejected** | Reading research files in API handlers · serving snapshot HTML to users · scraping research into tables at request time |
| **Problems prevented** | Unmoderated content in production · accidental exposure of raw manufacturer HTML · non-idempotent public reads |

**Locked in:** Charter · `010_CURSOR_RULES.md` prohibited behaviors · import promotion pipeline only

---

## 22. CanonicalLureImport — single import contract

| | |
|---|---|
| **Why** | Each manufacturer formats data differently. One validated DTO before persistence enables shared validator, dedupe, audit, and Studio diffs. |
| **Alternatives rejected** | Per-manufacturer Prisma shapes · direct DB writes from parsers · skipping validation for “trusted” brands |
| **Problems prevented** | Schema drift per importer · untestable parsers · inconsistent publish requirements |

**Locked in:** Sprint S005–S016 · frozen in `PROJECT_STATE.md` change control

---

## 23. PostgreSQL as system of record

| | |
|---|---|
| **Why** | Knowledge claims, provenance chains, moderation, and merge lineage need relational integrity and transactions — especially publish + outbox. |
| **Alternatives rejected** | Document store as primary · eventual-consistency-only catalog · search index as source of truth |
| **Problems prevented** | Orphan claims · unrecoverable merge history · dual-write inconsistency |

**Locked in:** ADR-002 · **implementation:** Prisma in `ui/` (accepted drift from ADR Drizzle note until amended)

---

## 24. Meilisearch for faceted discovery (deferred, decision stands)

| | |
|---|---|
| **Why** | Faceted lure browse across locales and taxonomies should not use SQL `LIKE`. Turkish analyzer configuration requires a dedicated index. |
| **Alternatives rejected** | PostgreSQL full-text as primary faceted UX · Typesense (viable; Meilisearch chosen for Turkish docs) · client-side filter-only |
| **Problems prevented** | Slow faceted UI · broken Turkish search · coupling read load to OLTP database |

**Locked in:** ADR-003 · **current:** Prisma search is interim until angler UX proves need

---

## 25. Transactional outbox for projections

| | |
|---|---|
| **Why** | Published catalog must reach search index and RAG corpus without dual-write races. |
| **Alternatives rejected** | Dual write to Postgres + Meilisearch in handler · async fire-and-forget without outbox · indexing unpublished rows |
| **Problems prevented** | “Published but not searchable” · irreversible index drift · silent AI corpus staleness |

**Locked in:** ADR-010 · not fully implemented — decision stands for publish pipeline

---

## 26. Sponsored links isolated from ranking

| | |
|---|---|
| **Why** | Monetization must not destroy trust. Paid placement in organic sort is indistinguishable from editorial recommendation without strict separation. |
| **Alternatives rejected** | Paid boost in lure rankings · undisclosed affiliate ordering · shop inventory driving discovery order |
| **Problems prevented** | Credibility loss · regulatory disclosure failures · manufacturer pay-to-win perception |

**Locked in:** Charter §17 · ADR-013

---

# Product direction

## 27. Angler-first sprints (after Studio foundation)

| | |
|---|---|
| **Why** | Infrastructure and Studio reached sufficient depth. Further admin features without angler-visible loops did not increase return visits or trust. |
| **Alternatives rejected** | Infrastructure-first roadmap indefinitely · Studio dashboard stat cards before discovery · Meilisearch before Prisma search proves UX |
| **Problems prevented** | Internal tool that anglers never see · competitive loss to generic AI chat · team optimizing wrong metric |

**Locked in:** [`010_ANGLER_PRODUCT.md`](010_ANGLER_PRODUCT.md) · feature gate in `AI_CONTEXT.md`

---

## 28. Feature gate: more valuable than ChatGPT for anglers?

| | |
|---|---|
| **Why** | Raw AI capability is commoditized. The moat is verified knowledge, structured relationships (species↔technique↔lure↔source), and editorial trust. |
| **Alternatives rejected** | General fishing chatbot as primary product · open-web RAG as main lure discovery · AI-first roadmap |
| **Problems prevented** | Building undifferentiated features · neglecting lexicon, taxonomy, and catch reports · trust erosion |

**Locked in:** Sprint 7+ · [`002_ENGINEERING_PRINCIPLES.md`](002_ENGINEERING_PRINCIPLES.md) §1.6

---

## 29. Verification-first Studio (not CRUD admin)

| | |
|---|---|
| **Why** | Editors cannot type thousands of lure rows. Manufacturer imports and suggestions produce a verification queue; humans approve, reject, correct, or merge. |
| **Alternatives rejected** | Spreadsheet-style bulk editor as default · auto-publish on import · Studio optimized for data entry volume |
| **Problems prevented** | Editor bottleneck · unreviewed catalog pollution · Studio that scales linearly with SKU count |

**Locked in:** Sprint 6.2 · `catalog_suggestions` · attention inbox

---

## 30. Eastern Mediterranean editorial lens (default, not exclusive)

| | |
|---|---|
| **Why** | Balık Oltamda’s core expertise and launch audience are Aegean, Cyprus, and Turkish coasts. Default regional context improves relevance without blocking global expansion. |
| **Alternatives rejected** | Global-generic copy with no regional grounding · city-specific pages as primary model · ignoring locale in effectiveness claims |
| **Problems prevented** | Generic guide indistinguishable from international aggregators · false global claims from local data |

**Locked in:** Sprint 7+ priority stack · `LureEditorNote` regional fields · Sprint 7.6 scope

---

# Frozen until Milestone 1 (see PROJECT_STATE.md)

These are implementation freezes — not philosophical laws — but **do not refactor without product-owner approval:**

| Area | Decision |
|------|----------|
| Folder structure | `ui/src/modules/*`, not `features/` |
| Prisma core catalog schema | Manufacturer → Variant, Color/alias identity, species identity tables |
| Import framework | `ManufacturerImporter` registry → shared `manufacturer-import-pipeline` → `upsertCanonicalImport` |
| Canonical identity | F001 product color model · F002 species identity model |

---

# Changing a known decision

1. Document evidence (user harm, metric, or new constraint) — not preference alone.  
2. For technical choices: add or supersede an ADR in `004_DECISIONS.md`.  
3. For fishing domain laws: update the relevant `docs/fishing/` policy and lexicon.  
4. Update `AI_CONTEXT.md` if onboarding summary changes.  
5. Add a row to `CHANGELOG.md` when shipped.

---

*Architectural memory ratified from charter, ADRs, fishing policies, and shipped sprints through 8.3. Revisit only with evidence.*
