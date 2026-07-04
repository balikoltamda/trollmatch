# Lure Domain Model

**Document:** LURE_DOMAIN_MODEL  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Module:** LureAtlas  
**Document type:** Business domain model (not a database schema)  
**Status:** Sprint 3 — manufacturer fishing attributes persisted (body type, buoyancy, depth, trolling speed, coating, technique links)  
**Authority:** Subordinate to `001_PROJECT_CHARTER.md`, `002_ENGINEERING_PRINCIPLES.md`, and `007_DATABASE_VISION.md`  
**Primary locales:** Turkish (`tr`), English (`en`)

---

## 1. Purpose and Scope

This document defines the **complete business model of a Lure** as understood by Balık Oltamda Guide. It describes every piece of knowledge, metadata, evidence, and projection that legitimately belongs to a lure record—what it means, who may change it, where it originates, and how it is validated.

This is **not** a physical database schema, API contract, or UI specification. It is the domain vocabulary and property catalog that downstream schema design, API aggregation, moderation workflows, and Lure Detail Page composition must honor.

A lure in this platform is never a flat product row. It is a **knowledge aggregate** composed of:

1. **Catalog identity** — manufacturer lineage, model name, lifecycle, and URL identity.
2. **Manufacturer truth** — factory specifications expressed as **Knowledge Claims** with **Manufacturer Attribution**.
3. **Variant granularity** — SKU-level size, weight, color, and commercial identifiers.
4. **Taxonomic classification** — platform-controlled vocabularies for form, action, buoyancy, depth, and color.
5. **Field evidence** — community **Usage Assertions**, **Catch Reports**, and **Rigging Tips** with **Community Attribution**.
6. **Trust overlay** — **Verification Events**, expert endorsements, consensus groups, and completeness gates.
7. **Derived intelligence** — aggregated statistics and privacy-safe geographic projections—not raw contributor tracks.
8. **Media and narrative** — images, videos, localized descriptions, expert notes, and AI drafts (never canonical until promoted).
9. **Audit lineage** — immutable change history and merge records.

The canonical catalog anchor is the **LureAtlas Model**. **LureAtlas Variants** hang beneath it. Everything else attaches to the model, a variant, or a community evidence entity linked to either.

**Sprint 3 implementation note:** Manufacturer body type, buoyancy, diving depth range, trolling speed range, coating type, and technique compatibility links are persisted on `lure_models` and `lure_techniques` from the canonical import DTO. Topwater models must not carry diving depth; buoyancy classes are validated against depth claims at import time.

---

## 2. Domain Aggregate Structure

```
Lure (user-facing aggregate)
├── Identity & Lifecycle
├── Manufacturer Context
├── Product Line Context
├── LureAtlas Model (canonical design)
│   ├── Classification & Physical Design Claims
│   ├── Performance & Behavior Claims
│   ├── Rig & Retrieve Recommendations (manufacturer)
│   ├── Target & Compatibility Links (typed)
│   ├── Hook Configuration (factory)
│   ├── Media Attachments (model-level)
│   ├── Localized Narratives
│   └── Trust & Verification Metadata
├── LureAtlas Variants[] (SKU releases)
│   ├── Size, Weight, Color
│   ├── External Identifiers
│   ├── Variant-specific Claims & Media
│   └── Sponsored Retail Links (optional, isolated)
├── Community Evidence[]
│   ├── Usage Assertions
│   ├── Catch Reports
│   └── Rigging Tips
├── Expert Layer
│   └── Expert Notes / Endorsements
├── AI Layer (non-canonical until promoted)
│   └── AI Notes & Suggestions
├── Derived Projections
│   ├── Community Statistics
│   ├── Seasonal & Environmental Patterns
│   └── GPS Catch Density (aggregated)
└── Change History & Audit Trail
```

**Composition rule:** Manufacturer specifications and community effectiveness claims **never share the same field slot**. Factory depth and field-observed depth are distinct properties with distinct provenance. Ranking and discovery treat **community effectiveness** separately from **manufacturer marketing targets**.

---

## 3. Role and Source Vocabulary

### 3.1 Editable By (roles)

| Role | Domain meaning |
|------|----------------|
| **System** | Automated derivation, aggregation, slug generation, completeness scoring—no editorial judgment. |
| **Content Editor** | Staff curator importing manufacturer catalogs, press kits, and source documents. |
| **Manufacturer Authorized Rep** | Verified organization representative; may submit factory corrections within scoped org ids. |
| **Contributor** | Signed-in community member submitting field reports, corrections, photos, or usage notes. |
| **Moderator** | Approves, rejects, merges, verifies, and promotes content to canonical fields. |
| **Expert Verifier** | Credentialed endorser for scoped claims (Phase 3+ program); subject to COI disclosure. |
| **Administrator** | Lifecycle overrides, merge resolution, policy exceptions—logged in audit trail. |
| **AI Orchestrator** | Creates drafts and suggestions only; cannot publish canonical catalog fields without moderator promotion. |
| **Read-only (public)** | Anonymous and authenticated readers; no edit rights on canonical fields. |

### 3.2 Source (provenance classes)

| Source | Domain meaning |
|--------|----------------|
| **Manufacturer** | Factory catalog, packaging, press kit, authorized spec sheet, or verified rep submission. |
| **Community** | Contributor field observation, correction request, or vote—always attributed to a user. |
| **Moderator** | Platform editorial decision, merge resolution, or verification act. |
| **Expert** | Formal expert endorsement with scope and expiration. |
| **AI-Assisted Draft** | Machine-generated text or tag suggestion pending human review—never displayed as verified fact. |
| **Derived** | Computed projection from approved evidence (statistics, heat maps, consensus summaries). |
| **Platform** | System-enforced metadata (identifiers, slugs, lifecycle timestamps, publish gates). |

---

## 4. Property Catalog

Each property below is listed with **Purpose**, **Data Type**, **Editable By**, **Source**, and **Validation Rules**. Properties marked *(variant-scoped)* apply per **LureAtlas Variant**; all others default to **LureAtlas Model** scope unless noted.

---

### 4.1 Identity and Lifecycle

#### Canonical Identifier

| Attribute | Value |
|-----------|-------|
| **Purpose** | Immutable public identity surviving merges, renames, and slug changes across decades. |
| **Data Type** | Platform Canonical Identifier (opaque UUID; never reused). |
| **Editable By** | System (assigned at creation). |
| **Source** | Platform. |
| **Validation Rules** | Required once entity exists; must not change after assignment; merge creates redirect map, not id reuse. |

#### URL Slug

| Attribute | Value |
|-----------|-------|
| **Purpose** | Locale-aware, human-readable address for SEO and sharing (`tr`, `en`). |
| **Data Type** | Slug Registry Entry (locale code + slug string + entity reference). |
| **Editable By** | Content Editor (propose); Moderator (publish); System (redirect on merge). |
| **Source** | Platform (derived from localized name) or Moderator (manual override). |
| **Validation Rules** | Unique per locale among published lures; lowercase ASCII with hyphens; retired slugs must redirect; minimum length 3 characters. |

#### Model Name

| Attribute | Value |
|-----------|-------|
| **Purpose** | Primary human-readable product designation (e.g., “Laser Pro 190 DD”). |
| **Data Type** | Localized Text (required `tr` and `en` for published records). |
| **Editable By** | Content Editor; Manufacturer Authorized Rep (proposal); Moderator (verify). |
| **Source** | Manufacturer (primary); Moderator (normalization). |
| **Validation Rules** | Required before `published`; 2–120 characters per locale; must not duplicate active model under same manufacturer without merge review. |

