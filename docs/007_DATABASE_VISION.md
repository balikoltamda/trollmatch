# Database Vision

**Document:** 007_DATABASE_VISION  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Document type:** Long-horizon business data model (not a physical schema)  
**Horizon:** 10-year global knowledge platform (IMDb × Discogs × Wikipedia for sport fishing)  
**Authority:** Subordinate to `001_PROJECT_CHARTER.md` and `002_ENGINEERING_PRINCIPLES.md`  
**Chief Database Architect revision:** Normalized concepts, deduplicated semantics, explicit relationship law

---

## 1. Purpose and Scope

This document defines the **canonical business entities** and **relationship law** for Balık Oltamda Guide as a world-scale fishing knowledge platform. It is not a SQL schema, not an MVP cut-down, and not optimized for short-term delivery speed. It is optimized for **decades of data quality**, editorial integrity, and modular growth.

The model treats:

- **Catalog knowledge** like **Discogs** (manufacturers, product lines, variants, external identifiers, merges).
- **Structured facts and credits** like **IMDb** (claims, provenance, verification, roles, regional variants).
- **Community and reference articles** like **Wikipedia** (assertions, citations, disputes, consensus, revision history).

Every publishable fact decomposes into addressable **Knowledge Claims** with **Provenance Attribution**, optional **Verification Events**, and immutable **Audit Log Entries**. Community narrative remains distinct from manufacturer specification forever.

---

## 2. Architectural Layers

| Layer | Code | Responsibility |
|-------|------|----------------|
| **Identity & Access** | L0 | Users, roles, sanctions, preferences |
| **Knowledge Graph Core** | L1 | Stable identifiers, slugs, merges, redirects, cross-entity associations |
| **Trust & Provenance** | L2 | Claims, attribution, verification, source documents, quality assessments |
| **Reference Ontology** | L3 | Taxonomies, geography, time, environment, conservation |
| **Module Catalogs** | L4 | LureAtlas and future gear/species/location modules |
| **Community Evidence** | L5 | Field reports, assertions, votes, consensus, reputation events |
| **Media & Citation** | L6 | Assets, licenses, attachments, deduplication |
| **Knowledge Synthesis (AI)** | L7 | Suggestions, sessions, citations, prompts, corpus snapshots |
| **Editorial & Legal** | L8 | Moderation, corrections, disputes, appeals, takedowns |
| **Discovery Projection** | L9 | Search index registry, sync status, saved views (derived, governed) |
| **Ethical Commerce** | L10 | Retailers, sponsored links, disclosure policy, click ledger |

**Module ownership rule:** Module Catalog entities belong to one module namespace (`lure_atlas`, `species_compass`, …). Reference Ontology and Knowledge Graph Core are **platform-owned**. Modules reference platform ids; they never embed copies of canonical taxonomies.

---

## 3. Naming Conventions

| Pattern | Meaning | Example |
|---------|---------|---------|
| `Platform *` | L0–L3 shared kernel | Platform User, Platform Taxonomy Term |
| `LureAtlas *` | L4 lure module | LureAtlas Model, LureAtlas Variant |
| `* Attribution` | Origin of a claim, not proof of truth | Manufacturer Attribution, Community Attribution |
| `* Event` | Immutable point-in-time act | Verification Event, Reputation Event, Merge Event |
| `* Case` | Workflow container requiring resolution | Moderation Case, Dispute Case |
| `* Link` | Typed association between two entities | Entity Association Link, Retrieval Citation Link |
| `* Registry` | Canonical lookup table with stable ids | Slug Registry, External Identifier Registry |

**Retired semantic duplicates (normalized, entities preserved):**

| Former overlapping concept | Canonical concept | Legacy entity name retained as |
|-----------------------------|-------------------|----------------------------------|
| Origin metadata + review timestamp mixed | Split: **Provenance Attribution** + **Verification Event** | Provenance Record → Provenance Attribution; Verification → Verification Event |
| Retrieve Speed Band vs Trolling Speed | **Speed Range** is canonical; technique context via **Speed Range Application** | Retrieve Speed Band, Trolling Speed remain named application profiles |
| Region vs Climate Band ad hoc | **Geographic Context** composite with explicit slot rules | Region, Climate Band unchanged as building blocks |
| Manufacturer marketing species tags vs community effectiveness | **Entity Association Link** with `association_kind` | Fish Species tags split by kind |
| Generic moderation blob | **Moderation Case** typed by **Moderation Case Kind** | Moderation Case + Correction Request, Appeal, etc. |

---

## 4. Relationship Law (Global Rules)

### 4.1 Trust Ladder (display precedence)

1. **Expert Endorsement** (scoped, unexpired, no blocking COI flag)
2. **Verification Event** by authorized moderator or manufacturer authorized rep
3. **Community Consensus Group** (moderator-closed group of independent assertions)
4. **Published Knowledge Claim** with Community Attribution
5. **Manufacturer Attribution** on canonical catalog fields
6. **AI Suggestion** (never public canonical; moderator draft only until promoted via Verification Event)

Provenance Attribution answers **“where did this come from?”** Verification Event answers **“who confirmed it and when?”** Never conflate the two on UI badges.

### 4.2 Geographic Context Composition

**Geographic Context** is a reusable composite used by Usage Assertion, Catch Report, and aggregated analytics:

| Slot | Cardinality | Rule |
|------|-------------|------|
| `primary_classifier` | exactly 1 | One of: **Region**, **Climate Band**, or **Water Body** |
| `water_body_type` | 0..1 | Allowed when primary is Region or Climate Band; required context for inland techniques |
| `country` | 0..1 | Required when primary is Region; optional otherwise |
| `location` | 0..1 | Optional precision overlay; must not exceed moderator-approved **Location Precision Level** |

Region and Climate Band are **not mutually exclusive in storage** but **must not co-serve as dual primaries**—one primary classifier only. Location never replaces primary; it refines.

### 4.3 Temporal Scope Composition

**Temporal Scope** attaches to Usage Assertion and Catch Report:

| Component | Purpose |
|-----------|---------|
| **Season Window** | Named season (spring run, monsoon, ice-free months) |
| **Month Window** | Calendar month range (hemisphere-aware metadata on Season Window) |
| **Observation Date** | Exact date on Catch Report only |

Effectiveness claims without Temporal Scope are stored as **year-round unknown- season**—not silently global.

### 4.4 Catch Report → Usage Assertion Derivation

| Rule | Behavior |
|------|----------|
| Derivation | Catch Report approval may spawn **at most one** suggested Usage Assertion per distinct (lure variant, species, technique, geographic context hash) |
| Deduplication | Existing published assertion with same hash links via **Derivation Link**; does not duplicate |
| Public visibility | Catch Report may remain public while derived assertion is pending; UI labels derivation state |
| Provenance | Derived assertion inherits Community Attribution referencing source Catch Report id |

### 4.5 Catalog Tag vs Evidence Claim

| Link kind | Attached to | Meaning | Filter use |
|-----------|-------------|---------|------------|
| `manufacturer_marketing_target` | LureAtlas Model → Fish Species | Factory packaging claim | Manufacturer browse only unless moderator promoted |
| `community_effectiveness` | Usage Assertion → Fish Species | Field-supported suitability | Discovery ranking |
| `moderator_curated_target` | LureAtlas Model → Fish Species | Editorially approved target list | Primary discovery |

