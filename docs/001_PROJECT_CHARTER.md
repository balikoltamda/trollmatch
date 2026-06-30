# Project Charter

**Document:** 001_PROJECT_CHARTER  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Owner:** Balık Oltamda  
**Status:** Sprint 0 — Charter ratification  
**Classification:** Private repository; public-facing product  
**Primary languages at launch:** Turkish (tr), English (en)

---

## 1. Executive Summary

Balık Oltamda Guide is a global, multilingual fishing knowledge platform designed to help anglers discover, compare, and apply reliable information about species, techniques, gear, and conditions. The platform is built and maintained in the private repository **TrollMatch**. It is intentionally **not** an e-commerce website. Commerce may appear only as optional, clearly labeled sponsored purchase links that point users to third-party retailers when a product recommendation is relevant.

The platform’s competitive advantage is **data quality**: structured, verifiable, community-enriched knowledge that improves over time. Artificial intelligence assists users in search, discovery, and synthesis, and assists moderators in curation workflows. AI does not replace human judgment, community contributions, or—over the long term—expert verification. Community-sourced observations, corrections, and field reports are treated as more valuable than model-generated assumptions.

Development follows a **modular architecture**. Each major capability ships as a bounded module with its own domain model, API surface, and UI entry points, sharing common platform services (identity, localization, media, search, moderation, analytics). The first module is **LureAtlas**, a structured catalog and discovery experience for artificial lures and related tackle, grounded in manufacturer data, community usage notes, and species/technique cross-references.

This charter defines purpose, scope, principles, success criteria, and architectural guardrails. It is the authoritative reference for what Balık Oltamda Guide is, what it is not, and how TrollMatch must evolve to support it.

---

## 2. Project Identity

| Attribute | Value |
|-----------|--------|
| Internal repository name | TrollMatch |
| Public platform name | Balık Oltamda Guide |
| Public URL (planned) | guide.balikoltamda.net |
| Parent brand | Balık Oltamda (Cyprus-based fishing tackle retailer and content publisher) |
| Product category | Fishing knowledge platform |
| Initial markets | Global audience; Turkish and English UI and content at launch |
| License | Private — Copyright © Balık Oltamda |

**Naming rationale.** “TrollMatch” reflects the internal engineering focus on matching anglers to knowledge—species, techniques, conditions, and gear—across trolling and broader sport-fishing contexts. “Balık Oltamda Guide” is the user-facing brand: a guide in the literal sense (reference, education, decision support), aligned with the existing Balık Oltamda community trust without implying a storefront.

---

## 3. Vision

Anglers worldwide should be able to answer practical fishing questions—*What lure works here, for this species, in these conditions?*—using a platform that prioritizes accuracy, provenance, and community experience over algorithmic guesswork.

Within three years, Balık Oltamda Guide should be recognized as a dependable reference for structured tackle knowledge (starting with lures), technique guidance, and species-linked recommendations, with clear attribution for every non-trivial claim and a moderation pipeline that scales with contributor growth.

---

## 4. Mission

Build and operate a modular fishing knowledge platform that:

1. **Curates high-quality structured data** about gear, species, techniques, and real-world usage.
2. **Amplifies community knowledge** through contribution, review, and reputation mechanisms.
3. **Uses AI as an assistant**, not an oracle—for search, summarization, duplicate detection, translation support, and moderator tooling.
4. **Serves global users** in their preferred language, starting with Turkish and English.
5. **Integrates commerce lightly and ethically** via sponsored outbound links when users explicitly seek purchase options.
6. **Evolves toward expert verification** for critical domains where incorrect advice has safety, legal, or conservation implications.

---

## 5. Problem Statement

Sport fishing knowledge is fragmented across forums, social media, manufacturer PDFs, video content, and regional guidebooks. Anglers repeatedly encounter the same problems:

- **Unstructured information.** A lure recommendation buried in a fifty-page thread cannot be compared, filtered, or validated.
- **Conflicting advice.** Techniques effective in the Eastern Mediterranean may mislead anglers in Northern Europe or the Pacific without context.
- **Commercial bias.** Retail and manufacturer marketing often masquerades as neutral guidance.
- **Language barriers.** High-quality content exists in Turkish, English, Japanese, and other languages, but cross-language discovery is poor.
- **Epistemic uncertainty.** Users cannot tell whether a claim comes from a single anecdote, repeated community consensus, manufacturer specification, or an AI hallucination.

Balık Oltamda Guide addresses these gaps by combining structured catalogs, community contributions with provenance, moderation workflows, and AI-assisted discovery—while refusing to become another undifferentiated content farm or a disguised shop.

---

## 6. Goals and Success Criteria

### 6.1 Primary Goals (Year 1)

| Goal | Description | Indicator |
|------|-------------|-----------|
| G1 — Trustworthy lure reference | Launch LureAtlas with searchable, filterable lure records linked to species and techniques | ≥ 500 curated lure records with complete core metadata |
| G2 — Bilingual experience | Full UI and primary content paths in Turkish and English | ≥ 95% of user-facing strings localized; core entities available in both languages |
| G3 — Community contribution | Enable signed-in users to submit corrections, usage notes, and field reports | Measurable contributor base; median moderation turnaround under 72 hours |
| G4 — Data provenance | Every factual field displays source type (manufacturer, community, moderator, AI-assisted draft) | 100% of published records include provenance metadata |
| G5 — Modular foundation | Platform services support adding modules without rewriting LureAtlas | Second module can be scoped without cross-module schema breaks |

### 6.2 Non-Goals for Year 1

- Operating as an e-commerce storefront (cart, checkout, inventory, payments).
- Fully automated expert verification at scale.
- Real-time fishing regulations or licensing authority for any jurisdiction.
- Native mobile applications (responsive web is sufficient initially).

### 6.3 Long-Term Success (Years 2–3)

- Expert-verified badges on high-impact content domains (conservation limits, invasive species, safety-critical techniques).
- Additional modules: SpeciesCompass (species profiles and seasonal patterns), TechniqueLibrary, LocationInsights (non-personal aggregated patterns).
- Sponsored link program with transparent disclosure and editorial independence policies.
- API access for partners under documented terms.

---

## 7. Scope

### 7.1 In Scope

**Platform capabilities (shared services):**

- User accounts and profiles (global; email or OAuth providers TBD in architecture docs).
- Role-based access: anonymous reader, contributor, moderator, administrator.
- Internationalization framework: locale-aware routing, content fallbacks, translation workflow.
- Media pipeline: image upload, resizing, alt text, license tracking.
- Search: full-text and faceted search across module entities.
- Moderation queue: submission, review, approve/reject/request changes, audit log.
- AI assistance layer: bounded prompts, retrieval-augmented responses over approved corpus, moderator copilots.
- Analytics: privacy-respecting usage metrics for product improvement.
- Sponsored link registry: outbound URLs with sponsor metadata, display rules, and click tracking.

**First module — LureAtlas:**

- Lure records: manufacturer, product line, model name, SKU variants, physical attributes (length, weight, type/action), target species tags, technique tags, color patterns, diving depth/buoyancy where applicable.
- Cross-links to techniques (e.g., trolling, casting, jigging) and species (taxonomic and common names, localized).
- Community fields: catch reports (structured, not free-form only), regional effectiveness notes, rigging tips—with contributor attribution.
- Comparison views: side-by-side lure comparison on normalized attributes.
- Discovery flows: filter by species + technique + water type + region climate band.
- Manufacturer reference data sourced from research pipeline under `research/manufacturers/` with documented ingestion rules.

**Content and research:**

- Internal research directories (species, techniques, competitors, community sentiment, images) feed curated imports—not unreviewed bulk scraping into production.

### 7.2 Out of Scope