#### Model Code / Designation

| Attribute | Value |
|-----------|-------|
| **Purpose** | Manufacturer internal model code distinct from marketing name (e.g., “LP190DD”). |
| **Data Type** | Single-line string (locale-invariant). |
| **Editable By** | Content Editor; Manufacturer Authorized Rep. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional; if present, unique per manufacturer; alphanumeric plus `-`, `/`, `.`; max 64 characters. |

#### Product Line

| Attribute | Value |
|-----------|-------|
| **Purpose** | Groups related models under a manufacturer series for browse hierarchy and comparison context. |
| **Data Type** | Reference to Product Line entity + optional Localized Text description. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Required before `published`; must belong to same manufacturer as model; deprecated product lines propagate deprecation banner to child models. |

#### Content Lifecycle State

| Attribute | Value |
|-----------|-------|
| **Purpose** | Governs public visibility and moderation workflow (`draft`, `pending_review`, `published`, `deprecated`, `rejected`). |
| **Data Type** | Enumeration (Content Lifecycle State). |
| **Editable By** | Moderator; Administrator; System (initial `draft`). |
| **Source** | Platform (workflow). |
| **Validation Rules** | Transitions must follow state machine; `published` blocked until publish requirement rules pass; `deprecated` requires successor link or discontinuation reason. |

#### Introduction Year / Discontinuation Year

| Attribute | Value |
|-----------|-------|
| **Purpose** | Temporal catalog context for collectors and replacement recommendations. |
| **Data Type** | Year (integer, optional each). |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer; Community correction via Moderator verification. |
| **Validation Rules** | Introduction year ≥ 1900 and ≤ current year + 1; discontinuation year ≥ introduction year if both set. |

#### Successor Model Reference

| Attribute | Value |
|-----------|-------|
| **Purpose** | Points anglers to replacement SKU when product is discontinued. |
| **Data Type** | Reference to LureAtlas Model (optional). |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer; Moderator curation. |
| **Validation Rules** | Required when lifecycle is `deprecated` unless explicit “no replacement” flag set; must not create circular reference chains. |

---

### 4.2 Basic Information

#### Short Description

| Attribute | Value |
|-----------|-------|
| **Purpose** | Concise localized summary for search results, cards, and meta descriptions. |
| **Data Type** | Localized Text (plain; max ~300 characters per locale). |
| **Editable By** | Content Editor; Moderator; AI Orchestrator (draft → Moderator). |
| **Source** | Manufacturer; Moderator; AI-Assisted Draft (promoted only after review). |
| **Validation Rules** | At least one published locale before `published`; no unsourced superlatives (“best lure ever”) in canonical text. |

#### Long Description

| Attribute | Value |
|-----------|-------|
| **Purpose** | Full editorial product narrative—design intent, heritage, intended fisheries. |
| **Data Type** | Localized Text (rich text subset: paragraphs, lists, links; no scripts). |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer (licensed copy); Moderator (original synthesis from Source Document). |
| **Validation Rules** | Provenance required per locale; rejected locales fall back per Localized Text publication rule; minimum 50 characters if present. |

#### Design Notes

| Attribute | Value |
|-----------|-------|
| **Purpose** | Structured bullet facts about design choices (wire-through construction, rattles, jointed segments). |
| **Data Type** | List of Localized Text items with optional Knowledge Claim linkage. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Each bullet must carry Manufacturer Attribution or Verification Event before public display. |

#### Data Completeness Score

| Attribute | Value |
|-----------|-------|
| **Purpose** | Internal indicator of field coverage against publish requirement profile—not a quality rating of fishing performance. |
| **Data Type** | Derived percentage + missing-field list. |
| **Editable By** | System. |
| **Source** | Derived. |
| **Validation Rules** | Recalculated on every canonical field change; never user-editable; not used for discovery ranking. |

---

### 4.3 Manufacturer

#### Manufacturer Organization

| Attribute | Value |
|-----------|-------|
| **Purpose** | Legal and brand identity owning the lure catalog record. |
| **Data Type** | Reference to Manufacturer facade (Organization with `manufacturer` role). |
| **Editable By** | Content Editor; Administrator. |
| **Source** | Manufacturer; Platform registry. |
| **Validation Rules** | Required before `published`; manufacturer must have active `manufacturer` role assignment. |

#### Manufacturer Display Name

| Attribute | Value |
|-----------|-------|
| **Purpose** | Public brand name shown in breadcrumbs and identity strip. |
| **Data Type** | Localized Text. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer; Platform normalization. |
| **Validation Rules** | Required; 1–80 characters per published locale. |

#### Manufacturer Country of Origin

| Attribute | Value |
|-----------|-------|
| **Purpose** | Geographic context for brand discovery and filtering. |
| **Data Type** | Reference to Country taxonomy term. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional at model level; must be valid ISO-linked country term if present. |

#### Manufacturer Logo

| Attribute | Value |
|-----------|-------|
| **Purpose** | Visual brand recognition on lure detail and manufacturer browse pages. |
| **Data Type** | Media Asset reference (image). |
| **Editable By** | Content Editor; Manufacturer Authorized Rep (proposal). |
| **Source** | Manufacturer press kit. |
| **Validation Rules** | License class required (`manufacturer_press` or equivalent); minimum 128×128 px; alt text required. |

#### Spec Data License Note

| Attribute | Value |
|-----------|-------|
| **Purpose** | Transparent statement of how factory specifications may be used and when they were sourced. |
| **Data Type** | Localized Text + optional Source Document reference. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer; Platform legal template. |
| **Validation Rules** | Required when any Manufacturer Attribution claim is published; must link to at least one Source Document or ingestion batch id. |

#### Manufacturer Conflict of Interest Flag

| Attribute | Value |
|-----------|-------|
| **Purpose** | Discloses when manufacturer organization also acts as retailer/sponsor on the platform. |
| **Data Type** | Boolean + disclosure text (computed from Organization Role Assignment). |
| **Editable By** | System; Administrator (override with audit). |
| **Source** | Platform. |
| **Validation Rules** | Automatically true when org holds both `manufacturer` and `retailer` roles; public banner mandatory. |

---

### 4.4 Variants

#### Variant Collection

| Attribute | Value |
|-----------|-------|
| **Purpose** | Enumerates all SKU-level releases of the model (size/color combinations). |
| **Data Type** | Ordered collection of LureAtlas Variant entities. |
| **Editable By** | Content Editor (add); Moderator (publish/deprecate). |
| **Source** | Manufacturer. |
| **Validation Rules** | Minimum one variant required before model `published`; each variant must have distinct primary color or size/weight tuple; deprecated variants remain addressable. |

#### Variant Identifier *(variant-scoped)*

| Attribute | Value |
|-----------|-------|
| **Purpose** | Stable SKU-level identity for catch reports, purchase links, and barcodes. |
| **Data Type** | Platform Canonical Identifier. |
| **Editable By** | System. |
| **Source** | Platform. |
| **Validation Rules** | Immutable; survives color rename; merge at variant level requires explicit merge record. |

#### Variant Display Label *(variant-scoped)*

| Attribute | Value |
|-----------|-------|
| **Purpose** | Human-readable variant name in selector UI (e.g., “190 mm · H70 Redhead”). |
| **Data Type** | Localized Text. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer; System (composed from size + color if absent). |
| **Validation Rules** | Required per variant; unique among siblings under same model. |

#### Variant Lifecycle State *(variant-scoped)*