All three use **Entity Association Link** with different `association_kind` values—never one undifferentiated tag table.

### 4.6 Localized Text Publication Rule

**Localized Text** carries its own **Content Lifecycle State** and **Provenance Attribution**. Parent entity locale visibility:

| Parent state | Locale text state | Public behavior |
|--------------|-------------------|-----------------|
| published | published | Show locale text |
| published | draft / pending | Fallback chain: user locale → English → any published locale → “translation pending” label |
| published | rejected | Fallback only; never show rejected text |
| deprecated | any published | Show with parent deprecation banner |

### 4.7 Merge and Identity Persistence

All catalog entities participating in public URLs use **Platform Canonical Identifier** (immutable UUID). **Slug Registry Entry** is locale-specific and mutable only via redirect. **Entity Merge Record** preserves merged id → survivor id map forever.

---

## 5. Knowledge Graph Core (L1)

### 5.1 Platform Canonical Identifier

**Purpose.** Immutable primary key for every long-lived entity exposed publicly.

**Relationships.** One per catalog or reference entity; referenced by Slug Registry, External Identifier Registry, Entity Merge Record, Entity Association Link.

**Why it exists.** Discogs-style survivor merges without breaking foreign references from community claims years later.

**Future scalability.** UUID v7 or ULID choice deferred to physical schema; business id never changes.

---

### 5.2 Slug Registry Entry

**Purpose.** Locale-aware URL slug (`tr`, `en`, …) bound to entity type and canonical id.

**Relationships.** Points to Platform Canonical Identifier; superseded slugs link to **Slug Redirect Entry**.

**Why it exists.** Wikipedia-style stable URLs with hreflang parity across decades.

**Future scalability.** Slug history unlimited; redirects chain-safe.

---

### 5.3 Slug Redirect Entry

**Purpose.** HTTP-semantics redirect from retired slug to current Slug Registry Entry after merge, rename, or deprecation.

**Relationships.** Old slug → new slug; optional **Entity Merge Record** reference.

**Why it exists.** SEO and bookmark survival across catalog corrections.

**Future scalability.** Multi-hop redirect compression job without losing audit trail.

---

### 5.4 Entity Merge Record

**Purpose.** Documents consolidation of duplicate catalog entities: survivor id, merged id, field resolution map, merge reason, moderator or ingestion authority.

**Relationships.** Links to Moderation Case; generates Slug Redirect Entries; writes Audit Log Entry; may trigger Search Index Sync Record.

**Why it exists.** IMDb-style merge lineage; prevents forked provenance chains.

**Future scalability.** Bulk merge from ingestion batch references one merge record with many merged ids.

---

### 5.5 Entity Association Link

**Purpose.** Typed directed or bidirectional link between any two platform entities with `association_kind`, strength, effective date range, and optional Provenance Attribution.

**Relationships.** Connects LureAtlas Model to Fish Species, Technique to LureAtlas Model, Species to Conservation Rule Reference, etc.

**Why it exists.** One flexible graph edge model instead of dozens of special-case join entities.

**Future scalability.** Graph analytics (PageRank on effectiveness) without schema churn.

---

### 5.6 External Identifier Registry Entry

**Purpose.** Maps catalog variants to UPC, EAN, manufacturer SKU, retailer SKU, PrestaShop product id, affiliate network ids.

**Relationships.** Belongs to LureAtlas Variant (extensible to future gear variants); multiple registry rows per variant; scoped by region and retailer.

**Why it exists.** Discogs-style external id hub for ingestion idempotency and sponsored link matching.

**Future scalability.** Prevents wrong merge when SKU reused across generations via effective date range on registry row.

---

## 6. Trust & Provenance (L2)

### 6.1 Knowledge Claim

**Purpose.** Atomic addressable fact: subject entity + `claim_predicate` + value + unit + optional qualifier JSON—not free prose.

**Relationships.** Carries Provenance Attribution; subject to Verification Events; grouped into parent entity field projections; referenced by Retrieval Citation Link.

**Why it exists.** Wikipedia-style atomic statements enable diff, dispute resolution, and AI citation at field granularity.

**Future scalability.** Billions of claims across modules; predicate registry extensible without redesign.

---

### 6.2 Provenance Attribution

*(Evolved from Provenance Record; same entity, normalized name.)*

**Purpose.** Origin classification for a Knowledge Claim or Localized Text body: manufacturer spec sheet, community observation, moderator import, AI draft, expert statement, ingestion batch.

**Relationships.** Links to Source Document optional; links to Contributor Profile or Organization optional; **does not** imply verification.

**Why it exists.** Separates “who said it first” from “who confirmed it true.”

**Future scalability.** Version chain of attributions per claim; current pointer on canonical projection.

---

### 6.3 Verification Event

*(Evolved from Verification; same entity, normalized name.)*

**Purpose.** Timestamped act confirming a Knowledge Claim set, Localized Text, or Usage Assertion as editorally accepted—moderator, manufacturer rep, or expert.

**Relationships.** References verifier User; scoped by **Field Scope Descriptor** (explicit field list or claim id list); optional expiry **Re-verification Due Date**; supersedes prior Verification Event without deletion.

**Why it exists.** Powers “last verified” UI distinct from manufacturer origin badge.

**Future scalability.** Scheduled re-verification queues when manufacturer updates spec.

---

### 6.4 Source Document

**Purpose.** First-class bibliographic record: PDF spec sheet URL, press kit, email confirmation hash, scanned catalog page, regulation PDF, with license class and retention policy.

**Relationships.** Linked from Provenance Attribution, Ingestion Batch, Conservation Rule Reference, Dispute Case evidence.

**Why it exists.** Manufacturer IP disputes require document pointer, not “trust manufacturer enum.”

**Future scalability.** Content-addressed storage hash deduplicates identical spec sheets across brands.

---

### 6.5 Field Scope Descriptor

**Purpose.** Machine-readable list of fields or Knowledge Claim ids targeted by a Verification Event, Expert Endorsement, or Correction Request.

**Relationships.** Used by Verification Event, Expert Endorsement, Data Quality Assessment.

**Why it exists.** Makes partial endorsements implementable and auditable.

**Future scalability.** Shared vocabulary of field paths per module (`lure_atlas.model.weight_g`).

---

### 6.6 Publish Requirement Rule

**Purpose.** Defines required Knowledge Claims and associations for an entity type to reach `published` lifecycle (per module, per Lure Form Factor).

**Relationships.** Evaluated by Data Quality Assessment on publish transition.

**Why it exists.** Replaces vague “complete core metadata” with explicit, evolvable publish gate definitions.

**Future scalability.** Rules versioned; reassessment jobs when rules tighten.

---

### 6.7 Data Quality Assessment

**Purpose.** Point-in-time scorecard: entity id, rule set version, pass/fail per requirement, blocking deficiencies list.

**Relationships.** Output of publish attempt or scheduled audit; visible to moderators; not public marketing score unless product chooses.

**Why it exists.** Automated completeness without compromising quality bar.

**Future scalability.** Historical assessments explain why legacy records grandfathered.

---

### 6.8 Content Lifecycle State

