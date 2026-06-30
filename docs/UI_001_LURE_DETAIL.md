# UI Specification: Lure Detail Page

**Document:** UI_001_LURE_DETAIL  
**Product:** Balık Oltamda Guide  
**Module:** LureAtlas  
**Page type:** LureAtlas Model detail (canonical product page)  
**Exemplar record:** Halco Laser Pro 190 DD  
**Locales:** Turkish (`tr`), English (`en`) — parity required  
**Status:** Product & frontend architecture specification (no implementation)  
**Authority:** Subordinate to `001_PROJECT_CHARTER.md`, `007_DATABASE_VISION.md`, `003_MASTER_CONTEXT.md`

---

## 1. Document Purpose

This specification defines the **complete Lure Detail Page**—the primary trust surface of LureAtlas. It describes every section that may appear on a world-class lure reference page, what each section contains, why it exists, who may edit it, and whether data originates from **Manufacturer**, **Community**, **Moderator/Platform**, **Expert**, or **AI**.

This is not wireframe HTML or component code. It is the product contract between design, frontend architecture, API aggregation, and moderation workflows.

---

## 2. Page Mission

The Lure Detail Page answers five questions in order:

1. **What is this lure?** (identity, manufacturer, variants, media)
2. **What does the factory claim?** (specifications with manufacturer provenance)
3. **What do anglers report in the field?** (community evidence, separated and attributed)
4. **Can I trust what I read?** (verification, provenance, consensus, expert badges, history)
5. **What should I do next?** (compare, filter discovery, contribute, optional find retailers)

The page is **not** a product listing with a buy button above the fold. Commerce is optional, explicit, and isolated.

---

## 3. Primary Personas & Modes

| Persona | Goal on this page |
|---------|-------------------|
| **P1 — Curious angler** | Decide if lure fits trip; compare; understand trust badges |
| **P2 — Contributor** | Submit catch report, assertion, correction, photo |
| **P3 — Moderator** | Review pending content; see moderation status overlays |
| **P4 — Content editor** | Ingestion context; source documents; merge lineage |
| **P5 — International visitor** | English/Turkish content with honest fallbacks |
| **P6 — Expert verifier** | Endorse scoped claims; visible COI |

**View modes:**

| Mode | Visibility |
|------|------------|
| **Public** | Default; only `published` aggregates and projections |
| **Contributor** | + submit CTAs, own draft submissions status |
| **Moderator** | + moderation badges, queue links, pending field indicators |
| **Administrator** | + audit IDs, merge records, feature flags |

---

## 4. Exemplar: Halco Laser Pro 190 DD

Reference copy for specification examples (illustrative, not authoritative data):

| Field | Example value |
|-------|---------------|
| Manufacturer | Halco (Halco Tackle) |
| Product line | Laser Pro series |
| Model name | Laser Pro 190 DD |
| Form factor | Deep-diving minnow / bibbed crankbait class |
| Variant | 190 mm, ~119 g, colour “H70 Redhead” |
| Factory claim | Dives to ~7 m (trolling); rolling action |
| Typical use | Offshore trolling, pelagic species |

All sections below use this lure as the narrative anchor where examples help.

---

## 5. Page Information Architecture

Vertical order reflects **trust-first** reading on mobile. Desktop uses two-column layout where noted; content order remains identical for accessibility and SEO.