- Processing payments or holding inventory.
- Guaranteeing catch outcomes or providing legally binding advice on bag limits (platform may link to official sources).
- Unmoderated public editing of canonical records (wikis without gates).
- Training general-purpose fishing chatbots on unvetted web scrapes.
- Storing precise GPS coordinates of secret or sensitive fishing spots without contributor consent and moderation policy.

---

## 8. Target Users and Personas

### 8.1 Primary Personas

**P1 — Curious Angler (global, mobile-first)**  
Wants to choose a lure for an upcoming trip. Needs filters, comparisons, and plain-language explanations in Turkish or English. Tolerates sponsored links only if clearly labeled.

**P2 — Experienced Contributor**  
Regularly fishes diverse conditions. Submits field reports, corrects manufacturer errors, uploads rigging photos. Expects attribution and visible impact of contributions.

**P3 — Moderator / Curator**  
Balık Oltamda staff or trusted community moderators. Reviews submissions, merges duplicates, flags AI-generated drafts, enforces provenance standards. Uses AI assist for duplicate detection and translation drafts—not for auto-approval.

**P4 — Content Editor**  
Maintains manufacturer relationships, imports spec sheets, writes foundational technique articles. Works in CMS-like workflows backed by structured data.

### 8.2 Secondary Personas

**P5 — International visitor**  
English-primary user researching Mediterranean techniques; may never purchase from Balık Oltamda. Must receive equal product quality without feeling like a sales lead.

**P6 — Future expert verifier**  
Independent guide or biologist who validates species IDs or conservation notes under a formal program (Phase 3+).

---

## 9. Product Principles

These principles override feature convenience and apply to every module, including LureAtlas.

1. **Data quality first.** Incomplete records remain draft or hidden until core fields pass validation. No “empty shell” pages for SEO.
2. **Community over model.** When community consensus conflicts with AI output, community-reviewed content wins pending moderator review.
3. **Provenance always.** Users see where information came from and when it was last verified.
4. **AI assists; humans accountable.** AI may draft summaries or suggest tags; moderators approve before publication to canonical fields.
5. **Modular boundaries.** Modules own their aggregates; shared kernel stays thin (users, media, search index, i18n, moderation).
6. **Global by design.** Units (metric/imperial), date formats, and species naming support international use—not only Cyprus or Turkey defaults.
7. **Commerce is optional and honest.** Sponsored links never alter ranking algorithms unless explicitly labeled as sponsored placement slots.
8. **Accessibility and performance.** Public guide pages must be usable on mid-range mobile devices and slow connections common in coastal regions.

---

## 10. First Module: LureAtlas

LureAtlas is the inaugural module because artificial lures are highly structured products with manufacturer data, clear attributes, strong community opinion, and natural cross-links to species and techniques. It delivers immediate user value while exercising the full platform stack: ingestion, structured storage, bilingual content, search, media, moderation, and AI-assisted discovery.

### 10.1 LureAtlas Core Entities

- **Manufacturer** — legal name, country, website, logo, data license notes.
- **Product line** — family grouping (e.g., minnow, pencil, soft plastic series).
- **Lure model** — canonical record with variants (size/color SKUs).
- **Attribute taxonomy** — normalized enums for action, buoyancy, hook configuration, recommended retrieve speed bands.
- **Usage assertion** — community or moderator statement linking lure + species + technique + optional region/climate band + confidence level.
- **Media asset** — photos with contributor license, linked to lure or usage assertion.

### 10.2 LureAtlas User Journeys (Launch)

1. **Discover by context:** User selects target species and technique → filtered lure list with community effectiveness indicators.
2. **Compare lures:** User selects two to four models → attribute table and usage assertion summary.
3. **Inspect provenance:** User opens record → sees manufacturer specs vs. community notes vs. last moderation timestamp.
4. **Contribute:** Signed-in user submits correction or field report → enters moderation queue.
5. **Purchase intent (optional):** User clicks “Find retailers” → sponsored/outbound links shown with disclosure.

### 10.3 LureAtlas Exit Criteria (Module v1 Complete)