**Purpose.** Universal lifecycle enum: `draft`, `pending_review`, `published`, `deprecated`, `rejected`, `scheduled_publish`, `archived`.

**Relationships.** Carried by every publishable aggregate and Localized Text; transitions logged in Audit Log Entry only via named transition services.

**Why it exists.** Single state machine vocabulary platform-wide.

**Future scalability.** Module-specific transition extensions via Moderation Case Kind without new states.

---

### 6.9 Audit Log Entry

**Purpose.** Append-only ledger: actor, action verb, entity reference, diff or claim ids, Moderation Case reference, compensating flag.

**Relationships.** Supersedes nothing; compensating entries reference prior entry id.

**Why it exists.** Legal, trust, and AI incident forensics for decades.

**Future scalability.** Cold storage tiering with summary hash chain for integrity proofs.

---

## 7. Reference Ontology (L3)

### 7.1 Platform Taxonomy Domain

**Purpose.** Namespace for controlled vocabularies: `species`, `technique`, `lure_action`, `buoyancy`, `color_pattern`, `form_factor`, `environment`, …

**Relationships.** Contains Platform Taxonomy Terms; versioned by Taxonomy Version.

**Why it exists.** One ontology maintenance pipeline instead of orphaned enums.

**Future scalability.** Import from external ontologies (FishBase, WoRMS) via mapping links.

---

### 7.2 Platform Taxonomy Term

**Purpose.** Canonical node in a domain with stable id, hierarchical parent optional, deprecated flag.

**Relationships.** Fish Species, Fishing Technique, Lure Action, Buoyancy Class, Color Pattern, Lure Form Factor, Water Body Type, Environmental Condition are **typed facades** over Taxonomy Term (same id, domain-specific API views)—not duplicate storage.

**Why it exists.** Synonym management and deprecation mapping once for all taxonomies.

**Future scalability.** Cross-domain links (technique → typical environment terms).

---

### 7.3 Taxonomy Synonym

**Purpose.** Alias string → canonical Taxonomy Term, with locale, source (manufacturer, regional slang, misspelling), and confidence.

**Relationships.** Many synonyms per term; powers search normalization.

**Why it exists.** “Lufer”, “bluefish”, “tailor” converge without merging species records.

**Future scalability.** ML-suggested synonyms enter as AI Suggestion until curator approves Synonym row.

---

### 7.4 Taxonomy Version

**Purpose.** Version stamp when terms merged, split, or deprecated; maps old term id → replacement via **Taxonomy Term Deprecation Map**.

**Relationships.** Triggers reassessment of Knowledge Claims referencing deprecated terms.

**Why it exists.** decade-long taxonomy drift without silent corruption of historical assertions.

**Future scalability.** Automated claim migration proposals as Moderation Case bulk jobs.

---

### 7.5 Taxonomy Term Deprecation Map

**Purpose.** Records `from_term_id`, `to_term_id`, mapping kind (`exact`, `broader`, `split`), effective date.

**Relationships.** Created during Taxonomy Version publish.

**Why it exists.** Historical Usage Assertions remain interpretable after taxonomy cleanup.

**Future scalability.** Multi-target splits (one old term → several new).

---

### 7.6 Fish Species

**Purpose.** Typed Taxonomy Term facade: Latin name invariant, habit metadata, conservation sensitivity, protected flag.

**Relationships.** SpeciesCompass Extension (1:0..1 published); Entity Association Links from lures and assertions; Conservation Rule References.

**Why it exists.** Primary biological anchor for all modules—never duplicated in LureAtlas.

**Future scalability.** Subspecies nodes; regional stock populations as child terms.

---

### 7.7 Fishing Technique

**Purpose.** Typed Taxonomy Term facade with parent/child hierarchy (trolling → downrigger trolling).

**Relationships.** TechniqueLibrary Article (0..n); Speed Range Applications; Usage Assertions require one primary technique.

**Why it exists.** Discovery axis #2 after species across all gear modules.

**Future scalability.** Technique compatibility matrix (technique × water body type).

---

### 7.8 Lure Action

**Purpose.** Typed Taxonomy Term facade for swimming action vocabulary.

**Relationships.** LureAtlas Model references 1..n actions; optional on Usage Assertion context.

**Why it exists.** Normalizes marketing adjectives to comparable filters.

**Future scalability.** Action videos as Media Attachment evidence linked to action term definitions.

---

### 7.9 Lure Form Factor

**Purpose.** Typed Taxonomy Term facade: crankbait, jerkbait, soft plastic, spinnerbait, inline spinner, jig, fly, …—distinct from Product Line and Lure Action.

**Relationships.** Required on LureAtlas Model; drives Publish Requirement Rule sets.

**Why it exists.** Anglers filter form factor before brand; Discogs-style primary type classification.

**Future scalability.** Future ReelAtlas, RodAtlas modules reuse form factor patterns.

---

### 7.10 Buoyancy Class

**Purpose.** Typed Taxonomy Term facade: floating, suspending, sinking classes.

**Relationships.** Required dimension on many LureAtlas Models; pairs with Diving Depth Profile.

**Why it exists.** Faceted search when depth curve data absent.

**Future scalability.** Stable small enum domain.

---

### 7.11 Diving Depth Profile

**Purpose.** Structured depth behavior for factory spec: min/max running depth meters, lip type, sink rate optional.

**Relationships.** Attached to LureAtlas Model or Variant; manufacturer spec claims as Knowledge Claims separate from field observation depths on Usage Assertion.

**Why it exists.** Separates catalog spec from “ran at 8m on my boat” observation claims.

**Future scalability.** Depth curve JSON for advanced lures (dive table by speed).

---

### 7.12 Color Pattern

**Purpose.** Typed Taxonomy Term facade for normalized colorway description.

**Relationships.** LureAtlas Variant references one primary Color Pattern; manufacturer color codes map via Taxonomy Synonym.

**Why it exists.** Discogs-style release color variant identity.

**Future scalability.** Spectral metadata (UV, flash) as structured claim extensions.

---

### 7.13 Speed Range

**Purpose.** Canonical numeric range in knots (canonical unit) with optional meters-per-second derivative—**single speed entity for all techniques**.

**Relationships.** Linked to LureAtlas Model via Knowledge Claim; linked to Fishing Technique via **Speed Range Application**; referenced by Usage Assertion context.

**Why it exists.** Eliminates duplicate speed semantics while preserving technique-specific application.

**Future scalability.** Unlimited named ranges; comparison normalizes to SI-derived display.

---

### 7.14 Speed Range Application

**Purpose.** Join entity: Speed Range + Fishing Technique + application label (`trolling`, `casting`, `jerkbait retrieve`) + optional rig notes pointer.

**Relationships.** **Retrieve Speed Band** and **Trolling Speed** are preserved as **standard named Speed Range Application profiles** in seed data—not separate numeric models.

**Why it exists.** Keeps Retrieve Speed Band and Trolling Speed as domain language without duplicating range storage.

**Future scalability.** New technique profiles added without schema change.

---

### 7.15 Retrieve Speed Band

**Purpose.** Preserved domain term denoting a Speed Range Application profile optimized for casting and general retrieve techniques.

**Relationships.** Implementationally a Speed Range Application row with profile code `retrieve_speed_band`; linked from LureAtlas Model manufacturer claims and Usage Assertions.