| Attribute | Value |
|-----------|-------|
| **Purpose** | Independent deprecation for individual SKUs while model remains active. |
| **Data Type** | Enumeration (same lifecycle enum as model). |
| **Editable By** | Moderator; Content Editor. |
| **Source** | Manufacturer. |
| **Validation Rules** | Cannot be `published` if parent model is not at least `published` or `deprecated`. |

---

### 4.5 Sizes

#### Overall Length *(variant-scoped primary; model default optional)*

| Attribute | Value |
|-----------|-------|
| **Purpose** | Primary size dimension for comparison and filter matching. |
| **Data Type** | Knowledge Claim → Measure (millimeters canonical; display converts to inches). |
| **Editable By** | Content Editor; Manufacturer Authorized Rep; Moderator (verify). |
| **Source** | Manufacturer. |
| **Validation Rules** | Required per variant before variant publish; value > 0 and ≤ 2000 mm; tolerance note optional for soft plastics. |

#### Length Descriptor (non-numeric)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Captures manufacturer size classes when exact mm unavailable (e.g., “#3 minnow”). |
| **Data Type** | Localized Text or Taxonomy Term reference. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Mutually exclusive with numeric length as primary filter key—if numeric present, descriptor is supplementary only. |

#### Bill / Lip Length

| Attribute | Value |
|-----------|-------|
| **Purpose** | Distinguishes shallow vs deep divers within same body mold. |
| **Data Type** | Knowledge Claim → Measure (mm) or bill classification taxonomy term. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional; required for `deep_diving_crankbait` form factor publish profiles when depth claim exists. |

---

### 4.6 Weights

#### Casting Weight *(variant-scoped)*

| Attribute | Value |
|-----------|-------|
| **Purpose** | Mass for casting suitability, rod rating, and comparison tables. |
| **Data Type** | Knowledge Claim → Measure (grams canonical; ounces display). |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Required per variant; value > 0 and ≤ 5000 g; single canonical gram value stored. |

#### Trolling Weight Class

| Attribute | Value |
|-----------|-------|
| **Purpose** | Declares suitability for high-speed trolling setups where mass affects tracking. |
| **Data Type** | Knowledge Claim → optional Measure or weight class taxonomy term. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional; if present alongside casting weight, difference > 15% requires explanatory note. |

#### Field-Weighed Average Mass

| Attribute | Value |
|-----------|-------|
| **Purpose** | Community-reported average when factory weight omits rigging additions (hooks, leaders). |
| **Data Type** | Derived statistic from Catch Reports + optional Usage Assertion claims. |
| **Editable By** | System. |
| **Source** | Derived from Community. |
| **Validation Rules** | Minimum sample size ≥ 5 independent contributors before public display; labeled “field average—not factory spec.” |

---

### 4.7 Colors

#### Primary Color Pattern *(variant-scoped)*

| Attribute | Value |
|-----------|-------|
| **Purpose** | Normalized colorway identity for variant selection and popularity statistics. |
| **Data Type** | Reference to Color Pattern taxonomy term + optional manufacturer color code string. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Required per variant; must map to platform Color Pattern term or new term proposal in `pending_review`. |

#### Manufacturer Color Code *(variant-scoped)*

| Attribute | Value |
|-----------|-------|
| **Purpose** | Preserves factory SKU color codes (e.g., “H70”) for ingestion matching and retailer links. |
| **Data Type** | String (locale-invariant) + optional Taxonomy Synonym link. |
| **Editable By** | Content Editor; Manufacturer Authorized Rep. |
| **Source** | Manufacturer. |
| **Validation Rules** | Unique per model when combined with size; max 32 characters. |

#### Color Description

| Attribute | Value |
|-----------|-------|
| **Purpose** | Human-readable color narrative (matte finish, holographic foil, UV reactive). |
| **Data Type** | Localized Text. |
| **Editable By** | Content Editor; Contributor (proposal); Moderator. |
| **Source** | Manufacturer; Community (field observation). |
| **Validation Rules** | Community-sourced descriptions require photo evidence attachment before publish. |

#### Color Popularity Rank

| Attribute | Value |
|-----------|-------|
| **Purpose** | Shows relative catch/report frequency by color within geographic scope. |
| **Data Type** | Derived ranking per variant + Geographic Context hash. |
| **Editable By** | System. |
| **Source** | Derived from Community Catch Reports. |
| **Validation Rules** | Minimum aggregate sample threshold; privacy: no single-user dominance display; “insufficient data” when below threshold. |

---

### 4.8 Classification and Form

#### Lure Form Factor

| Attribute | Value |
|-----------|-------|
| **Purpose** | Primary gear taxonomy for discovery filters (crankbait, jerkbait, soft plastic, spinnerbait, jig, fly, etc.). |
| **Data Type** | Reference to Lure Form Factor taxonomy term (required). |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer; Moderator normalization. |
| **Validation Rules** | Required before `published`; drives publish requirement rule set; one primary form factor per model. |

#### Secondary Form Tags

| Attribute | Value |
|-----------|-------|
| **Purpose** | Captures hybrid designs (e.g., lipless crankbait) without breaking primary filter. |
| **Data Type** | List of Lure Form Factor taxonomy references (0..n). |
| **Editable By** | Moderator; Content Editor. |
| **Source** | Manufacturer; Moderator. |
| **Validation Rules** | Maximum 2 secondary tags; must not contradict primary without moderator note. |

---

### 4.9 Swimming Action

#### Primary Swimming Action

| Attribute | Value |
|-----------|-------|
| **Purpose** | Normalized action vocabulary for comparison (rolling, tight wobble, wide wobble, S-action, flutter, etc.). |
| **Data Type** | Reference to Lure Action taxonomy term (1 required; up to 3 total). |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | At least one action required for `published` on hard baits; terms must exist in platform taxonomy. |

#### Action Description (narrative)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Explains action behavior in angler language beyond taxonomy label. |
| **Data Type** | Localized Text with Manufacturer Attribution. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional; if present, must not contradict selected taxonomy without moderator flag. |

#### Field-Observed Action Summary

| Attribute | Value |
|-----------|-------|
| **Purpose** | Aggregated community description of how lure actually swims under reported conditions. |
| **Data Type** | Derived narrative + link to supporting Usage Assertions. |
| **Editable By** | System (aggregate); Moderator (curated summary override). |
| **Source** | Derived from Community; Moderator optional synthesis. |
| **Validation Rules** | Minimum 3 independent assertions; clearly labeled separate from factory action block. |

---

### 4.10 Diving Depth

#### Factory Diving Depth Profile

| Attribute | Value |
|-----------|-------|
| **Purpose** | Manufacturer claim of running depth range under stated retrieve conditions. |
| **Data Type** | Diving Depth Profile structure: min depth (m), max depth (m), reference speed, lip type, optional dive curve reference. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Min ≤ max; depths 0–100 m; speed reference required when depth > 0; not applicable for surface/topwater form factors without moderator exception flag. |

#### Maximum Depth Rating

| Attribute | Value |
|-----------|-------|
| **Purpose** | Single-number shorthand for UI cards and quick filters. |
| **Data Type** | Knowledge Claim → Measure (meters) derived from profile max or explicit claim. |
| **Editable By** | System (from profile) or Content Editor. |
| **Source** | Manufacturer. |
| **Validation Rules** | Must not exceed profile max; display with tilde (~) when manufacturer uses approximate notation. |

#### Field-Observed Depth Range