- Public browse and search in Turkish and English.
- Moderator workflow operational with audit trail.
- Minimum curated dataset as defined in Goal G1.
- AI search assistant constrained to retrieval over published LureAtlas corpus plus approved technique snippets—no open-web guessing for specs.
- Module API documented for future mobile or partner use.

---

## 11. Modular Architecture Commitments

TrollMatch repository layout reflects intentional separation:

| Layer | Repository path | Responsibility |
|-------|-----------------|----------------|
| Data & migrations | `database/` | Schemas per module, shared platform tables, migration history, seed and reference data pipelines |
| API | `api/` | REST or GraphQL services (exact choice recorded in tech stack doc), module route namespaces, auth middleware |
| UI | `ui/` | Public guide frontend, moderator tools, design system, locale routing |
| Research | `research/` | Non-production source material; never deployed directly |
| Assets | `assets/` | Brand, screenshots, sample media for development |

**Module contract.** Each module defines:

- Domain schema (owned tables or schema namespace).
- Public read API versioned under `/v1/{module}/...`.
- Write API gated by role and moderation state machine.
- Search index document shape registered with platform search service.
- i18n keys and translatable field policy.
- Event hooks (e.g., `lure.published`) for analytics and cache invalidation.

**Shared platform services** must not embed LureAtlas-specific logic. Shared services include authentication, file storage, notification email, translation job queue, AI orchestration, and sponsored link resolution.

**Deployment independence (progressive).** Initial deployment may be a single deployable unit for operational simplicity, but code and schema boundaries must allow splitting `api` workers or static UI export per module when traffic and team scale justify it.

---

## 12. Data Quality and Knowledge Governance

Data quality is the highest priority and is enforced through policy, schema design, and workflow—not post-hoc cleanup.

### 12.1 Record Lifecycle States

| State | Meaning |
|-------|---------|
| `draft` | Incomplete or unreviewed; visible only to editors |
| `pending_review` | Community submission awaiting moderator |
| `published` | Meets validation rules; public |
| `deprecated` | Superseded or discontinued; public with warning |
| `rejected` | Not published; contributor notified with reason |

### 12.2 Validation Rules (Illustrative)

- Lure models require manufacturer, product name, at least one variant, and minimum one authoritative spec source before `published`.
- Usage assertions require species tag, technique tag, contributor ID, and geographic granularity no finer than climate/region band unless moderator upgrades precision.
- Images require license class (own work, manufacturer press, Creative Commons with attribution) before attachment to published records.

### 12.3 Duplicate and Conflict Handling

Moderators merge duplicate lure records using AI-suggested similarity scores as hints only. Conflicting usage assertions coexist with visibility of disagreement; moderators may mark a “community consensus” flag when multiple independent contributors align.

### 12.4 Research Pipeline

Material under `research/manufacturers`, `research/species`, and related folders is **evidence**, not production data. Ingestion scripts promote records through validation and human review. Competitor analysis informs taxonomy and UX; it does not authorize copying proprietary catalog text.

---

## 13. Artificial Intelligence: Role and Boundaries

AI is a **productivity and discovery accelerator**, not an authoritative source.

### 13.1 Permitted Uses

- Natural-language search over indexed, published content (RAG pattern).
- Tag and summary **drafts** for moderators from structured fields and approved text.
- Duplicate detection and near-match suggestion during ingestion.
- Translation **drafts** for Turkish ↔ English with human review for published content.
- Contributor onboarding: explain how to fill structured forms, not what fish will bite tomorrow.

### 13.2 Prohibited Uses

- Auto-publishing manufacturer specifications scraped from unverified web pages.
- Presenting AI-generated usage assertions as community or expert verified.
- Ranking lures by undisclosed paid placement.
- Collecting training data from users without consent and documented policy.

### 13.3 Transparency

UI surfaces must distinguish “AI-assisted summary” from “manufacturer specification” and “community field report.” Model version and retrieval corpus date appear in moderator tools; public footer may summarize AI use policy.

---