**Why it exists.** Angler and manufacturer vocabulary preservation in API and UI labels.

**Future scalability.** Profile library grows via taxonomy curation.

---

### 7.16 Trolling Speed

**Purpose.** Preserved domain term denoting a Speed Range Application profile for trolling techniques including downrigger/planer context metadata.

**Relationships.** Speed Range Application with profile code `trolling_speed`; optional link to Rig Configuration Template.

**Why it exists.** TrollMatch domain anchor; distinct labeling from generic retrieve speeds.

**Future scalability.** Sub-profiles for freshwater vs offshore trolling.

---

### 7.17 Leader Setup

*(Normalized name: Leader → Leader Setup; same entity.)*

**Purpose.** Reusable leader specification: material, length range, breaking strain, wire vs fluoro vs mono, hook leader vs main connection.

**Relationships.** Embedded in Rig Configuration Template; optional on Usage Assertion and Catch Report.

**Why it exists.** Rig context determines lure effectiveness; deduplicated across thousands of assertions.

**Future scalability.** Leader Setup library curated by community and manufacturers.

---

### 7.18 Main Line Setup

**Purpose.** Main line (not leader) specification: material, diameter, breaking strain, reel capacity context—distinct from Leader Setup.

**Relationships.** Part of Rig Configuration Template; optional on Catch Report.

**Why it exists.** Trolling speed and depth claims require line class context for expert review.

**Future scalability.** Future knot and line modules reference same setup ids.

---

### 7.19 Rig Configuration Template

**Purpose.** Named reusable rig: Leader Setup, Main Line Setup, Speed Range Application optional, hook modification notes, typical target species.

**Relationships.** Referenced by Usage Assertion, Catch Report, TechniqueLibrary Article, Rigging Tip.

**Why it exists.** IMDb-style “production crew” pattern for tackle setups—compose once, reference everywhere.

**Future scalability.** Template versioning when components change.

---

### 7.20 Country

**Purpose.** ISO-aligned sovereign state reference.

**Relationships.** Organization headquarters; Conservation Rule Reference jurisdiction; Geographic Context optional slot.

**Why it exists.** Regulation and manufacturer origin normalization.

**Future scalability.** Handles disputed territory metadata as dedicated claims, not silent merges.

---

### 7.21 Region

**Purpose.** Cultural or administrative fishing region with hierarchical parent, localized names, bounding metadata optional.

**Relationships.** Geographic Context primary classifier; overlaps multiple Climate Bands allowed as **Region Climate Band Overlay** (association link, not dual primary).

**Why it exists.** Anglers reason in regional place names.

**Future scalability.** Deep hierarchy: continent → sea basin → local area.

---

### 7.22 Climate Band

**Purpose.** Environmental classifier: latitude band, typical water temperature class, general water type tendency—not a place name.

**Relationships.** Geographic Context primary classifier; Season Window associations curated for species modules.

**Why it exists.** Privacy-safe alternative to GPS for effectiveness claims.

**Future scalability.** Climate change drift handled by versioning bands, not rewriting assertions.

---

### 7.23 Water Body Type

**Purpose.** Typed Taxonomy Term facade for water category.

**Relationships.** Classifies Water Body; tags Geographic Context secondary slot.

**Why it exists.** Technique suitability differs by water category independent of named body.

**Future scalability.** Module-agnostic expansion.

---

### 7.24 Water Body

**Purpose.** Named hydrological feature with localized names, optional Country/Region, Water Body Type.

**Relationships.** Geographic Context primary classifier; aggregated LocationInsights statistics.

**Why it exists.** “Works in the Med” without spot GPS.

**Future scalability.** Hydrographic database sync via External Identifier Registry.

---

### 7.25 Location

**Purpose.** Precision overlay with **Location Precision Level**: `country_only`, `region`, `water_body`, `approximate_grid`, `precise_coordinates_with_consent`.

**Relationships.** Child of Geographic Context; moderated downward only, never upward without new submission.

**Why it exists.** Charter privacy law encoded in data model.

**Future scalability.** Grid cell ids instead of raw coordinates for aggregation.

---

### 7.26 Geographic Context

**Purpose.** Composite value object persisted as entity: enforces slot rules in §4.2; shared by Usage Assertion and Catch Report.

**Relationships.** Built from Country, Region, Climate Band, Water Body, Water Body Type, Location.

**Why it exists.** One validation locus for geographic semantics.

**Future scalability.** Hash key for deduplication and analytics cubes.

---

### 7.27 Season Window

**Purpose.** Named seasonal period with hemisphere and latitude applicability metadata.

**Relationships.** Composes Temporal Scope with Month Window.

**Why it exists.** “Spring run” is not a calendar month alone.

**Future scalability.** Linked to SpeciesCompass migration patterns.

---

### 7.28 Month Window

**Purpose.** Inclusive calendar month range (1–12) with optional hemisphere flag.

**Relationships.** Part of Temporal Scope; validated against Season Window when both present.

**Why it exists.** Fine-grained seasonal effectiveness without false precision of day-level globally.

**Future scalability.** Locale-aware display names via Localized Text.

---

### 7.29 Temporal Scope

**Purpose.** Composite: optional Season Window, optional Month Window, optional observation date anchor rules.

**Relationships.** Required on Usage Assertion for published effectiveness claims; optional on Catch Report.

**Why it exists.** Separates temporal from geographic dimensions cleanly.

**Future scalability.** Climate anomaly flags (El Niño year) as future extension claims.

---

### 7.30 Environmental Condition

**Purpose.** Typed Taxonomy Term facade for weather and sea state at observation time: wind band, sea roughness, water clarity, air temperature band.

**Relationships.** Optional on Catch Report; optional context on Usage Assertion.

**Why it exists.** Previously orphaned “optional enums” now first-class.

**Future scalability.** Sensor and buoy data attachment via Source Document in future integrations.

---

### 7.31 Conservation Rule Reference

**Purpose.** Jurisdiction-specific rule pointer: Country + Fish Species + official source URL + bag/size limits as structured claims + effective date range.

**Relationships.** Links to Source Document; surfaced by Species and Location modules; AI refusal rules reference this id.

**Why it exists.** Platform links to law; does not pretend to be authority.

**Future scalability.** Version chain when regulations change mid-season.

---

## 8. LureAtlas Module Catalog (L4)

### 8.1 Organization

**Purpose.** Legal commercial entity: may hold multiple roles simultaneously.

**Relationships.** Role flags via **Organization Role Assignment** (`manufacturer`, `retailer`, `distributor`, `sponsor`); Manufacturer and Retailer facades reference Organization id.

**Why it exists.** Shimano-as-manufacturer and retailer relationships without duplicate org rows; COI tracking at org level.

**Future scalability.** Conglomerate acquisitions via Entity Merge Record at Organization level.

---

### 8.2 Organization Role Assignment

**Purpose.** Time-bounded role an Organization plays in the platform ecosystem.

**Relationships.** Manufacturer facade requires `manufacturer` role; Retailer facade requires `retailer` role; same Organization may have both with **Editorial Firewall Policy** acknowledgment on file.

**Why it exists.** Balık Oltamda retail COI visible when org is both sponsor and catalog source.