| Attribute | Value |
|-----------|-------|
| **Purpose** | Community-reported running depths under specified techniques and rigging. |
| **Data Type** | Derived range (min/max meters) + assertion count + confidence band. |
| **Editable By** | System. |
| **Source** | Derived from Community Usage Assertions and Catch Reports. |
| **Validation Rules** | Geographic and technique context required in drill-down; never overwrites factory profile; minimum 3 assertions for range display. |

#### Sink Rate

| Attribute | Value |
|-----------|-------|
| **Purpose** | Describes sinking speed for jigs, metals, and soft plastics without bib. |
| **Data Type** | Knowledge Claim → Measure (seconds per meter) or sink rate class taxonomy. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer; Community (field). |
| **Validation Rules** | Required for sinking form factors without bill; factory and field values stored separately. |

---

### 4.11 Buoyancy

#### Buoyancy Class

| Attribute | Value |
|-----------|-------|
| **Purpose** | Floating, suspending, sinking classification for search filters. |
| **Data Type** | Reference to Buoyancy Class taxonomy term. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Required for hard baits and lipless categories; must align with form factor publish profile. |

#### Buoyancy Notes

| Attribute | Value |
|-----------|-------|
| **Purpose** | Captures nuance (slow-rising suspend, neutral at rest). |
| **Data Type** | Localized Text with Manufacturer Attribution. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional; max 500 characters per locale. |

---

### 4.12 Material

#### Body Material

| Attribute | Value |
|-----------|-------|
| **Purpose** | Identifies construction material affecting durability, buoyancy, and toothy species suitability. |
| **Data Type** | List of material taxonomy terms or controlled strings (ABS, polyurethane, wood, metal, tin, etc.). |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | At least one material required before `published`; free-text materials must map to taxonomy within 90 days or flag incomplete. |

#### Wire-Through Construction Flag

| Attribute | Value |
|-----------|-------|
| **Purpose** | Indicates integrated wire frame for toothy species—safety and durability signal. |
| **Data Type** | Boolean Knowledge Claim. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional; if true, recommend pairing with hook configuration detail. |

#### Finish Type

| Attribute | Value |
|-----------|-------|
| **Purpose** | Surface treatment affecting flash and durability (matte, holographic, chrome, UV coat). |
| **Data Type** | List of finish taxonomy terms or Localized Text. |
| **Editable By** | Content Editor; Contributor (with photo); Moderator. |
| **Source** | Manufacturer; Community. |
| **Validation Rules** | Community claims require image evidence. |

---

### 4.13 Internal Weight System

#### Internal Weight Type

| Attribute | Value |
|-----------|-------|
| **Purpose** | Describes movable weight systems (MagTrak, weight transfer, belly weight) affecting cast and action. |
| **Data Type** | Taxonomy term or structured enum (`fixed`, `transfer`, `adjustable`, `rattle_canister`). |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional; if adjustable, link to adjustment documentation in Design Notes. |

#### Weight Transfer Description

| Attribute | Value |
|-----------|-------|
| **Purpose** | Explains how internal mass shifts during retrieve or cast. |
| **Data Type** | Localized Text + optional diagram Media Attachment. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Required when Internal Weight Type is `transfer` or `adjustable`. |

---

### 4.14 Sound

#### Acoustic Profile

| Attribute | Value |
|-----------|-------|
| **Purpose** | Documents rattles, knock, or silent running—relevant for pressured fisheries. |
| **Data Type** | Enum (`silent`, `single_rattle`, `multi_rattle`, `knock`, `drum`) + optional Localized Text detail. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional globally; required for form factors where manufacturer marketing emphasizes sound. |

#### Field Sound Observation

| Attribute | Value |
|-----------|-------|
| **Purpose** | Community confirmation or contradiction of factory acoustic claims. |
| **Data Type** | Aggregated enum distribution from Usage Assertions. |
| **Editable By** | System. |
| **Source** | Derived from Community. |
| **Validation Rules** | Minimum 5 assertions; display disagreement when factory and field modes diverge. |

---

### 4.15 Hook Configuration

#### Factory Hook Configuration