## 14. Community and Expert Verification

### 14.1 Community Layer (Launch)

Contributors earn reputation through accepted corrections and field reports. Reputation unlocks trusted submission shortcuts (e.g., direct to fast-track review) but never bypasses moderation entirely for canonical spec fields.

### 14.2 Expert Verification (Long-Term Vision)

A formal **Expert Verifier** program will allow credentialed guides, marine biologists, and manufacturer technical representatives to endorse records or assertions. Endorsements display badge, verifier profile, scope of expertise, and expiration/re-review date. Expert status is invitation-only with documented conflict-of-interest declarations (including manufacturer ties).

Until the program launches, the highest trust tier is **moderator verified**, not “AI confident.”

---

## 15. Internationalization and Global Users

Balık Oltamda Guide targets a **global audience** while launching with **Turkish and English**.

- **UI localization:** All interface strings externalized; Turkish is not a second-class locale.
- **Content localization:** Core entities support localized display names and descriptions with fallback chains (user locale → English → source language).
- **Species naming:** Taxonomic Latin names are locale-invariant; common names stored per locale with regional synonyms where known.
- **Units:** Store canonical metric; display metric or imperial based on user preference.
- **Regional context:** Usage assertions carry region/climate metadata so Mediterranean advice is not silently applied to Baltic conditions.

Future locales (e.g., Greek, Arabic, German) extend the i18n framework without rewriting module logic.

---

## 16. Relationship to Balık Oltamda Retail

Balık Oltamda operates a separate e-commerce business. Balık Oltamda Guide is editorially independent product software:

- Guide pages do not require login to shop accounts.
- Product availability and pricing remain on the retail site or third parties.
- Balık Oltamda may appear as one sponsored retailer among others where sponsorship policy allows.
- Brand voice aligns with Balık Oltamda’s educational content heritage (blog, tutorials) but Guide content must remain accurate when recommending non-Balık Oltamda brands—a norm in tackle retail honesty.

Cross-promotion (homepage links, newsletter mentions) is marketing, not architectural coupling. No shared database between shop and Guide in v1; future integrations use explicit APIs or affiliate link feeds.

---

## 17. Monetization Model

Revenue is **secondary to trust** in early phases. Approved mechanisms:

1. **Sponsored outbound links** — labeled placements when users request purchase options; click and impression reporting for sponsors.
2. **Future:** Module sponsorship (e.g., “LureAtlas supported by [Manufacturer]” banner with editorial firewall documented in governance policy).
3. **Future:** API tiers for commercial partners.

Monetization features require legal review for disclosure standards (EU, UK, TR consumer rules as applicable). Monetization must not degrade data quality metrics or pollute search ranking.

---

## 18. Technical Direction (Charter-Level Assumptions)

Detailed stack choices live in `008_TECH_STACK.md` and `006_SYSTEM_ARCHITECTURE.md`. Charter-level commitments:

- **Language ecosystem:** TypeScript across `api` and `ui` for shared types and maintainability (consistent with repository `.gitignore` patterns for Node/Next.js).
- **Public UI:** Server-rendered or hybrid rendering for SEO on guide pages; client interactivity for filters and comparison tools.
- **Database:** Relational store for structured entities and provenance; full-text search index (possibly dedicated engine) for discovery.
- **Hosting:** Production on infrastructure capable of supporting Node workloads and media storage (exact provider selected during architecture phase; Plesk default page on planned subdomain indicates DNS reserved, not final compute choice).
- **Security baseline:** HTTPS, OWASP-aligned API auth, rate limiting on AI and submission endpoints, secrets outside repository.
- **Observability:** Structured logging, error tracking, moderation queue metrics from day one of beta.

These assumptions are realistic for a small expert team building a content-heavy guide without e-commerce complexity.

---

