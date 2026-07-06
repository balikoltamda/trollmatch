# Angler Product — Sprint 7+

**Document:** 010_ANGLER_PRODUCT  
**Status:** Active product direction  
**Supersedes:** Infrastructure-first Studio sprints as primary focus

---

## Philosophy

Stop building infrastructure. The foundation is strong enough.

From this point forward, every sprint must create **visible value for anglers**.

| Role | Responsibility |
|------|----------------|
| **Editor** | Validates |
| **Community** | Creates |
| **Platform** | Learns |

Every new feature should make anglers **return to the site**, not just improve the admin experience.

Studio work continues only when it unblocks an angler-facing loop.

### Feature gate

Before implementing any feature, ask:

> **Will this feature make TrollMatch more valuable than ChatGPT for anglers?**

If the answer is **no**, redesign the feature.

### Competitive advantage

The advantage is **not** AI.

| What wins | What does not |
|-----------|----------------|
| Verified fishing knowledge | Generic chat answers |
| Structured relationships (species ↔ lure ↔ technique ↔ source) | Unstructured text dumps |
| Editorial trust (Balık Oltamda verifies) | Ungrounded model output |

AI may assist summarization and discovery, but only when it **surfaces verified, cited, structured knowledge** that ChatGPT cannot replicate.

---

## Priority stack

1. **Search** — find lures by model, brand, species, technique
2. **Fish pages** — species as the primary discovery axis
3. **Community reports** — anglers submit; editors verify
4. **Regional experience** — Aegean & Eastern Mediterranean lens on every page
5. **AI summaries** — at-a-glance reads with cited sources (after browse + contribute work)

---

## Sprint 7.1 — Discovery loop (shipped)

**Goal:** Anglers can find fish → find lures → open detail.

### Delivered

| Route | Purpose |
|-------|---------|
| `/search?q=` | Full-text search across catalog |
| `/lures` | Browse all visible lures |
| `/species` | Fish species index with lure counts |
| `/species/[slug]` | Species detail + linked lure grid |

### Wiring

- Header and hero search → `/search` (no more slug-guess 404s)
- Nav: Home · **Fish** · LureAtlas · Contribute
- Homepage species, latest lures, stats → live DB with static fallback
- Collection cards → species entry points
- Lure detail species rows → species pages
- Public lure visibility → `PUBLISHED` + `READY` only

### Module

`ui/src/modules/discovery/` — public catalog queries, visibility rules, shared search UI.

---

## Sprint 7.2 — Fishing Lexicon foundation (shipped)

**Goal:** Establish canonical terminology standards — not a translation dictionary.

### Delivered

| Artifact | Purpose |
|----------|---------|
| `docs/fishing/TERMINOLOGY.md` | Authoritative term definitions (Fishing Line, Leader, …) |
| `docs/fishing/LOCALIZATION_GUIDE.md` | Independent tr/en angler localization rules |
| `docs/fishing/TAXONOMY_POLICY.md` | Scientific taxonomy vs regional names |
| `ui/src/modules/terminology/` | Types + seed registry (`LEXICON_REGISTRY`) |

### Rules locked

- Never translate fishing terminology literally
- Turkish = angler language of Türkiye / Northern Cyprus
- English = internationally accepted fishing terminology
- Regional names never replace scientific taxonomy
- **Lexicon-first:** no terminology or taxonomy without Fishing Lexicon entry
- Application **not wired yet** — standards first, integration in later sprints

### Consumers (future)

UI · Search · AI summaries · Importers · Studio · Public pages · APIs

---

## Sprint 7.3 — Catch Reports (shipped)

**Goal:** Anglers submit real fishing experiences; editors verify; data surfaces on lure and fish pages.

### Delivered

| Area | Feature |
|------|---------|
| **Schema** | `catch_reports` — species, variant, technique, region, catch count, verification status |
| **Public lure pages** | Real Catch Reports section + 30-second submit form |
| **Public fish pages** | Most successful lures from approved reports |
| **Studio** | `/studio/community/reports` — approve, reject, merge duplicates |

### Not in scope

- Reputation system
- AI summarization of reports

---

## Sprint 7.4 — Knowledge Acquisition Pipeline (shipped)

**Goal:** Platform learns from trustworthy sources without depending on voluntary user submissions.

### Delivered

| Area | Feature |
|------|---------|
| **Schema** | `KnowledgeSource`, `KnowledgeItem`, `KnowledgeEvidence`, `KnowledgeSuggestion`, `KnowledgeGraphLink`, `KnowledgeAuditEntry` |
| **Studio** | `/studio/knowledge` — editor inbox sorted by confidence |
| **Actions** | Approve, reject, merge, ignore, open source (all audited) |
| **Architecture** | Vision pipeline interfaces, knowledge graph prep, multi-source type design |
| **Index policy** | Metadata + URL + AI summary only — no third-party content republishing |

### Not in scope

- Crawlers, scrapers, external APIs
- AI summarization or vision implementation
- Facebook / Instagram sources

See `docs/013_KNOWLEDGE_PIPELINE.md` for full architecture.

---

## Sprint 7.4.1 — Taxonomy & Naming Standard (shipped)

**Goal:** Lock scientific taxonomy as canonical truth; separate aliases from confused species.

### Delivered