| Attribute | Value |
|-----------|-------|
| **Purpose** | Documents stock hooking: count, position, hook type, size, brand if specified. |
| **Data Type** | Hook Configuration entity (structured: hook role, count, size notation, single/treble/double, manufacturer brand optional). |
| **Editable By** | Content Editor; Manufacturer Authorized Rep; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Required before `published` for hard baits; hook sizes must use standard notation (#, /0); treble count ≥ 0. |

#### Replacement Hook Guidance

| Attribute | Value |
|-----------|-------|
| **Purpose** | Manufacturer or moderator guidance for upgrading hooks without voiding action. |
| **Data Type** | Localized Text + optional Hook Configuration reference. |
| **Editable By** | Content Editor; Moderator; Expert Verifier. |
| **Source** | Manufacturer; Expert; Moderator. |
| **Validation Rules** | Expert-sourced guidance requires Expert Endorsement scope covering terminal tackle. |

#### Aftermarket Hook Setups

| Attribute | Value |
|-----------|-------|
| **Purpose** | Community rigging configurations differing from factory hooks. |
| **Data Type** | Collection of Rigging Tip entities linked to Hook Configuration or Rig Configuration Template. |
| **Editable By** | Contributor (submit); Moderator (approve). |
| **Source** | Community. |
| **Validation Rules** | Each tip requires contributor attribution; photo optional but recommended; distinct moderation path from Usage Assertion. |

#### Hook Configuration Summary (display)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Single-line factory hook string for comparison tables. |
| **Data Type** | Derived string from Factory Hook Configuration. |
| **Editable By** | System. |
| **Source** | Derived from Manufacturer. |
| **Validation Rules** | Auto-generated; regenerated on hook configuration change. |

---

### 4.16 Retrieval Techniques

#### Recommended Retrieve Methods (manufacturer)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Factory guidance on how to work the lure (steady retrieve, stop-go, jerk cadence). |
| **Data Type** | List of Fishing Technique taxonomy references + optional Localized Text per technique. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Each linked technique must be compatible with form factor per platform compatibility matrix or carry moderator override flag. |

#### Retrieve Cadence Notes

| Attribute | Value |
|-----------|-------|
| **Purpose** | Narrative cadence instructions (pause length, rod tip action). |
| **Data Type** | Localized Text with Manufacturer Attribution. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional; max 1000 characters per locale. |

#### Community Retrieve Tips

| Attribute | Value |
|-----------|-------|
| **Purpose** | Field-proven retrieve variations tied to species and conditions. |
| **Data Type** | Collection of Usage Assertions and Rigging Tips filtered by technique context. |
| **Editable By** | Contributor; Moderator. |
| **Source** | Community. |
| **Validation Rules** | Must reference at least one Fishing Technique; geographic context recommended. |

---

### 4.17 Compatible Techniques

#### Manufacturer-Stated Compatible Techniques

| Attribute | Value |
|-----------|-------|
| **Purpose** | Declares intended fishing methods from factory materials. |
| **Data Type** | Entity Association Links (`association_kind`: manufacturer technique recommendation) → Fishing Technique references. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | At least one technique link recommended before `published`; links are non-exclusive. |

#### Moderator-Curated Compatible Techniques

| Attribute | Value |
|-----------|-------|
| **Purpose** | Editorial approval of techniques validated by platform curators beyond packaging claims. |
| **Data Type** | Entity Association Links (`association_kind`: moderator_curated_technique). |
| **Editable By** | Moderator; Content Editor. |
| **Source** | Moderator. |
| **Validation Rules** | Verification Event recommended when contradicting manufacturer list. |

#### Community-Effective Techniques

| Attribute | Value |
|-----------|-------|
| **Purpose** | Techniques with published Usage Assertions demonstrating effectiveness. |
| **Data Type** | Derived list from Usage Assertions grouped by technique with assertion counts. |
| **Editable By** | System. |
| **Source** | Derived from Community. |
| **Validation Rules** | Minimum 2 independent contributors per technique before inclusion in “community proven” list. |

---

### 4.18 Compatible Waters

#### Manufacturer Water Type Compatibility

| Attribute | Value |
|-----------|-------|
| **Purpose** | Factory guidance on saltwater, freshwater, brackish suitability. |
| **Data Type** | List of Water Body Type taxonomy references + optional Localized Text. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | At least one water body type recommended; corrosion-sensitive materials should align with saltwater claims. |

#### Community Water Compatibility

| Attribute | Value |
|-----------|-------|
| **Purpose** | Field-supported water types where anglers report success. |
| **Data Type** | Aggregated Geographic Context + Water Body Type from Usage Assertions and Catch Reports. |
| **Editable By** | System. |
| **Source** | Derived from Community. |
| **Validation Rules** | Aggregated only; minimum sample thresholds per water type. |

#### Geographic Effectiveness Regions

| Attribute | Value |
|-----------|-------|
| **Purpose** | Shows where lure performs well without exposing private spots. |
| **Data Type** | List of Geographic Context summaries (Region or Climate Band primary classifier). |
| **Editable By** | System (aggregate); Moderator (curated highlight list). |
| **Source** | Derived from Community; Moderator curation. |
| **Validation Rules** | Primary classifier rule from Geographic Context composition law—exactly one primary; Location precision capped at moderator-approved level. |

---

### 4.19 Recommended Species

#### Manufacturer Marketing Target Species

| Attribute | Value |
|-----------|-------|
| **Purpose** | Species printed on packaging—may be aspirational marketing. |
| **Data Type** | Entity Association Links (`association_kind`: `manufacturer_marketing_target`) → Fish Species references. |
| **Editable By** | Content Editor; Manufacturer Authorized Rep. |
| **Source** | Manufacturer. |
| **Validation Rules** | Not used as primary discovery ranking until moderator promotion; each link requires species taxonomy id. |

#### Moderator-Curated Target Species

| Attribute | Value |
|-----------|-------|
| **Purpose** | Editorially approved primary species list for discovery filters. |
| **Data Type** | Entity Association Links (`association_kind`: `moderator_curated_target`) → Fish Species references. |
| **Editable By** | Moderator; Content Editor. |
| **Source** | Moderator. |
| **Validation Rules** | At least one curated species recommended before `published` completeness badge; Verification Event on disputed promotions. |

#### Community Effectiveness by Species

| Attribute | Value |
|-----------|-------|
| **Purpose** | Species linked through Usage Assertions with effectiveness evidence. |
| **Data Type** | Aggregated per-species assertion counts, confidence, and consensus group membership. |
| **Editable By** | System. |
| **Source** | Derived from Community Usage Assertions. |
| **Validation Rules** | Species must reference platform Fish Species taxonomy; effectiveness scores never mix with marketing targets in UI sort order. |

---

### 4.20 Seasonal Performance

#### Manufacturer Seasonal Guidance

| Attribute | Value |
|-----------|-------|
| **Purpose** | Factory notes on seasonal applicability (spawn, migration windows). |
| **Data Type** | Localized Text + optional Temporal Scope references (Season Window terms). |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional; season terms must exist in platform Season Window taxonomy. |

#### Community Seasonal Effectiveness

| Attribute | Value |
|-----------|-------|
| **Purpose** | When anglers report lure working best—by month or named season. |
| **Data Type** | Derived histogram: Month Window or Season Window → assertion count / success band. |
| **Editable By** | System. |
| **Source** | Derived from Community assertions with Temporal Scope. |
| **Validation Rules** | Hemisphere metadata on season terms required; “year-round unknown-season” displayed when temporal data absent—not assumed global peak. |

#### Peak Season Indicator

| Attribute | Value |
|-----------|-------|
| **Purpose** | Single highlighted season/month for quick UI badge. |
| **Data Type** | Derived Season Window or Month Window + confidence score. |
| **Editable By** | System; Moderator (override with audit). |
| **Source** | Derived from Community; Moderator optional. |
| **Validation Rules** | Override requires Verification Event; minimum 10 temporally-scoped assertions for automated peak. |

---

### 4.21 Weather Conditions

#### Reported Weather Correlation

| Attribute | Value |
|-----------|-------|
| **Purpose** | Shows environmental conditions when lure produced catches (pressure, cloud cover, rain). |
| **Data Type** | Aggregated Environmental Condition taxonomy distribution linked to Catch Reports and Usage Assertions. |
| **Editable By** | System. |
| **Source** | Derived from Community. |
| **Validation Rules** | Minimum 5 reports per condition bucket; no precise weather station ids public. |

#### Manufacturer Weather Guidance

| Attribute | Value |
|-----------|-------|
| **Purpose** | Factory recommendation for overcast, bright sun, etc., when provided. |
| **Data Type** | Localized Text + optional Environmental Condition references. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional; must not state guaranteed outcomes. |

---

### 4.22 Wave Conditions

#### Wave State Correlation

| Attribute | Value |
|-----------|-------|
| **Purpose** | Links lure performance to sea state or lake chop for boat and shore anglers. |
| **Data Type** | Aggregated wave/wind condition bands from Environmental Condition taxonomy on field evidence. |
| **Editable By** | System. |
| **Source** | Derived from Community Catch Reports. |
| **Validation Rules** | Uses standardized Beaufort or lake chop bands; minimum sample size per band; shore vs boat context tag required when available. |

#### Manufacturer Wave / Wind Guidance

| Attribute | Value |
|-----------|-------|
| **Purpose** | Factory notes on optimal sea state for trolling or casting this lure. |
| **Data Type** | Localized Text + optional condition band references. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Optional; disclaimer that conditions vary by geography. |

---

### 4.23 Recommended Leader

#### Manufacturer Leader Recommendation

| Attribute | Value |
|-----------|-------|
| **Purpose** | Factory guidance on leader material, length, and breaking strain. |
| **Data Type** | Reference to Leader Setup entity or embedded Knowledge Claim (material, length range, breaking strain). |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Breaking strain stored in canonical kg; length in meters; fluoro/mono/wire enum required if specified. |

#### Community Leader Setups

| Attribute | Value |
|-----------|-------|
| **Purpose** | Field-proven leader configurations paired with species and technique context. |
| **Data Type** | Collection of Leader Setup references on Usage Assertions and Rig Configuration Templates. |
| **Editable By** | Contributor; Moderator. |
| **Source** | Community. |
| **Validation Rules** | Each setup linked to at least one approved Usage Assertion or Catch Report; wire leaders for toothy species flagged for safety review. |

#### Recommended Leader Summary (display)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Comparison-table shorthand merging top manufacturer and top community setup with labels. |
| **Data Type** | Derived display object (factory block + community block). |
| **Editable By** | System. |
| **Source** | Derived. |
| **Validation Rules** | Factory and community values never merged into single unlabeled string. |

---

### 4.24 Recommended Line

#### Manufacturer Main Line Recommendation

| Attribute | Value |
|-----------|-------|
| **Purpose** | Factory guidance on main line class affecting dive depth and trolling performance. |
| **Data Type** | Reference to Main Line Setup entity (material, diameter, breaking strain). |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Diameter in mm canonical; breaking strain in kg; optional link to Speed Range Application for trolling context. |

#### Community Main Line Setups

| Attribute | Value |
|-----------|-------|
| **Purpose** | Angler-reported line choices correlated with success assertions. |
| **Data Type** | Main Line Setup references on Usage Assertions / Catch Reports. |
| **Editable By** | Contributor; Moderator. |
| **Source** | Community. |
| **Validation Rules** | Optional on submissions; aggregated display requires minimum 3 matching setups. |

---

### 4.25 Recommended Speed

#### Factory Retrieve Speed Range

| Attribute | Value |
|-----------|-------|
| **Purpose** | Manufacturer optimal retrieve speed for casting and general retrieve techniques. |
| **Data Type** | Speed Range (knots canonical) via Speed Range Application profile `retrieve_speed_band`. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Min ≤ max knots; 0.5–30 knot bounds; technique application link required. |

#### Factory Trolling Speed Range

| Attribute | Value |
|-----------|-------|
| **Purpose** | Manufacturer optimal trolling speed including downrigger/planer context when applicable. |
| **Data Type** | Speed Range via Speed Range Application profile `trolling_speed`. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Required for trolling-marketed models; may reference Rig Configuration Template. |

#### Community Speed Observations

| Attribute | Value |
|-----------|-------|
| **Purpose** | Speed ranges where anglers report effective performance. |
| **Data Type** | Derived Speed Range per technique from Usage Assertions. |
| **Editable By** | System. |
| **Source** | Derived from Community. |
| **Validation Rules** | Labeled field observation; minimum 3 speed-reporting assertions; outliers trimmed at 95th percentile for display. |

---

### 4.26 GPS Catch Density

#### Aggregated Catch Heat Map

| Attribute | Value |
|-----------|-------|
| **Purpose** | Privacy-safe geographic visualization of catch report density—not individual waypoint disclosure. |
| **Data Type** | Derived grid or hex bins (resolution capped) + species filter + time window metadata. |
| **Editable By** | System. |
| **Source** | Derived from approved Catch Reports with Location within approved precision level. |
| **Validation Rules** | Minimum k-anonymity threshold per cell (default ≥ 5 reports); no cell shown below threshold; maximum precision = climate/region band unless moderator elevates public precision policy; contributor may opt out of aggregation. |

#### Top Countries / Regions by Catch Volume

| Attribute | Value |
|-----------|-------|
| **Purpose** | Ranked geographic summary for international anglers researching travel patterns. |
| **Data Type** | Ordered list of Country or Region + report count + optional species breakdown. |
| **Editable By** | System. |
| **Source** | Derived from Community Catch Reports. |
| **Validation Rules** | Counts only; no GPS coordinates; suppressed when total reports < 10 globally. |

---

### 4.27 Community Statistics

#### Usage Assertion Count

| Attribute | Value |
|-----------|-------|
| **Purpose** | Volume indicator of community effectiveness claims. |
| **Data Type** | Non-negative integer (published assertions only). |
| **Editable By** | System. |
| **Source** | Derived. |
| **Validation Rules** | Excludes rejected and pending assertions; recalculated on moderation state change. |

#### Verified Catch Report Count

| Attribute | Value |
|-----------|-------|
| **Purpose** | Evidence weight indicator distinct from unstructured comments. |
| **Data Type** | Non-negative integer. |
| **Editable By** | System. |
| **Source** | Derived. |
| **Validation Rules** | Only moderator-approved Catch Reports with minimum required fields. |

#### Community Consensus Groups

| Attribute | Value |
|-----------|-------|
| **Purpose** | Moderator-closed sets of mutually reinforcing assertions for same lure/species/technique/geographic hash. |
| **Data Type** | List of Community Consensus Group references with member assertion ids. |
| **Editable By** | Moderator. |
| **Source** | Moderator (from Community evidence). |
| **Validation Rules** | Minimum 3 independent contributors; moderator cannot include own assertions without secondary review. |

#### Effectiveness Score Band

| Attribute | Value |
|-----------|-------|
| **Purpose** | Normalized community effectiveness indicator for discovery sorting—not a guarantee of catch. |
| **Data Type** | Derived enum band (`low`, `moderate`, `high`, `insufficient_data`) per context hash. |
| **Editable By** | System. |
| **Source** | Derived from Community assertions and votes. |
| **Validation Rules** | Never influenced by sponsored links; algorithm version logged; `insufficient_data` when below sample threshold. |

#### Contributor Vote Summary

| Attribute | Value |
|-----------|-------|
| **Purpose** | Lightweight signal on individual Usage Assertions (helpful / not helpful). |
| **Data Type** | Vote tallies per assertion id. |
| **Editable By** | Contributor (vote); System (tally). |
| **Source** | Community. |
| **Validation Rules** | One vote per user per assertion; vote manipulation triggers sanction review. |

---

### 4.28 Expert Notes

#### Expert Endorsement

| Attribute | Value |
|-----------|-------|
| **Purpose** | Formal scoped approval by credentialed expert with visible badge and expiration. |
| **Data Type** | Expert Endorsement entity (expert profile, scope, expiration date, COI declaration, endorsed claim references). |
| **Editable By** | Expert Verifier; Moderator (revoke). |
| **Source** | Expert. |
| **Validation Rules** | Expiration required; COI flag blocks endorsement on manufacturer-owned claims when expert is manufacturer-affiliated; displays on trust ladder above community consensus. |

#### Expert Narrative Note

| Attribute | Value |
|-----------|-------|
| **Purpose** | Free-form expert commentary on rigging, technique pairing, or conservation considerations. |
| **Data Type** | Localized Text + Expert Endorsement linkage. |
| **Editable By** | Expert Verifier; Moderator. |
| **Source** | Expert. |
| **Validation Rules** | Max 2000 characters per locale; must not contradict published conservation rules without legal review flag. |

#### Moderator Verified Badge (interim expert tier)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Highest trust tier until Expert Verifier program launches—moderator Verification Event on spec bundle or assertion set. |
| **Data Type** | Verification Event reference + timestamp + verifier id. |
| **Editable By** | Moderator. |
| **Source** | Moderator. |
| **Validation Rules** | Distinct from Manufacturer Attribution; records verifier identity and scope. |

---

### 4.29 AI Notes

#### AI-Generated Summary Draft

| Attribute | Value |
|-----------|-------|
| **Purpose** | Moderator copilot synthesis of structured fields for faster editorial review—not public canonical text. |
| **Data Type** | Localized Text draft + AI Suggestion entity reference (model version, corpus snapshot id). |
| **Editable By** | AI Orchestrator (create); Moderator (promote or discard). |
| **Source** | AI-Assisted Draft. |
| **Validation Rules** | Never public without Verification Event; must cite retrieval sources in moderator view; prohibited for unsourced numeric specs. |

#### AI Tag Suggestions

| Attribute | Value |
|-----------|-------|
| **Purpose** | Proposed taxonomy tags (species, technique, action) from duplicate detection or corpus similarity. |
| **Data Type** | List of suggested taxonomy term ids + confidence score. |
| **Editable By** | AI Orchestrator; Moderator (accept/reject each). |
| **Source** | AI-Assisted Draft. |
| **Validation Rules** | Confidence below threshold hidden from moderator bulk accept; species suggestions require biologist review queue when confidence < 0.85. |

#### Public AI Insights Block

| Attribute | Value |
|-----------|-------|
| **Purpose** | Optional user-facing synthesis when enabled by feature flag—always citation-linked to published corpus. |
| **Data Type** | Localized Text + inline Retrieval Citation Links. |
| **Editable By** | Moderator (publish AI block); AI Orchestrator (regenerate draft). |
| **Source** | AI-Assisted Draft (promoted). |
| **Validation Rules** | Charter transparency: labeled “AI-assisted”; no generative numeric specs; corpus snapshot date visible; disabled by default in MVP if citations incomplete. |

---

### 4.30 Verification Status

#### Overall Verification Status

| Attribute | Value |
|-----------|-------|
| **Purpose** | Single glance trust state for lure detail trust bar. |
| **Data Type** | Derived enum (`unverified`, `partially_verified`, `manufacturer_verified`, `moderator_verified`, `expert_endorsed`). |
| **Editable By** | System (from Verification Events). |
| **Source** | Derived from Manufacturer + Moderator + Expert verification layers. |
| **Validation Rules** | Precedence follows trust ladder in `007_DATABASE_VISION.md` §4.1; recomputed on any Verification Event change. |

#### Per-Claim Verification State

| Attribute | Value |
|-----------|-------|
| **Purpose** | Field-level confirmation status on each Knowledge Claim row. |
| **Data Type** | Verification Event reference (0..n) + latest timestamp per claim path. |
| **Editable By** | Moderator; Manufacturer Authorized Rep (scoped); Expert Verifier (scoped). |
| **Source** | Moderator; Expert; Manufacturer rep. |
| **Validation Rules** | Verification Event immutable; revocation creates new superseding event, not deletion. |

#### Provenance Attribution (per field)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Answers “where did this value come from?” distinct from verification. |
| **Data Type** | Provenance Attribution record (source class, source document id, ingestion batch, contributor id optional). |
| **Editable By** | System (on ingest); Moderator (correct attribution errors). |
| **Source** | Manufacturer; Community; Moderator; AI-Assisted Draft. |
| **Validation Rules** | Required on every published Knowledge Claim; AI drafts retain AI attribution until promoted. |

#### Last Verified Timestamp

| Attribute | Value |
|-----------|-------|
| **Purpose** | Freshness signal for factory spec bundle. |
| **Data Type** | ISO 8601 datetime (latest Verification Event on manufacturer claims). |
| **Editable By** | System. |
| **Source** | Derived from Verification Events. |
| **Validation Rules** | Display “stale” warning when > 24 months without reverification on actively sold models. |

#### Publish Requirement Compliance

| Attribute | Value |
|-----------|-------|
| **Purpose** | Gates transition to `published` lifecycle. |
| **Data Type** | Boolean checklist against Publish Requirement Rule set for lure form factor. |
| **Editable By** | System. |
| **Source** | Platform. |
| **Validation Rules** | Minimum: manufacturer, product line, model name, one variant, form factor, manufacturer spec source, core physical claims per form profile. |

---

### 4.31 Media

#### Media Attachment Collection

| Attribute | Value |
|-----------|-------|
| **Purpose** | All visual assets linked to model or variant for gallery and evidence. |
| **Data Type** | Ordered list of Media Attachment entities (role, sort index, variant scope optional). |
| **Editable By** | Content Editor; Contributor (submit); Moderator (approve, reorder). |
| **Source** | Manufacturer; Community. |
| **Validation Rules** | At least one manufacturer or moderator-approved image recommended before `published`; each attachment requires license class and alt text before public display. |

#### Hero Image

| Attribute | Value |
|-----------|-------|
| **Purpose** | Primary visual for cards, Open Graph, and gallery default. |
| **Data Type** | Media Attachment reference (image role `hero`). |
| **Editable By** | Moderator; Content Editor. |
| **Source** | Manufacturer (preferred); Community (fallback). |
| **Validation Rules** | Minimum 800 px longest edge; variant mismatch warning when hero role variant id ≠ selected variant. |

---

### 4.32 Images

#### Manufacturer Product Images

| Attribute | Value |
|-----------|-------|
| **Purpose** | Factory photography for accurate color and profile representation. |
| **Data Type** | Media Asset (image) + Source Document link + variant scope optional. |
| **Editable By** | Content Editor; Manufacturer Authorized Rep. |
| **Source** | Manufacturer. |
| **Validation Rules** | License class `manufacturer_press` or documented license; no watermark from unauthorized retailers. |

#### Community Field Images

| Attribute | Value |
|-----------|-------|
| **Purpose** | Real-world photos showing lure in hand, in fish mouth, or rigged on boat. |
| **Data Type** | Media Asset linked to Catch Report, Usage Assertion, or Rigging Tip. |
| **Editable By** | Contributor; Moderator. |
| **Source** | Community. |
| **Validation Rules** | Contributor must attest ownership or license; EXIF GPS stripped on upload unless contributor opts in to precision policy; moderation required before canonical gallery promotion. |

#### Rigging Diagram Images

| Attribute | Value |
|-----------|-------|
| **Purpose** | Illustrates knot placement, split ring upgrades, trailer hook configs. |
| **Data Type** | Media Asset (image role `rigging_diagram`). |
| **Editable By** | Content Editor; Contributor; Moderator. |
| **Source** | Manufacturer; Community. |
| **Validation Rules** | Alt text must describe rigging steps for accessibility. |

#### Depth / Action Diagram Images

| Attribute | Value |
|-----------|-------|
| **Purpose** | Manufacturer depth curve or action sequence stills. |
| **Data Type** | Media Asset (image role `technical_diagram`). |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | Must align with published Diving Depth Profile or action claims or carry “illustrative only” label. |

---

### 4.33 Videos

#### Manufacturer Product Video

| Attribute | Value |
|-----------|-------|
| **Purpose** | Official action footage in water tank or controlled environment. |
| **Data Type** | Media Asset (video) + optional external embed URL + duration. |
| **Editable By** | Content Editor; Moderator. |
| **Source** | Manufacturer. |
| **Validation Rules** | License required; max file size per platform media policy; poster frame required. |

#### Community Action Video

| Attribute | Value |
|-----------|-------|
| **Purpose** | Field footage showing swim action or fish capture context. |
| **Data Type** | Media Asset linked to Catch Report or Usage Assertion. |
| **Editable By** | Contributor; Moderator. |
| **Source** | Community. |
| **Validation Rules** | Moderation mandatory; species identification in video title not trusted without assertion linkage. |

#### Video Transcript / Caption Track

| Attribute | Value |
|-----------|-------|
| **Purpose** | Accessibility and searchable content for video attachments. |
| **Data Type** | Localized Text (WebVTT or plain transcript). |
| **Editable By** | Content Editor; AI Orchestrator (draft); Moderator (publish). |
| **Source** | Manufacturer; AI-Assisted Draft; Moderator. |
| **Validation Rules** | At least one locale caption required when video is public; AI transcripts marked draft until reviewed. |

---

### 4.34 External Identifiers and Commerce (non-ranking)

#### External Identifier Registry *(variant-scoped)*

| Attribute | Value |
|-----------|-------|
| **Purpose** | Maps variants to UPC, EAN, manufacturer SKU, retailer SKU for ingestion and retailer matching. |
| **Data Type** | List of External Identifier Registry Entry (type, value, region scope, effective date range). |
| **Editable By** | Content Editor; System (ingestion). |
| **Source** | Manufacturer; Retailer feeds. |
| **Validation Rules** | Checksum validation for UPC/EAN; duplicate SKU across manufacturers triggers merge review not auto-merge. |

#### Sponsored Retail Links *(variant-scoped)*

| Attribute | Value |
|-----------|-------|
| **Purpose** | Optional outbound purchase URLs shown only on explicit user action. |
| **Data Type** | Sponsored Link entity (retailer, URL, sponsorship flag, active window, disclosure policy version). |
| **Editable By** | Content Editor; Administrator. |
| **Source** | Platform L10 registry. |
| **Validation Rules** | Never affects discovery ranking; requires editorial firewall attestation; inactive outside active window. |

---

### 4.35 Community Evidence Entities (linked to Lure)

These are first-class domain objects attached to the lure aggregate—not inline properties.

#### Usage Assertion

| Attribute | Value |
|-----------|-------|
| **Purpose** | Structured effectiveness claim: lure + species + technique + geographic and temporal context + optional rig + narrative. |
| **Data Type** | Usage Assertion entity with Community Attribution, confidence, lifecycle state, optional Expert Endorsement. |
| **Editable By** | Contributor (create); Moderator (approve/reject); System (derive from Catch Report). |
| **Source** | Community; Derived from Catch Report. |
| **Validation Rules** | Requires species + technique + contributor id; geographic primary classifier required; never overwrites manufacturer Knowledge Claims; conflicting assertions may coexist with visibility of disagreement. |

#### Catch Report

| Attribute | Value |
|-----------|-------|
| **Purpose** | Structured field observation with evidence (photo, date, conditions, species, variant, technique). |
| **Data Type** | Catch Report entity with optional Derivation Link to Usage Assertion. |
| **Editable By** | Contributor; Moderator. |
| **Source** | Community. |
| **Validation Rules** | Observation date required; lure variant required; location precision capped; may spawn at most one suggested Usage Assertion per deduplication hash. |

#### Rigging Tip

| Attribute | Value |
|-----------|-------|
| **Purpose** | Approved knot, hook upgrade, or rigging guidance attachable to model, variant, assertion, or rig template. |
| **Data Type** | Rigging Tip entity with Localized Text and optional Media Attachment. |
| **Editable By** | Contributor; Moderator; Content Editor. |
| **Source** | Community; Manufacturer; Expert. |
| **Validation Rules** | Separate moderation path from Usage Assertion; safety-critical wire leader advice flagged for expert review. |

---

### 4.36 Change History

#### Public Change Timeline

| Attribute | Value |
|-----------|-------|
| **Purpose** | Transparent record of meaningful catalog changes visible to curious anglers and contributors. |
| **Data Type** | Ordered list of public Change Event summaries (date, change type, affected property group, actor role, brief description). |
| **Editable By** | System (from Audit Log); Moderator (suppress sensitive entries only with Administrator approval). |
| **Source** | Platform audit pipeline. |
| **Validation Rules** | Immutable events; no PII beyond public contributor display name; includes merge and deprecation events. |

#### Audit Log Entry (full)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Complete internal forensic history for moderators and administrators. |
| **Data Type** | Audit Log Entry (entity id, field path, old value hash, new value hash, actor id, timestamp, moderation case id optional). |
| **Editable By** | System only. |
| **Source** | Platform. |
| **Validation Rules** | Append-only; retained per data retention policy; GDPR export available for contributor-linked entries. |

#### Entity Merge Record

| Attribute | Value |
|-----------|-------|
| **Purpose** | Documents duplicate lure consolidation with survivor id and field resolution map. |
| **Data Type** | Entity Merge Record reference + merged id redirect. |
| **Editable By** | Moderator; Administrator. |
| **Source** | Moderator. |
| **Validation Rules** | Requires Moderation Case; generates slug redirects; merged id never reused for new lure. |

#### Correction Request History

| Attribute | Value |
|-----------|-------|
| **Purpose** | Tracks community-submitted corrections and their resolution outcomes. |
| **Data Type** | List of Correction Request entities linked to lure fields. |
| **Editable By** | Contributor (submit); Moderator (resolve). |
| **Source** | Community. |
| **Validation Rules** | Resolution must include accept/reject reason visible to submitter; accepted corrections spawn Verification Event on affected claims. |

---

## 5. Cross-Cutting Domain Rules

### 5.1 Manufacturer vs Community Separation

No single display field may blend manufacturer specifications with community effectiveness values. UI and API aggregation layers must preserve two-column or two-block semantics for: diving depth, speed, species suitability, leader/line, and action.

### 5.2 Localization

All user-facing narrative properties use **Localized Text** with independent lifecycle per locale. Canonical numeric and taxonomy values are locale-invariant; display labels resolve through locale dictionaries.

### 5.3 Units

Store measurements in canonical metric (mm, g, m, knots). Display respects user unit preference without duplicating stored claims.

### 5.4 Knowledge Claim Pattern

Every scalar manufacturer spec (weight, length, depth, speed) is stored conceptually as a **Knowledge Claim** with:

- Field path identifier
- Typed value
- Provenance Attribution
- Optional Verification Event(s)
- Content Lifecycle State

Community observations use **Usage Assertions** and **Catch Reports**, not overwritten claims.

### 5.5 Trust Ladder Display

When properties from multiple sources conflict, public display precedence follows:

1. Expert Endorsement (unexpired, no blocking COI)
2. Verification Event (moderator or manufacturer authorized rep)
3. Community Consensus Group
4. Published community assertion
5. Manufacturer Attribution
6. AI Suggestion (moderator-only until promoted)

### 5.6 Privacy and Geography

GPS Catch Density and regional statistics never expose precise contributor coordinates below approved **Location Precision Level**. Catch reports may be public while derived assertions remain pending.

### 5.7 Commerce Firewall

Sponsored retail links and manufacturer COI flags are part of the lure aggregate for transparency but **must not** influence effectiveness scores, community statistics, or default sort order.

---

## 6. Publish Readiness Profile (Illustrative)

Minimum property set before **LureAtlas Model** reaches `published` lifecycle:

| Domain group | Required properties |
|--------------|---------------------|
| Identity | Canonical Identifier, Model Name (≥1 locale), Product Line, Manufacturer, Slug, Form Factor |
| Variants | ≥1 Variant with Length, Weight, Primary Color Pattern |
| Manufacturer truth | Spec Data License Note, Factory Hook Configuration (hard baits), Buoyancy Class (when applicable) |
| Trust | Provenance on all factory claims; Publish Requirement Compliance = true |
| Media | ≥1 approved manufacturer or moderator image recommended |

Form-factor-specific profiles (e.g., deep-diving crankbait) add mandatory Diving Depth Profile and Trolling Speed Range per **Publish Requirement Rule** sets in platform configuration.

---

## 7. Document Governance

| Action | Authority |
|--------|-----------|
| Add new lure property | Domain Architect proposal → Moderator + Tech Lead review → update this document before schema changes |
| Deprecate property | Requires migration plan for existing records and public API version note |
| Conflict with `007_DATABASE_VISION.md` | `007` wins on entity naming; this document wins on lure-facing property semantics and UX aggregation rules |

---

## 8. Related Documents

| Document | Relationship |
|----------|--------------|
| `001_PROJECT_CHARTER.md` | Product scope, trust principles, LureAtlas goals |
| `007_DATABASE_VISION.md` | Long-horizon entity names, relationship law, trust ladder |
| `003_MASTER_CONTEXT.md` | LureAtlas hierarchy and species link semantics |
| `UI_001_LURE_DETAIL.md` | Page-level composition of lure properties for frontend |
| `011_GLOSSARY.md` | Canonical terminology alignment (future update) |

---

*End of document.*