```
┌─────────────────────────────────────────────────────────────┐
│ A. Global header (site)                                      │
├─────────────────────────────────────────────────────────────┤
│ B. Breadcrumb & product identity strip                         │
│ C. Trust summary bar (always visible below title)            │
├──────────────────────────┬──────────────────────────────────┤
│ D. Media gallery         │ E. Identity & variant selector     │
│                          │ F. Primary actions                 │
├──────────────────────────┴──────────────────────────────────┤
│ G. Manufacturer panel                                        │
│ H. Factory specifications (Knowledge Claims)                 │
│ I. Swimming depth & action profile                           │
│ J. Hook configuration & rigging                              │
│ K. Speed & leader recommendations (manufacturer vs field)    │
├─────────────────────────────────────────────────────────────┤
│ L. Target species (layered: curated / marketing / community)   │
│ M. Compatible techniques                                     │
│ N. Compatible waters & geography                             │
├─────────────────────────────────────────────────────────────┤
│ O. Community effectiveness overview (statistics)             │
│ P. Usage assertions feed (filterable)                         │
│ Q. Expert recommendations                                    │
│ R. Verified catch reports                                    │
├─────────────────────────────────────────────────────────────┤
│ S. Maps & regional heat (aggregated, privacy-safe)           │
│ T. Seasonality & temporal patterns                           │
│ U. Top countries & color popularity                          │
├─────────────────────────────────────────────────────────────┤
│ V. AI insights (optional module; citation-required)          │
│ W. Rigging tips                                              │
├─────────────────────────────────────────────────────────────┤
│ X. Related & similar lures                                   │
│ Y. Compare tray CTA                                          │
├─────────────────────────────────────────────────────────────┤
│ Z. Data provenance & verification deep dive                  │
│ AA. Change history (public timeline)                         │
│ AB. Contributor credits                                      │
│ AC. Find retailers (sponsored; user-initiated)               │
├─────────────────────────────────────────────────────────────┤
│ AD. Contribute & correct CTAs                                │
│ AE. Conservation & legal disclaimers                         │
│ AF. Moderation overlay (staff only)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Global Page Elements

### 6.1 Breadcrumb & Product Identity Strip (Section B)

**Why it exists.** Orients user in catalog hierarchy (Discogs-style); supports SEO internal linking; clarifies manufacturer lineage.

**Information contained.**

- Breadcrumb: Home → LureAtlas → [Manufacturer] → [Product Line] → [Model name]
- H1: localized model name — *Halco Laser Pro 190 DD*
- Subtitle: form factor label + product line — *Deep-diving minnow · Laser Pro series*
- Lifecycle banner if `deprecated`: “Discontinued — see successor” with link via Slug Redirect
- Locale toggle or respect user locale with hreflang alternates

**Who can edit.**

| Element | Editor |
|---------|--------|
| Model name (localized) | Content editor, moderator (via Verification Event) |
| Product line assignment | Content editor |
| Deprecation status | Moderator, administrator |
| Breadcrumb taxonomy | System-derived from catalog graph |

**Source.**

| Element | Primary source |
|---------|----------------|
| Names | **Manufacturer** (ingestion) + **Moderator** verification |
| Localized titles | **Manufacturer** or **Moderator**; community translations via moderated **Community** workflow |
| Hierarchy | **Platform** catalog graph |

---

### 6.2 Trust Summary Bar (Section C)

**Why it exists.** Charter requires provenance visible by default—not buried. Sets epistemic frame before specs or community claims.

**Information contained.**

- Overall catalog status: Published / Deprecated
- **Last verified** date (most recent Verification Event on factory spec bundle)
- Count badges: community assertions, verified catch reports, expert endorsements
- Data quality score indicator (internal completeness—not gamified; e.g., “Catalog complete” vs “Missing depth source”)
- Quick legend icons: Manufacturer · Community · Expert · Verified by moderator
- Link anchor: “How we source data” → provenance section Z

**Who can edit.** Not directly edited—computed from Verification Events, publish rules, aggregation jobs.

**Source.** **Platform** projection from **Manufacturer** + **Moderator** verification metadata + **Community** counts.

---

### 6.3 Primary Actions (Section F)

**Why it exists.** Supports charter journeys: compare, contribute, bookmark, share—without commerce prominence.

**Information contained.**

- **Add to compare** (max four models; persistent tray)
- **Bookmark** (authenticated)
- **Share** (canonical locale URL)
- **Contribute** (dropdown: catch report, usage note, correction, photo)
- **Find retailers** — opens Section AC drawer only on explicit tap (never auto-popup)

**Who can edit.** Action availability is **Platform** UX rules; user-generated actions create **Community** submissions.

**Source.** **Platform** chrome; no ranking impact from sponsored actions.

---

## 7. Media & Variants

### 7.1 Media Gallery (Section D)

**Why it exists.** Lure discovery is visual; anglers validate color and profile against water conditions.

**Information contained.**

- Hero image (variant-selected or model default)
- Thumbnail strip: manufacturer press, contributor photos, rigging diagrams, action sequence (future video)
- Per asset: alt text (localized), license badge (Press kit / Contributor / CC)
- Variant-linked images switch when variant selector changes
- Full-screen viewer with pinch-zoom; swipe on mobile
- “Photo does not match selected variant” warning when attachment role ≠ variant

**Who can edit.**

| Asset type | Editor |
|------------|--------|
| Manufacturer press | Content editor via ingestion |
| Contributor photo | Contributor submit → **Moderator** approve |
| Alt text | Contributor proposal → **Moderator**; editor for manufacturer |
| Hero priority | **Moderator** |

**Source.**

| Asset | Source |
|-------|--------|
| Factory photos | **Manufacturer** (Source Document linked) |
| Field photos | **Community** (Catch Report or assertion evidence) |
| AI-generated images | **Not permitted** as canonical media |

---

### 7.2 Variant Selector (Section E)

**Why it exists.** SKU-level truth (size, weight, color) drives purchase links, catch reports, and color popularity stats.

**Information contained.**

- Variant list: size (mm), weight (g), color pattern name, manufacturer SKU
- External identifier chips (UPC/EAN) on expand
- Per-variant availability note: “3 community reports for this size”
- Deprecated variant strikethrough with still-viewable media
- Unit display respects user metric/imperial preference (stored canonical metric)

**Who can edit.**

| Field | Editor |
|-------|--------|
| SKU, size, weight, color | **Content editor** ingestion; **Correction Request** → **Moderator** |
| New variant | Ingestion batch → **Moderator** |
| External IDs | **Content editor** |

**Source.** **Manufacturer** primary; **Community** corrections after verification.

---

## 8. Manufacturer & Factory Truth

### 8.1 Manufacturer Panel (Section G)

**Why it exists.** Catalog trust starts at source; links to manufacturer context and licensing.

**Information contained.**

- Manufacturer name, logo, country of origin
- Link to manufacturer’s LureAtlas browse page (all Halco models)
- Product line description (localized short)
- Data license note: “Specs sourced from Halco press materials, 2024 catalog” with Source Document link
- Optional: manufacturer authorized rep Verification Event badge
- Organization COI note if manufacturer also listed as Retailer elsewhere (firewall transparency)

**Who can edit.** **Content editor** (Organization/Manufacturer records); **Moderator** for public-facing license text.

**Source.** **Manufacturer** + **Moderator** verification of license documentation.

---

### 8.2 Factory Specifications (Section H)

**Why it exists.** Normalized comparison table—the core Discogs-style catalog record.

**Information contained.**

Structured **Knowledge Claims** table with per-row provenance chip:

| Spec | Example (Laser Pro 190 DD) | Unit display |
|------|---------------------------|--------------|
| Length | 190 | mm / in |
| Weight | 119 | g / oz |
| Form factor | Deep-diving minnow | taxonomy link |
| Buoyancy class | Floating / neutral (as applicable) | enum |
| Bill type | Large bib (DD) | text |
| Running depth (factory) | ~7 | m / ft |
| Max trolling speed (factory) | per Speed Range Application | knots |
| Material | ABS, wire-through | text |
| Hook configuration summary | 3 trebles #2/0 | link to Section J |

Each row shows:

- Value
- **Provenance Attribution** icon (manufacturer)
- **Last verified** date if Verification Event exists
- Expand: Source Document excerpt reference (not full PDF inline unless licensed)

**Who can edit.**

| Action | Editor |
|--------|--------|
| Initial claims | **Content editor** via ingestion |
| Correction | **Community** Correction Request → **Moderator** + Verification Event |
| Promote AI-normalized spec | **Moderator** only after **AI Suggestion** review |

**Source.** **Manufacturer** exclusively for factory spec rows; never mixed with community effectiveness in same row without explicit label.

---

### 8.3 Swimming Depth & Action Profile (Section I)

**Why it exists.** Anglers choose lures by depth curve and action; factory depth ≠ field depth observation.

**Information contained.**

**Factory block (Manufacturer):**

- Diving Depth Profile: min/max running depth at standard troll speed
- Lip/bill classification
- Lure Action taxonomy terms: rolling, wobble, etc.
- Optional depth diagram image (manufacturer)

**Field block (Community aggregate):**

- Histogram or range: “Community reports running depth 5–9 m under X conditions”
- Count of assertions; link to filtered assertion feed
- Clear label: “Field observations — not factory spec”

**Who can edit.**

| Block | Editor |
|-------|--------|
| Factory depth/action | **Content editor** + **Moderator** verify |
| Field aggregate | **Platform** computed from published **Community** assertions |
| Individual depth claims | **Community** via Usage Assertion |

**Source.** **Manufacturer** vs **Community** — visually separated columns or tabs; never merged into one number.

---

### 8.4 Hook Configuration (Section J)

**Why it exists.** Tooth species, regulations (single barbless), and hook-up rates depend on factory and aftermarket hooks.

**Information contained.**

- Factory: hook count, sizes, treble vs single, wire diameter if published
- Community: aftermarket hook upgrade Rigging Tips linked
- Conservation note when species region requires single barbless (link Conservation Rule Reference)

**Who can edit.** Factory: **Content editor**. Aftermarket tips: **Community** → **Moderator**.

**Source.** **Manufacturer** + **Community** (rigging tips).

---

### 8.5 Speed, Leader & Rig Configuration (Section K)

**Why it exists.** TrollMatch domain focus—trolling speed and leader setup materially affect lure performance.

**Information contained.**

**Manufacturer recommendations:**

- Speed Range Application rows labeled `trolling_speed` and `retrieve_speed_band` where published
- Recommended leader material/length if manufacturer provides

**Community rig templates:**

- Rig Configuration Template cards: leader setup, main line class, typical trolling speed knots
- Count how many assertions reference each template
- “Used in 12 field reports in Eastern Mediterranean” style stats

**Who can edit.**

| Data | Editor |
|------|--------|
| Factory speed tables | **Content editor** |
| Rig templates | **Community** create → **Moderator** publish; **Expert** may endorse |

**Source.** **Manufacturer** for printed spec; **Community** + optional **Expert** for rig templates.

---

## 9. Compatibility & Targeting

### 9.1 Target Species (Section L)

**Why it exists.** Species is the primary discovery axis; marketing targets must not pollute biological filters.

**Information contained.** Three visually distinct subsections:

| Subsection | Label | Content |
|------------|-------|---------|
| **Editor’s targets** | Moderator curated | Species chips from `moderator_curated_target` links |
| **On packaging** | Manufacturer marketing | Species from `manufacturer_marketing_target`; muted styling; disclaimer |
| **Effective in the field** | Community evidence | Ranked by assertion count + consensus groups; species from assertions |

Each species chip links to SpeciesCompass (future) and filtered discovery (“show lures for this species”).

Per-species expansion:

- Assertion count, consensus badge, expert endorsement if any
- Conservation/protected badge with disclaimer link

**Who can edit.**

| Subsection | Editor |
|------------|--------|
| Editor’s targets | **Moderator** |
| Packaging list | **Content editor** ingestion; **Moderator** verify |
| Field effectiveness | **Community** assertions; **Moderator** consensus closure |

**Source.** **Moderator**, **Manufacturer**, **Community** respectively—never one undifferentiated list.

---

### 9.2 Compatible Fishing Techniques (Section M)

**Why it exists.** Charter discovery flow: species + technique + conditions.

**Information contained.**

- Manufacturer-suggested techniques (tags)
- Techniques with published community assertions (count, confidence)
- Links to TechniqueLibrary articles (future)
- Filter CTA: “Find similar lures for [trolling] + [bluefish]”

**Who can edit.** Manufacturer tags: **Content editor**. Assertion-driven counts: **Community** + aggregation.

**Source.** **Manufacturer** + **Community** evidence.

---

### 9.3 Compatible Waters & Geography (Section N)

**Why it exists.** Prevents Mediterranean advice applied to Baltic conditions; supports water-type filtering without spot GPS.

**Information contained.**

- Water Body Type tags: offshore, inshore, estuary, etc.
- Top Regions and Climate Bands from assertion aggregates (not precise spots)
- “Rarely reported in freshwater” derived negative signal when data sparse
- Link to geographic discovery preset

**Who can edit.** Tags from assertions: **Community**. Editorial water-type suitability: **Moderator** optional curated note.

**Source.** **Community** aggregates + optional **Moderator** curation.

---

## 10. Community Evidence

### 10.1 Community Effectiveness Overview (Section O)

**Why it exists.** Summary statistics before drilling into dozens of assertions—IMDb-style “audience score” but with transparent counts, not opaque stars.

**Information contained.**

- Total published usage assertions
- Total verified catch reports
- Community Consensus Group count
- Contested assertion count (high disagree votes)
- Top combination chips: species + technique + region (e.g., “Leerfish · trolling · Aegean — 23 reports”)
- Vote aggregation controversy indicator
- Time range filter: all time / 24 months / 12 months

**Who can edit.** Computed **Platform** projection—no manual editing.

**Source.** **Community** data only; algorithm transparent (“count of independent published assertions”).

---

### 10.2 Usage Assertions Feed (Section P)

**Why it exists.** Charter: community knowledge more valuable than AI; disagreement is data.

**Information contained.**

Per assertion card:

- Contributor attribution (handle, reputation tier, date)
- Species, technique, Geographic Context (region/climate/water body—not secret GPS)
- Temporal Scope (season/month) when present
- Rig Configuration Template summary
- Effectiveness narrative (localized)
- Provenance: Community Attribution
- Verification badge if moderator verified assertion
- Expert Endorsement badge if present
- Community Vote agree/disagree counts
- “Part of consensus group” link
- Derivation link if spawned from Catch Report

Sort/filter: species, technique, region, season, verified only, expert endorsed, most recent, most agreed.

Pagination—infinite scroll avoided on mobile; cursor “load more”.

**Who can edit.**

| Action | Editor |
|--------|--------|
| New assertion | **Community** contributor |
| Approve/reject/edit | **Moderator** |
| Endorse | **Expert** (scoped) |

**Source.** **Community** primary; **Moderator** verification; **Expert** endorsement overlay.

---

### 10.3 Expert Recommendations (Section Q)

**Why it exists.** Long-term trust ladder peak; visible COI.

**Information contained.**

- Expert cards: name, credentials, expertise scope, COI declaration summary
- Endorsement scope: which claims or assertion ids endorsed
- Expiration date; expired shown strikethrough in history sub-tab
- Quote excerpt (localized) if expert provided narrative
- “Manufacturer affiliated” COI badge when applicable

**Who can edit.** **Expert** proposes; **Platform** admin invites; revocation via **Moderator**/admin Audit Log.

**Source.** **Expert** only—never AI-generated expert voice.

---

### 10.4 Verified Catch Reports (Section R)

**Why it exists.** Structured evidence with photos—stronger than anecdote alone.

**Information contained.**

- Catch report cards: date, species, variant used, technique, Environmental Condition icons
- Geographic Context at approved precision (e.g., “Mediterranean · offshore”)
- Photo thumbnail with license badge
- Link to derived Usage Assertion if exists
- “Helpful” vote count
- Moderator verified photo/species ID badge when applied

Privacy: no precise coordinates public; map section uses aggregates only.

**Who can edit.** **Community** submit; **Moderator** approve; species ID corrections via **Moderator** or **Expert**.

**Source.** **Community**; verification by **Moderator**/**Expert**.

---

## 11. Geography, Time & Analytics Views

### 11.1 Maps & Regional Heat (Section S)

**Why it exists.** Spatial pattern recognition without turning platform into secret spot leak.

**Information contained.**

- Choropleth or hex grid at **Climate Band / Region** resolution only—never default pin drops
- Toggle: assertion density vs catch report density
- Legend: “Aggregated, privacy-safe — not fishing spots”
- Empty state: “Not enough reports to show map” below k-anonymity threshold
- Optional country-level choropleth for “Top countries” consistency

**Who can edit.** Map thresholds and aggregation: **Platform** config; underlying data **Community**.

**Source.** **Community** aggregates computed by **Platform**; no **AI** invented geography.

---

### 11.2 Seasonality & Temporal Patterns (Section T)

**Why it exists.** Effectiveness is seasonal; “works in June” ≠ year-round claim.

**Information contained.**

- Month-of-year bar chart (assertions + catches normalized)
- Season Window labels overlaid (spawning run, monsoon, etc.)
- Hemisphere note on Season Window definitions
- Factory “seasonal product” note if manufacturer publishes (rare)
- Filter assertions chart by species/technique

**Who can edit.** Charts computed; Season Window taxonomy: **Platform** curators.

**Source.** **Community** temporal metadata on assertions/reports.

---

### 11.3 Top Countries & Color Popularity (Section U)

**Why it exists.** Global platform insight—where lure is used and which SKUs anglers actually fish.

**Information contained.**

**Top countries:**

- Ranked list: country flag, report count, top species in that country for this lure
- Based on Catch Reports and assertions with country in Geographic Context

**Color popularity:**

- Variant-level bar chart: reports per color pattern
- “Most fished color: H70 Redhead (34% of variant-identified reports)”
- Manufacturer catalog colors with zero reports shown greyed—“no field data yet”

**Who can edit.** Computed; no manual country ranking.

**Source.** **Community** reports; **Manufacturer** for catalog color list denominator.

---

## 12. AI, Related Content & Rigging

### 12.1 AI Insights (Section V)

**Why it exists.** Assisted discovery over **published corpus only**—charter-bound, citation-required.

**Information contained.**

- Collapsed by default; label: “AI-assisted summary — not verified advice”
- Expand: natural language answer to implicit question “What should I know about this lure?”
- Every sentence footnoted with **Retrieval Citation Link** to Knowledge Claim, assertion, or article id
- Corpus snapshot date: “Based on guide content as of [date]”
- Low confidence state: “Insufficient published data — browse assertions below”
- Feature flag off: section hidden entirely
- No AI depth/spec numbers absent from retrieved claims

**Who can edit.** **AI** generates draft display; **Platform** serves RAG; promotion to canonical specs requires **Moderator** Verification Event—not via this panel.

**Source.** **AI** synthesis over **Manufacturer** + **Community** + **Moderator** published content only.

---

### 12.2 Rigging Tips (Section W)

**Why it exists.** Short actionable guidance separate from effectiveness claims.

**Information contained.**

- Tip cards: knot, split ring, assist hook placement, line tie point
- Linked Rig Configuration Template optional
- Media diagram thumbnail
- Provenance per tip

**Who can edit.** **Community** submit; **Moderator** approve; manufacturer tips via **Content editor**.

**Source.** **Community**, **Manufacturer**, optional **Expert** review.

---

### 12.3 Related & Similar Lures (Section X)

**Why it exists.** Discovery continuation; comparison shopping without commerce.

**Information contained.**

**Related lures (catalog graph):**

- Same product line siblings
- Same manufacturer similar form factor
- Same editor curated “alternatives” list (**Moderator**)

**Similar products (computed):**

- Attribute similarity: depth band, action, length/weight class, shared curated species
- Excludes sponsored ordering—organic similarity score transparent (“Similar depth and action”)

Card: thumbnail, name, key spec, community report count, compare checkbox.

**Who can edit.** Curated related: **Moderator**. Algorithmic similar: **Platform**—no paid boost.

**Source.** **Platform** graph + **Moderator** curation; **not AI** unless similarity assist reviewed offline.

---

### 12.4 Compare Tray CTA (Section Y)

**Why it exists.** Charter journey #2—side-by-side decision support.

**Information contained.**

- Sticky bottom tray (mobile) when ≥1 lure selected
- “Compare up to 4” with Halco Laser Pro 190 DD + selected peers
- Link to comparison page with share URL

**Who can edit.** **Platform** UX; user selection ephemeral unless Saved Comparison Set saved.

**Source.** **Platform**.

---

## 13. Trust, History & Credits

### 13.1 Data Provenance & Verification Deep Dive (Section Z)

**Why it exists.** Power users and moderators need full transparency; charter G4.

**Information contained.**

- Tabbed panel:
  - **Provenance Attribution** list per Knowledge Claim
  - **Verification Events** timeline with verifier role
  - **Source Documents** bibliographic links (PDF catalog, press kit hash)
  - **AI Suggestions** that were rejected or pending (public: only “no AI content on specs” summary; moderators see detail in AF)
- Trust ladder explanation inline
- Export citation for researchers (model URL, access date)

**Who can edit.** Individual claims edited via correction workflow; panel is read-only aggregate.

**Source.** **Manufacturer**, **Moderator**, **Community**, **Expert** attributions listed explicitly—**AI** shown only if promoted with verification or labeled draft in staff view.

---

### 13.2 Change History (Section AA)

**Why it exists.** Wikipedia-style revision trust; deprecated merge lineage.

**Information contained.**

- Public-friendly timeline: date, change summary, actor role (Moderator, Editor, System merge)
- Major events: published, deprecated, merge survivor, spec correction approved
- Link to Entity Merge Record if this page absorbed duplicate
- No raw JSON diffs for public—human summaries required

**Who can edit.** Summaries written by **Moderator**/system on transition; immutable **Audit Log**.

**Source.** **Platform** audit derived.

---

### 13.3 Contributor Credits (Section AB)

**Why it exists.** Attribution drives quality contributions (charter community layer).

**Information contained.**

- Top contributors: photos, assertions, corrections, translations
- Chronological “recent contributions to this lure”
- Links to Contributor Profile
- Thank count optional future—not payment

**Who can edit.** Credits computed; contributor display name via profile.

**Source.** **Community**; roles visible, not editable here.

---

## 14. Commerce & Contribution

### 14.1 Find Retailers — Sponsored Links (Section AC)

**Why it exists.** Ethical monetization on explicit purchase intent only.

**Information contained.**

- Drawer/modal opened only from “Find retailers” action
- Disclosure Policy Version text at top (jurisdiction-aware)
- Sponsored Link rows: retailer logo, variant SKU match, external URL
- Balık Oltamda may appear with same styling as others + COI note if applicable
- No price history, stock, or cart
- “Organic ranking is independent” footer statement

**Who can edit.** Sponsored Link registry: **Platform** commerce admin; not editable by community.

**Source.** **Platform** monetization—not **Manufacturer** catalog field.

---

### 14.2 Contribute & Correct CTAs (Section AD)

**Why it exists.** Closes contributor loop without wiki-style unmoderated edit.

**Information contained.**

- Primary buttons: Submit catch report · Add usage assertion · Suggest correction · Upload photo
- Each opens guided form (species picker, technique, geographic band—not raw GPS default)
- Login required; reputation benefits explained briefly
- Correction form requires Source Document or field evidence upload optional

**Who can edit.** Forms create **Community** submissions; **Moderator** resolves.

**Source.** User input → **Community** pipeline.

---

### 14.3 Conservation & Legal Disclaimers (Section AE)

**Why it exists.** Charter compliance; protected species; bag limits not authoritative.

**Information contained.**

- Static + dynamic disclaimers: “Guide does not replace official regulations”
- Species-specific Conservation Rule Reference links when target species flagged protected in user country (geo IP or profile country optional)
- Invasive species caution when applicable

**Who can edit.** Static copy: **Platform** legal; dynamic links: **Moderator**/SpeciesCompass editors.

**Source.** **Platform** + regulatory **Source Documents** linked.

---

## 15. Staff-Only: Moderation Overlay (Section AF)

**Why it exists.** Moderators work from same page context without separate mystery admin.

**Information contained (visible only with role).**

- Moderation queue deep links for pending items on this model
- Pending Localized Text states per locale
- Unpublished AI Suggestions tied to this entity
- Data Quality Assessment last result with failed rules
- Publish Requirement Rule checklist live status
- Ingestion Batch id and external keys
- Feature flag overrides
- Quick actions: approve, request changes, merge duplicate, deprecate

**Who can edit.** **Moderator**, **Administrator**, **Content editor** (scoped).

**Source.** **Platform** operational metadata—not public SEO content (`noindex` on moderator query param views if separate URL).

---

## 16. Cross-Cutting UX Rules

### 16.1 Trust Badge Visual System

| Badge | Meaning | Source type color token |
|-------|---------|-------------------------|
| Factory spec | Manufacturer Knowledge Claim | Neutral blue |
| Community report | Usage assertion / catch | Green |
| Moderator verified | Verification Event | Teal |
| Expert endorsed | Expert Endorsement | Gold |
| Consensus | Community Consensus Group | Green double-check |
| Marketing target | Manufacturer packaging claim | Grey, dashed |
| AI-assisted | RAG summary only | Purple, always paired with disclaimer |

Never use same icon for provenance and verification.

### 16.2 Empty & Sparse States

| Section | Empty behavior |
|---------|----------------|
| Community stats | “No field reports yet — be the first” + CTA |
| Expert | Section hidden until first endorsement |
| Map | Hidden below k-anonymity threshold |
| AI Insights | Hidden if flag off or corpus empty |
| Color popularity | Show catalog colors with “no reports” state |
| Similar lures | Fallback to same manufacturer only |

Incomplete factory specs block **public** page only if Publish Requirement Rules fail—charter no empty SEO shells. Page may be `draft` hidden from index.

### 16.3 Localization

- All section headings localized
- Spec units toggle metric/imperial without changing canonical claims
- Turkish typography and sorting correct (İ/ı)
- Fallback chain per `007` §4.6 for pending translations

### 16.4 Accessibility

- Gallery: keyboard navigable; alt text mandatory
- Charts: data table alternate view
- Trust badges: text labels, not color alone
- Touch targets ≥44px for boat/mobile use
- Sunlight contrast ratio WCAG AA on trust bar

### 16.5 SEO (Content Specification)

- Title: `{Model name} · {Manufacturer} · LureAtlas · Balık Oltamda Guide`
- Meta description: factory depth + form factor + community report count (if >0)
- Canonical slug per locale
- hreflang `tr` / `en`
- Structured data: use `Product`-like only if legally accurate without offers; prefer custom `ItemPage` + manufacturer brand—legal review before launch
- Index only `published` models passing quality assessment

### 16.6 Performance Architecture (Frontend)

- Above-fold: identity, trust bar, hero image, variant selector, factory spec summary
- Below-fold lazy: maps, charts, assertion feed pages
- Single aggregate API endpoint for initial paint; paginate assertions
- CDN images with variant-appropriate derivative

---

## 17. Section Master Reference Table

| § | Section | Primary source | Edited by | Public default |
|---|---------|----------------|-----------|----------------|
| B | Identity strip | Manufacturer, Moderator | Editor, Moderator | Visible |
| C | Trust summary bar | Platform projection | System | Visible |
| D | Media gallery | Manufacturer, Community | Editor, Contributor→Mod | Visible |
| E | Variant selector | Manufacturer | Editor, Mod | Visible |
| F | Primary actions | Platform | — | Visible |
| G | Manufacturer panel | Manufacturer | Editor | Visible |
| H | Factory specifications | Manufacturer | Editor, Correction→Mod | Visible |
| I | Depth & action | Manufacturer + Community | Editor; Community assert | Visible |
| J | Hook configuration | Manufacturer, Community | Editor; Contributor→Mod | Visible |
| K | Speed & leader | Manufacturer, Community, Expert | Editor; Community; Expert | Visible |
| L | Target species | Moderator, Manufacturer, Community | Each layer separate | Visible |
| M | Techniques | Manufacturer, Community | Editor; Community | Visible |
| N | Compatible waters | Community, Moderator | Community; Mod note | Visible |
| O | Community overview | Community aggregate | System | Visible |
| P | Assertions feed | Community | Contributor→Mod | Visible |
| Q | Expert recommendations | Expert | Expert, Admin | If any |
| R | Catch reports | Community | Contributor→Mod | Visible |
| S | Maps | Community aggregate | System | If k-anonymity met |
| T | Seasonality | Community | System | Visible if data |
| U | Countries & colors | Community + Manufacturer catalog | System | Visible |
| V | AI insights | AI over published corpus | Mod promotes separately | Flag + data |
| W | Rigging tips | Community, Manufacturer | Contributor→Mod | Visible |
| X | Related / similar | Platform, Moderator | Mod curates related | Visible |
| Y | Compare CTA | Platform | User | Visible |
| Z | Provenance deep dive | All sources | Read-only | Visible |
| AA | Change history | Audit log | System summaries | Visible |
| AB | Contributor credits | Community | System | Visible |
| AC | Find retailers | Platform sponsorship | Commerce admin | User-initiated |
| AD | Contribute CTAs | Community intake | Contributor | Visible |
| AE | Disclaimers | Platform legal | Legal, Mod | Visible |
| AF | Moderation overlay | Platform ops | Moderator+ | Staff only |

---

## 18. Phased Rollout (Product)

| Phase | Minimum sections live |
|-------|------------------------|
| **Beta 1** | B–H, E, F, X (basic), Z (summary only), AD, AE |
| **Beta 2** | + P, O, R, AB, AA |
| **Beta 3** | + S, T, U, Q, W, AC |
| **Beta 4** | + V (flagged), full Z, AF for staff |

All sections remain specified from day one so API aggregation and layout grid do not require redesign.

---

## 19. Open Design Decisions (Track in ADR)

| ID | Question | Owner |
|----|----------|-------|
| UI-D01 | Sticky trust bar on scroll vs static | Design |
| UI-D02 | Tab vs long-scroll for Factory vs Community on mobile | Design |
| UI-D03 | JSON-LD schema type at launch | Legal + SEO |
| UI-D04 | k-anonymity threshold for maps (e.g., k≥5) | Product + Privacy |

---

## 20. Success Metrics (Page-Level)

- Median time on page > 45s for engaged sessions
- Compare action rate ≥ 8% of detail views
- Contribution CTA click ≥ 2% of authenticated views
- Scroll depth to Section P ≥ 35% when assertions exist
- Zero user reports of “could not tell factory vs community” in quarterly survey
- Sponsored drawer open rate tracked separately from organic engagement—never combined in ranking KPIs

---

*This specification defines the complete Lure Detail Page for Halco Laser Pro 190 DD and every LureAtlas Model. Implementation must not collapse trust layers for convenience.*

---

*End of document.*