**Future scalability.** Role-specific contact and data license fields.

---

### 8.3 Manufacturer

**Purpose.** Facade for Organization with manufacturer role: catalog ownership, spec licensing, logo Media Asset.

**Relationships.** Owns Product Lines; Provenance Attribution on factory Knowledge Claims; may authorize Verification Events via manufacturer rep User.

**Why it exists.** Discogs label/manufacturer browse experience.

**Future scalability.** Manufacturer portal API keys scoped to own Organization ids only.

---

### 8.4 Retailer

**Purpose.** Facade for Organization with retailer role: outbound commerce, affiliate metadata, disclosure obligations—not inventory.

**Relationships.** Sponsored Links; Sponsored Click Ledger Entry; optional same Organization as Manufacturer with visible COI badge.

**Why it exists.** Ethical monetization registry isolated from catalog ranking.

**Future scalability.** Geo availability matrix per country without catalog changes.

---

### 8.5 Product Line

**Purpose.** Manufacturer’s product family (series) spanning years and multiple LureAtlas Models.

**Relationships.** Localized Text descriptions; deprecated as whole when discontinued.

**Why it exists.** Discogs master release series grouping.

**Future scalability.** Cross-manufacturer collaboration lines (joint ventures) via two Organization links.

---

### 8.6 LureAtlas Model

*(Normalized name: Lure Model → LureAtlas Model.)*

**Purpose.** Canonical lure design at model level—all variants share core action and form.

**Relationships.** Belongs to Product Line and Manufacturer; has Variants; Knowledge Claims for specs; Entity Association Links for species/techniques; Usage Assertions; Rigging Tips; Media Attachments; Content Lifecycle State; Slug Registry Entries.

**Why it exists.** Central catalog aggregate; comparison unit (up to four models in UI).

**Future scalability.** Millions of models globally; sharded by manufacturer alphabet in projection layer only.

---

### 8.7 LureAtlas Variant

*(Normalized name: Lure Variant → LureAtlas Variant.)*

**Purpose.** SKU-level release: size, weight, Color Pattern, factory hooks, barcodes.

**Relationships.** External Identifier Registry; Sponsored Links; variant-specific Media Attachments; optional variant-specific Knowledge Claims.

**Why it exists.** Discogs release variant; purchase and collection granularity.

**Future scalability.** Collector “want list” features reference variant ids.

---

### 8.8 Hook Configuration

**Purpose.** Factory hooking spec: sizes, count, treble/single, replacement guidance—as Knowledge Claims bundle.

**Relationships.** Attached to Model or Variant; community aftermarket hooks as separate Rigging Tip claims.

**Why it exists.** Conservation and species suitability filters.

**Future scalability.** Shared with terminal tackle modules.

---

### 8.9 Usage Assertion

**Purpose.** Community or moderator **effectiveness claim**: lure (model or variant) + species + technique + Geographic Context + Temporal Scope + optional Rig Configuration Template + effectiveness narrative (Localized Text) + contributor confidence.

**Relationships.** Community Attribution; Community Votes; may belong to Community Consensus Group; Expert Endorsement optional; spawns from Catch Report via Derivation Link; never overwrites manufacturer Knowledge Claims.

**Why it exists.** Wikipedia-style verifiable community knowledge separate from catalog spec.

**Future scalability.** Billions of assertions; public views show aggregated summaries with drill-down.

---

### 8.10 Rigging Tip

**Purpose.** Structured rigging guidance attached to Model, Variant, Usage Assertion, or Rig Configuration Template.

**Relationships.** Localized Text; Provenance Attribution; Media Attachment optional; distinct moderation path from Usage Assertion.

**Why it exists.** Approve knot advice without endorsing catch claim.

**Future scalability.** Video Rigging Tip via Media Asset type extension.

---

### 8.11 Catch Report

**Purpose.** Structured field observation: observation date, Geographic Context, Temporal Scope optional, Environmental Condition optional, species, lure variant, technique, Rig Configuration Template optional, narrative, photo evidence.

**Relationships.** Spawns Moderation Case; Derivation Link to Usage Assertion; may remain public when assertion pending.

**Why it exists.** Primary evidence capture mobile-first anglers generate.

**Future scalability.** Bulk private logbook export for contributor GDPR requests without deleting aggregated stats.

---

## 9. Community Evidence (L5)

### 9.1 Platform User

*(Normalized name: User → Platform User.)*

**Purpose.** Authenticated account: reader, contributor, moderator, administrator, expert, service account.

**Relationships.** Contributor Profile; Role Assignment; Expert Profile optional; Notification Preference; Account Sanction history; Platform User Credential Link for federated auth.

**Why it exists.** GDPR root; decades-long identity.

**Future scalability.** Service accounts for ingestion robots distinct from human users.

---

### 9.2 Role Assignment

**Purpose.** RBAC binding with scope dimensions: module, locale, geographic moderation zone.

**Relationships.** Platform User; never inferred from Reputation Score alone.

**Why it exists.** Least privilege at global scale.

**Future scalability.** Thousands of scoped moderators regionally.

---

### 9.3 Contributor Profile

**Purpose.** Public attribution identity: display name, bio, locale, unit preference, avatar.

**Relationships.** Reputation Score snapshot; Reputation Events; authorship of community entities.

**Why it exists.** Separates login email from public handle; supports anonymization.

**Future scalability.** Profile badges as Entity Association Links to achievement entities.

---

### 9.4 Reputation Event

**Purpose.** Immutable ledger entry: delta, reason code, formula version, related entity reference.

**Relationships.** Recomputes Reputation Score snapshot; dispute via Appeal Case.

**Why it exists.** Fairness disputes require event history, not opaque score.

**Future scalability.** Formula version migrations replay events.

---

### 9.5 Reputation Score

**Purpose.** Materialized snapshot derived from Reputation Events at formula version.

**Relationships.** Influences submission queue priority only; never auto-publish.

**Why it exists.** Performance at moderator queue sort time.

**Future scalability.** Periodic rebuild from events if snapshot corrupts.

---

### 9.6 Community Vote

**Purpose.** Agree/disagree/helpful signal on Usage Assertion or Catch Report.

**Relationships.** May trigger **Vote Aggregation Snapshot** recalculation; may open Moderation Case when contested threshold exceeded.

**Why it exists.** Disagreement is data; signals moderator escalation.

**Future scalability.** Vote brigade detection via anomaly cases.

---

### 9.7 Vote Aggregation Snapshot

**Purpose.** Denormalized counts and controversy score for an assertion or report at point in time.

**Relationships.** Drives sort order for “most contested” moderator dashboards.

**Why it exists.** Avoids counting millions of votes on detail page load.

**Future scalability.** Regenerated by async workers on vote insert.

---

### 9.8 Community Consensus Group

**Purpose.** Moderator-closed set of independent Usage Assertions deemed mutually reinforcing for same (lure, species, technique, geographic hash).

**Relationships.** Links member assertions; displays consensus badge; does not delete dissenting assertions.

**Why it exists.** Charter consensus flag as first-class graph, not boolean column.

**Future scalability.** Consensus may expire requiring revalidation.

---

### 9.9 Entity Bookmark

**Purpose.** User saves catalog entity (model, species article, technique article) for return visits.