## 19. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low-quality launch dataset | User distrust | Hide incomplete records; launch with curated seed only |
| AI hallucinated specs | Safety and brand damage | RAG-only public AI; no generative specs without source citation |
| Moderation backlog | Contributor churn | AI triage, contributor reputation fast-track, staffing plan |
| Manufacturer IP disputes | Legal exposure | Press-kit and licensed sources only; takedown process |
| Scope creep into e-commerce | Architecture rework | Charter non-goals; separate retail systems |
| Over-fitting to Eastern Mediterranean | Global failure | Region metadata on assertions; international beta testers |
| Sponsored link bias | Credibility loss | Fixed ad slots; ranking independence audits |

---

## 20. Governance and Decision Authority

- **Product owner:** Balık Oltamda leadership — scope, monetization, brand.
- **Technical lead:** Architecture and module boundaries — recorded in `004_DECISIONS.md` as ADRs.
- **Content lead:** Taxonomy, moderation policy, expert program criteria.
- **Charter changes:** Require explicit revision of this document with version date; agents and contributors treat it as binding scope.

Sprint 0 completes when discovery, architecture, tech stack, and backlog documents contain actionable detail consistent with this charter. Implementation of LureAtlas begins only after those artifacts align.

---

## 21. Compliance and Ethics

- **Privacy:** GDPR-aware data handling for EU users; minimal PII collection; clear privacy policy before account creation.
- **Conservation:** Platform avoids promoting illegal methods or protected species harvest; moderators enforce regional sensitivity flags.
- **Accessibility:** WCAG-oriented UI targets for public pages.
- **Attribution:** Respect image and text licenses; DMCA or equivalent takedown contact.

---

## 22. Metrics Framework

**North star:** Monthly active users who complete a meaningful discovery session (≥ 3 page views or 1 comparison) and return within 30 days.

**Supporting metrics:**

- Published record count and completeness score (automated field coverage).
- Contributor retention and submissions per 1000 MAU.
- Moderation median time-to-decision.
- Search success rate (click on result within first three positions).
- Sponsored link click-through with user satisfaction surveys (optional).
- AI assistant escalation rate (how often users fall back to human-curated records).

---

## 23. Repository and Documentation Map

This charter sits at the root of the TrollMatch documentation hierarchy:

- `000_DISCOVERY.md` — market and user research feeding charter refinements.
- `002_ENGINEERING_PRINCIPLES.md` — coding and review standards.
- `003_MASTER_CONTEXT.md` — living domain encyclopedia.
- `004_DECISIONS.md` — architecture decision records.
- `005_BACKLOG.md` — prioritized delivery items.
- `006_SYSTEM_ARCHITECTURE.md` — components and integrations.
- `007_DATABASE_VISION.md` — entity relationships and migration strategy.
- `008_TECH_STACK.md` — concrete technology choices.
- `009_ROADMAP.md` — phased delivery timeline.
- `011_GLOSSARY.md` — canonical terminology (LureAtlas, usage assertion, provenance, etc.).

Agents and engineers read `000` through `004` before writing production code, per `.cursor/rules/project.md`.

---

## 24. Phase Overview

| Phase | Focus | Outcome |
|-------|--------|---------|
| Sprint 0 | Documentation, architecture, seed research | Charter-aligned ADRs; LureAtlas schema draft |
| Phase 1 | LureAtlas MVP | Bilingual public beta |
| Phase 2 | Community contributions at scale | Reputation, improved moderation tooling |
| Phase 3 | Expert verification pilot | Badged endorsements in selected categories |
| Phase 4 | Additional modules | SpeciesCompass or TechniqueLibrary per roadmap |
| Phase 5 | Sponsored links program | Revenue with disclosed placements |

---

## 25. Approval and Effective Date

This charter is effective upon commit to the TrollMatch repository and supersedes informal descriptions of the project. All modules, integrations, and hiring decisions should trace back to the goals, principles, and scope defined here.

**Balık Oltamda Guide** is a fishing knowledge platform—built with modular discipline, bilingual from the start, global in ambition, and uncompromising on data quality. **TrollMatch** is the engineering home of that mission; **LureAtlas** is where it begins.

---

*End of document.*