| Area | Feature |
|------|---------|
| **Schema** | `SpeciesConfusion`, `editorialNotes` on `FishSpecies` |
| **Module** | `ui/src/modules/taxonomy/` — search, profile, reference seeds |
| **Search** | Species matches + disambiguation for misapplied names |
| **Species pages** | Taxonomy section — aliases, regional names, confusions |
| **Docs** | `TAXONOMY_POLICY.md`, `TERMINOLOGY.md` updated |
| **Reference** | *Lichia amia* (Akya) ↔ *Seriola dumerili* (Kuzu) exemplar |
| **Lexicon** | Reference species registered in `terminology/data/reference-species.ts`; taxonomy seeds derive from lexicon term ids |

### Rules locked

- No city-level regional names
- Scientific taxonomy always wins
- Confused species ≠ aliases

---

## Species → Technique → Lure (platform law)

**Goal:** Never generalize lure recommendations to a species without fishing technique.

### Rules locked

- **Species → Technique → Lure** — not Species → Lure for effectiveness
- Catch reports require `techniqueId`
- Species page rankings grouped by technique
- `LureSpecies` = catalog metadata only — not effectiveness UI

See `docs/fishing/SPECIES_TECHNIQUE_LURE_POLICY.md`.

---

## Sprint 8.0 — Brand & Copy Consistency (shipped)

**Goal:** One consistent angler voice — no placeholder slogans or startup wording.

### Delivered

| Area | Change |
|------|--------|
| **Brand statement** | TR: *Gerçek av tecrübeleriyle doğrulanmış balıkçılık platformu.* |
| **Hero** | Clear TrollMatch title + brand statement + manufacturer / catch / verification subtitle |
| **Removed** | Kutuda yazan / Suda olan slogans, Knowledge Engine, AI Insights labels |
| **Renamed** | Manufacturer specs, catch reports, source archive (Studio) |
| **Locales** | Full `en.json` + `tr.json` copy pass |

### Voice rule

Sound like an experienced angler — not a software company.

---

## Sprint 8.2 — Premium UI Refresh (shipped)

**Goal:** Presentation that inspires confidence — closer to Linear, Notion, and Stripe than a CMS. No workflow changes; TrollMatch palette unchanged.

### Delivered

| Area | Change |
|------|--------|
| **Design tokens** | Softer borders, typography scale, `.label-caps`, `.page-header`, `.section-stack`, refined elevated surfaces |
| **Foundation** | Cards, sections, container width/padding, inputs, premium search (`h-14` on hero/discovery) |
| **Discovery** | Species index + lure results: page headers, `EmptyState`, wider grid gaps |
| **Detail pages** | Species + lure layouts: clearer hierarchy, taxonomy cards, catch-report lists |
| **Home** | Quieter hero gradient, larger spacing, section rhythm |
| **Studio** | Cleaner tables — rounded shell, uppercase column labels, generous row padding |
| **Empty / loading** | Shared `EmptyState`; skeleton loaders match card grid |

### Design rule

Reduce visual noise. Desktop first; mobile excellent. Improve presentation only — never redesign workflows.

---

## Evolutionary domain design (platform law)

**Goal:** Keep fishing knowledge models simple — extensible, not premature.

### Rules locked

- Model only concepts **required by the current product**
- Design entities for extension; defer sub-techniques, advanced rigging, presentations until needed
- `007_DATABASE_VISION.md` is long-horizon — not a build-everything checklist
- Platform must stay understandable for anglers and developers

See `docs/002_ENGINEERING_PRINCIPLES.md` §2.

---

## Sprint 7.5 — Knowledge Hub & Source Intelligence (shipped)

**Goal:** Central hub for verified fishing knowledge — indexed, connected, never mirrored.

### Delivered

| Area | Feature |
|------|---------|
| **Studio** | Knowledge Hub at `/studio/knowledge` — richer workspace with source scoring |
| **Source scoring** | Category-based engine (manufacturer, scientific, forum tiers, etc.) |
| **Relations** | Multiple species, lures, techniques, manufacturers via knowledge graph |
| **Public** | Related knowledge sections on lure + species pages |
| **Search** | Knowledge titles and summaries in `/search` results |
| **Editor** | Approve, reject, merge, archive, flag outdated, view original |

See `docs/013_KNOWLEDGE_PIPELINE.md`.

---

## Sprint 7.6 — Regional experience (next)

**Goal:** Every lure page answers “how does this work *here*?”

- Surface `LureEditorNote` regional fields on public lure detail
- Region selector or default Eastern Mediterranean lens
- Collections filter by region + species + technique
- Wire approved catch reports into trust layer + community statistics (replace enrichment mock)

---

## Sprint 7.7 — AI summaries (angler-facing)

**Goal:** “At a glance” blocks with real cited sources — not empty shells.

- Promote verified editor notes into AI section when no generated summary
- Generate summaries from box specs + community reports + regional notes
- Always show citations and corpus date
- AI must resolve vocabulary through Fishing Lexicon term ids

---

## Deferred (admin / infra)

- Studio dashboard stat cards
- Import center polish
- Manufacturer hub (angler-facing brand pages are Sprint 8+)
- Meilisearch (after Prisma search proves UX)

---

## Success metric

Would an angler bookmark this page or share it with a fishing buddy?

If not, it does not ship.