**Relationships.** Platform User; target canonical id.

**Why it exists.** North star retention metric support.

**Future scalability.** Collections and shared lists (public tackle boxes).

---

### 9.10 Saved Comparison Set

**Purpose.** Named set of up to four LureAtlas Model ids with optional share slug.

**Relationships.** Platform User; shareable URL in Discovery Projection layer.

**Why it exists.** Persist comparison journeys anglers share in forums.

**Future scalability.** Embed widgets for partners referencing comparison id.

---

## 10. Media & Citation (L6)

### 10.1 Media Asset

**Purpose.** Generalization of Image: photograph, diagram, video, PDF thumbnail—with derivative variants (thumb, card, detail) and processing status.

**Relationships.** Media License; Media Attachment; **Media Fingerprint** for deduplication.

**Why it exists.** One pipeline for all visual evidence decades forward.

**Future scalability.** Video transcoding profiles; 360° lure rotation videos.

---

### 10.2 Image

**Purpose.** Preserved facade type for static raster Media Asset—API compatibility and domain language.

**Relationships.** Subtype of Media Asset with `asset_kind = image`.

**Why it exists.** Angler vocabulary; charter references images explicitly.

**Future scalability.** Image-specific EXIF policy remains on Image facade.

---

### 10.3 Media Fingerprint

**Purpose.** Perceptual hash or content hash clustering duplicate uploads.

**Relationships.** Links duplicate Media Assets; moderator merge suggestions.

**Why it exists.** Manufacturer press photo reused across 40 SKUs without 40 copies in storage.

**Future scalability.** Cross-module dedup (same photo in Catch Report and Model gallery).

---

### 10.4 Media License

**Purpose.** Legal classification and attribution string for Media Asset publication.

**Relationships.** Required before publish; expiry triggers deprecation workflow.

**Why it exists.** DMCA and manufacturer press kit compliance.

**Future scalability.** Jurisdiction-specific fair use flags on license record.

---

### 10.5 Media Attachment

**Purpose.** Typed link Media Asset → host entity with role (`hero`, `gallery`, `evidence`, `logo`), sort order, locale visibility optional.

**Relationships.** Host polymorphism via entity type + canonical id pattern—not a second catalog.

**Why it exists.** Same asset, many hosts, one license.

**Future scalability.** Primary hero per locale via attachment metadata.

---

## 11. Editorial & Legal (L8)

### 11.1 Moderation Case

**Purpose.** Workflow container with **Moderation Case Kind**, priority, SLA due, assignee, status.

**Relationships.** References one primary target entity **or** bulk target list via **Moderation Case Subject Link**; resolves to Audit Log Entry; may attach AI Suggestions as required evidence.

**Why it exists.** Single queue infrastructure; typed workflows below.

**Future scalability.** Millions of cases; archival by kind and age.

---

### 11.2 Moderation Case Kind

**Purpose.** Enum registry: `community_submission`, `ingestion_batch`, `correction_request`, `merge_review`, `translation_review`, `abuse_report`, `dispute`, `appeal`, `ai_promotion_review`.

**Relationships.** Determines required checklist before case closure.

**Why it exists.** Prevents spec corrections buried under catch photos.

**Future scalability.** New kinds without new queue systems.

---

### 11.3 Moderation Case Subject Link

**Purpose.** Join: Moderation Case ↔ entity id (many subjects per case for bulk merge).

**Relationships.** Enables one case → 500 ingestion rows or two lure merge candidates.

**Why it exists.** Fixes single-target limitation in prior model.

**Future scalability.** Subject link ordering for batch approve UI.

---

### 11.4 Correction Request

**Purpose.** Dedicated submission targeting existing catalog Knowledge Claims with proposed values and evidence Source Document.

**Relationships.** Opens Moderation Case Kind `correction_request`; distinct SLA from Catch Report.

**Why it exists.** “Manufacturer weight wrong” is not a Usage Assertion.

**Future scalability.** Manufacturer portal submits correction requests API-first.

---

### 11.5 Content Abuse Report

**Purpose.** User flags spam, stolen media, harassment, off-topic assertion.

**Relationships.** Opens Moderation Case Kind `abuse_report`; distinct from Community Vote.

**Why it exists.** Voting is not reporting.

**Future scalability.** Trusted reporter weighting via Reputation Event.

---

### 11.6 Dispute Case

**Purpose.** Legal or manufacturer dispute: IP, trademark, factual libel, conservation challenge.

**Relationships.** Links Source Document evidence; may freeze Verification Events on disputed claims pending resolution.

**Why it exists.** Charter manufacturer IP risk requires case object.

**Future scalability.** External counsel export package from case id.

---

### 11.7 Appeal

**Purpose.** Contributor challenges rejected submission, Account Sanction, or dispute outcome.

**Relationships.** Opens Moderation Case Kind `appeal`; references original case id.

**Why it exists.** Due process for reputation and sanctions.

**Future scalability.** Time-bound appeal windows per policy version.

---

### 11.8 Account Sanction

**Purpose.** Time-bounded or permanent restriction: submit cooldown, shadow hide, ban, AI quota zero.

**Relationships.** Platform User; Audit Log Entry; may result from Abuse Report or Dispute Case.

**Why it exists.** Rate limits alone insufficient at scale.

**Future scalability.** Graduated sanctions automation with human review gates.

---

### 11.9 Notification Preference

**Purpose.** Per-user channel toggles: moderation outcome, appeal, marketing, contributor digest.

**Relationships.** Platform User; GDPR consent timestamps.

**Why it exists.** Lawful communication at global scale.

**Future scalability.** Locale-specific default policies.

---

### 11.10 Translation Job

**Purpose.** Async human or AI-assisted translation of Localized Text field set between locales.

**Relationships.** Produces AI Suggestion drafts; closes via Verification Event on target Localized Text.

**Why it exists.** Decouples bilingual publishing from single atomic publish button.

**Future scalability.** TMS vendor external id on job row.

---

### 11.11 Localized Text

**Purpose.** Locale-tagged text body for any translatable field with own lifecycle and Provenance Attribution.

**Relationships.** Parent entity reference + field path descriptor; Translation Job source/target.

**Why it exists.** Wikipedia-style interlanguage links per field, not per page only.

**Future scalability.** Hundreds of locales without parent table column explosion.

---

## 12. Expert Trust (L2/L5 extension)

### 12.1 Expert Profile

**Purpose.** Credentialed verifier extension of Platform User: biography, credentials, expertise scopes.

**Relationships.** Conflict of Interest Declaration records; issues Expert Endorsement.

**Why it exists.** Highest trust tier above moderator.

**Future scalability.** Expiring credentials trigger reverification Moderation Case.

---

### 12.2 Conflict of Interest Declaration

**Purpose.** Documented COI: manufacturer employment, retailer sponsorship, guide service in region.

**Relationships.** Expert Profile and Organization Role Assignment; blocks Expert Endorsement in conflict scope automatically.

**Why it exists.** Manufacturer rep cannot invisibly endorse own lures.

**Future scalability.** Public COI page per expert.

---

### 12.3 Expert Endorsement

**Purpose.** Expert validates Usage Assertion, Knowledge Claim set, or SpeciesCompass conservation claim with Field Scope Descriptor and expiration.

**Relationships.** Verification Event may accompany endorsement; Audit Log on revoke.

**Why it exists.** IMDb-style credentialed credit line on knowledge records.

**Future scalability.** Endorsement insurance and liability tracking external reference optional.

---

## 13. Knowledge Synthesis — AI (L7)

### 13.1 Prompt Template

**Purpose.** Versioned prompt definition: purpose code, template body hash, model constraints, registered tools list.

**Relationships.** Referenced by AI Suggestion and AI Assistant Session; git-versioned in deployment pipeline.

**Why it exists.** Reproducible AI behavior audits across years.

**Future scalability.** A/B prompt experiments with explicit template id on each suggestion.

---

### 13.2 AI Suggestion

**Purpose.** Machine-generated provisional output with `suggestion_kind`: tag, duplicate_match, translation, summary, synonym, merge_candidate, moderation_note.

**Relationships.** Links Prompt Template, Retrieval Corpus Snapshot, target entity; **requires** Moderation Case for promotion paths affecting canonical data.

**Why it exists.** AI never silently writes catalog or assertions.

**Future scalability.** Retention tiers by kind; bulk purge of low-value tag suggestions.

---

### 13.3 Retrieval Corpus Snapshot

**Purpose.** Immutable version marker of indexed published content available to RAG with module partition map.

**Relationships.** Sub-snapshots per module (`lure_atlas`, `technique_library`); AI Assistant Session and AI Suggestion reference snapshot id used.

**Why it exists.** “Answers accurate as of DATE partition X” transparency.

**Future scalability.** Incremental snapshot generation; no full rebuild per community vote.

---

### 13.4 AI Assistant Session

**Purpose.** Bounded conversation: token budget, participant User optional, corpus snapshot id, module scope filter.

**Relationships.** Contains AI Response Segments; logs cost metering events.

**Why it exists.** Abuse control and billing at billion-query scale.

**Future scalability.** Session anonymization after retention window.

---

### 13.5 AI Response Segment

**Purpose.** One model turn within session: prompt hash, completion text, retrieval confidence score optional.

**Relationships.** Parent AI Assistant Session; decomposed into Retrieval Citation Links.

**Why it exists.** Sentence-level citation granularity.

**Future scalability.** User feedback thumbs on segment without affecting canonical data.

---

### 13.6 Retrieval Citation Link

**Purpose.** Maps AI Response Segment text span → source canonical entity id + field path or Knowledge Claim id + corpus snapshot offset.

**Relationships.** Public UI renders citations from this graph only—not hallucinated footnotes.

**Why it exists.** Charter transparency and regulatory defense.

**Future scalability.** Citation quality score feeds model routing decisions.

---

## 14. Ethical Commerce (L10)

### 14.1 Disclosure Policy Version

**Purpose.** Legal-approved sponsor disclosure copy and UI treatment rules with jurisdiction tags and effective dates.

**Relationships.** Sponsored Link and Sponsored Placement Slot reference required policy version id at render time.

**Why it exists.** EU/UK/TR compliance auditable years later.

**Future scalability.** Policy violation auto-freezes affected links.

---

### 14.2 Sponsored Placement Slot

**Purpose.** Named UI region where sponsored content may appear—never interleaved in organic ranking lists.

**Relationships.** Ordered Sponsored Link campaigns per slot.

**Why it exists.** Editorial firewall auditable in data.

**Future scalability.** Module-specific slot registry.

---

### 14.3 Sponsored Link

**Purpose.** Outbound URL for LureAtlas Variant at Retailer with sponsorship flag, active window, policy version, editorial firewall attestation.

**Relationships.** Sponsored Click Ledger Entry; Audit Log on activation; **never** Entity Association Link to ranking score.

**Why it exists.** Monetization without catalog corruption.

**Future scalability.** Millions of affiliate links globally geo-targeted.

---

### 14.4 Sponsored Click Ledger Entry

**Purpose.** Append-only click/impression record: link id, timestamp, anonymized viewer context hash, referrer page type.

**Relationships.** Finance reporting; fraud detection—not Google Analytics alone.

**Why it exists.** Sponsor audits and click fraud disputes.

**Future scalability.** Immutable ledger export to data warehouse.

---

## 15. Ingestion & Operations (L8/L9)

### 15.1 Ingestion Batch

**Purpose.** Idempotent import run: source reference, batch key, row statistics, error manifest.

**Relationships.** Creates draft catalog entities; opens Moderation Case Kind `ingestion_batch`; links Source Documents.

**Why it exists.** Research → production promotion with audit.

**Future scalability.** Nightly manufacturer feed sync globally.

---

### 15.2 External Product Identifier

**Purpose.** Preserved alias entity name for External Identifier Registry Entry in API facades—same underlying registry, dual naming for backward compatibility with engineering docs.

**Relationships.** Belongs to LureAtlas Variant.

**Why it exists.** Engineering principles reference this term explicitly.

**Future scalability.** See External Identifier Registry Entry §5.6.

---

### 15.3 Domain Event Outbox

**Purpose.** Transactional outbox row: event type (`lure_atlas.model.published`), payload reference, publish status, retry count.

**Relationships.** Feeds Search Index Sync Record and Retrieval Corpus Snapshot incremental builders.

**Why it exists.** Prevents triple-store drift (database, search, RAG).

**Future scalability.** Billions of events; partitioned by month.

---

### 15.4 Search Index Registry

**Purpose.** Logical index definition: module, schema version, analyzer config per locale (including Turkish collation rules).

**Relationships.** Many Search Index Sync Records.

**Why it exists.** Explicit Turkish search correctness as data governance.

**Future scalability.** Blue/green index rebuild with registry pointer swap.

---

### 15.5 Search Index Sync Record

**Purpose.** Tracks projection lag: entity id, index name, last synced version, error state.

**Relationships.** Produced from Domain Event Outbox; visible in ops dashboards.

**Why it exists.** Detects “published but not searchable” failures in minutes, not weeks.

**Future scalability.** Reconciliation sweeps compare registry to source claims.

---

### 15.6 Module Registry Entry

**Purpose.** Registered module: code, API prefix, owning team, search namespace, default Publish Requirement Rule set.

**Relationships.** All L4 entities declare module code.

**Why it exists.** SpeciesCompass addition without LureAtlas migration.

**Future scalability.** Dozens of gear and knowledge modules over decade.

---

## 16. Future Module Extensions (L4)

### 16.1 SpeciesCompass Extension

**Purpose.** Rich species profile aggregate keyed 1:1 to Fish Species canonical id when published: habitat, migration, seasonality, conservation narrative.

**Relationships.** Fish Species always exists first as taxonomy; extension optional until curated; TechniqueLibrary and LureAtlas link to species id regardless.

**Why it exists.** Wikipedia-style species article without polluting lure catalog schema.

**Future scalability.** Multiple editorial editions versioned like Localized Text.

---

### 16.2 TechniqueLibrary Article

**Purpose.** Long-form technique knowledge keyed to Fishing Technique id with Knowledge Claims, Media Attachments, Rig Configuration Templates, exemplar LureAtlas Models.

**Relationships.** Supplies RAG corpus partition `technique_library` independent of LureAtlas ship order.

**Why it exists.** Technique snippets for AI are **module content**, not ad hoc strings in lure code.

**Future scalability.** Video-centric technique courses as article sections.

---

### 16.3 LocationInsights Aggregate

**Purpose.** Precomputed anonymized statistics: geographic hash × species × month × lure form factor → success rate bands—no precise contributor tracks public.

**Relationships.** Sourced from published Catch Reports; references Water Body and Region ids.

**Why it exists.** Heatmap module without spot GPS exposure.

**Future scalability.** Differential privacy noise injection policy as versioned metadata.

---

## 17. Entity Relationship Graph (Narrative)

**Organization** holds **Manufacturer** and/or **Retailer** roles. **Manufacturer** publishes **Product Lines** containing **LureAtlas Models** with **Variants**, **Knowledge Claims**, **Hook Configurations**, and **Entity Association Links** (`manufacturer_marketing_target`, `moderator_curated_target`) to **Fish Species** and **Fishing Techniques**. **Lure Form Factor**, **Lure Action**, **Buoyancy Class**, **Diving Depth Profile**, and **Speed Range Applications** classify models as structured claims.

**Contributor Profile** authors **Catch Reports** and **Usage Assertions** with **Geographic Context**, **Temporal Scope**, optional **Rig Configuration Template**, and **Community Attribution**. Assertions link to species via `community_effectiveness` associations. **Catch Reports** derive **Usage Assertions** under derivation law §4.4. **Community Votes** update **Vote Aggregation Snapshots**; contested items escalate to **Moderation Cases** of appropriate **Kind**. **Community Consensus Groups** bind reinforcing assertions without erasing dissent.

**Provenance Attribution** records origin; **Verification Events** and **Expert Endorsements** record confirmation. **Source Documents** anchor manufacturer and legal claims. **Correction Requests**, **Disputes**, and **Appeals** resolve through typed **Moderation Cases**. **Entity Merge Records** and **Slug Redirect Entries** preserve identity through catalog evolution.

**Media Assets** attach via **Media Attachments** with **Media Licenses** and **Fingerprints**. **AI Suggestions** flow through moderation; **AI Assistant Sessions** produce **Response Segments** with **Retrieval Citation Links** to **Knowledge Claims** and catalog entities indexed in **Retrieval Corpus Snapshots**.

**Sponsored Links** render only in **Sponsored Placement Slots** under **Disclosure Policy Version**; clicks append to **Sponsored Click Ledger**. **Domain Event Outbox** drives **Search Index Sync Records** so discovery projections never diverge silently from truth.

---

## 18. Discovery Projection (L9 — Derived, Governed)

These are **not** source-of-truth entities but **governed projections** with registry metadata:

| Projection | Source entities | Governance |
|------------|-----------------|------------|
| Search document | Published models, assertions summaries, taxonomy synonyms | Search Index Registry |
| RAG chunk | Published Knowledge Claims + Localized Text + articles | Retrieval Corpus Snapshot |
| Comparison view | Saved Comparison Set or ephemeral query | Saved Comparison Set entity when persisted |
| Public effectiveness summary | Usage Assertions + Vote Aggregation + Consensus Group | Regenerated on assertion publish |

---

## 19. Explicit Exclusions (Still Non-Entities)

The platform remains **not** a commerce authority:

- Shopping cart, payment capture, inventory, dynamic pricing, tax computation.
- Automated legal determination of bag limits (Conservation Rule Reference links out only).
- Unmoderated wiki namespace without Moderation Case.
- Canonical Knowledge Claims originating solely from AI without Verification Event promotion chain.

---

## 20. Summary Entity Catalog

| Domain | Entities |
|--------|----------|
| **L1 Knowledge Graph** | Platform Canonical Identifier, Slug Registry Entry, Slug Redirect Entry, Entity Merge Record, Entity Association Link, External Identifier Registry Entry |
| **L2 Trust** | Knowledge Claim, Provenance Attribution, Verification Event, Source Document, Field Scope Descriptor, Publish Requirement Rule, Data Quality Assessment, Content Lifecycle State, Audit Log Entry |
| **L3 Reference** | Platform Taxonomy Domain, Platform Taxonomy Term, Taxonomy Synonym, Taxonomy Version, Taxonomy Term Deprecation Map, Fish Species, Fishing Technique, Lure Action, Lure Form Factor, Buoyancy Class, Diving Depth Profile, Color Pattern, Speed Range, Speed Range Application, Retrieve Speed Band, Trolling Speed, Leader Setup, Main Line Setup, Rig Configuration Template, Country, Region, Climate Band, Water Body Type, Water Body, Location, Geographic Context, Season Window, Month Window, Temporal Scope, Environmental Condition, Conservation Rule Reference |
| **L4 LureAtlas** | Organization, Organization Role Assignment, Manufacturer, Retailer, Product Line, LureAtlas Model, LureAtlas Variant, Hook Configuration, Usage Assertion, Rigging Tip, Catch Report |
| **L5 Community** | Platform User, Role Assignment, Contributor Profile, Reputation Event, Reputation Score, Community Vote, Vote Aggregation Snapshot, Community Consensus Group, Entity Bookmark, Saved Comparison Set |
| **L6 Media** | Media Asset, Image, Media Fingerprint, Media License, Media Attachment |
| **L7 AI** | Prompt Template, AI Suggestion, Retrieval Corpus Snapshot, AI Assistant Session, AI Response Segment, Retrieval Citation Link |
| **L8 Editorial** | Moderation Case, Moderation Case Kind, Moderation Case Subject Link, Correction Request, Content Abuse Report, Dispute Case, Appeal, Account Sanction, Notification Preference, Translation Job, Localized Text, Ingestion Batch, External Product Identifier |
| **L9 Operations** | Domain Event Outbox, Search Index Registry, Search Index Sync Record, Module Registry Entry |
| **L10 Commerce** | Disclosure Policy Version, Sponsored Placement Slot, Sponsored Link, Sponsored Click Ledger Entry |
| **Expert** | Expert Profile, Conflict of Interest Declaration, Expert Endorsement |
| **Future modules** | SpeciesCompass Extension, TechniqueLibrary Article, LocationInsights Aggregate |

**Entity count:** 95+ distinct business entities (expanded from prior catalog; none removed—normalized and extended).

---

## 21. Physical Schema Handoff (Non-Binding)

Physical mapping remains for `database/migrations/` after ADR ratification. This document mandates:

- Platform schema owns L0–L3, L7–L10 kernel entities.
- `lure_atlas` schema owns L4 lure aggregates.
- Cross-schema references use Platform Canonical Identifier only—never duplicate taxonomy rows.
- Knowledge Claim table is the atomic unit of provenance and verification joins.
- All merge and slug operations write Entity Merge Record + Slug Redirect Entry in one transaction with Domain Event Outbox row.

Glossary alignment: `011_GLOSSARY.md` must reflect normalized names (Provenance Attribution, LureAtlas Model, Verification Event, Leader Setup) as canonical terms.

---

Balık Oltamda Guide at global scale is a **knowledge graph with catalog discipline**—not a comment section with product pages. This model preserves that distinction for ten years: every lure spec, every field report, every AI sentence traceable to claims, attributions, verifications, and citations that survive module growth, taxonomy drift, and organizational change.

---

*End of document.*
