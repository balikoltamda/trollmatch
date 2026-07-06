# Balık Oltamda — Species → Technique → Lure Policy

**Document:** `docs/fishing/SPECIES_TECHNIQUE_LURE_POLICY.md`  
**Status:** Authoritative platform law  
**Scope:** All species–lure relationships, recommendations, and effectiveness claims

---

## 1. Principle

**A fish species never has a single fishing method.**

Every relationship between a species and a lure must always be qualified by a **fishing technique**.

```
ALLOWED                         FORBIDDEN
───────                         ─────────
Species → Technique → Lure      Species → Lure (recommendation)
```

Different techniques require different tackle, presentation, speeds, depths, and environmental conditions. The platform must model these **independently**.

**Never generalize** a lure or recommendation to an entire species without specifying the fishing technique.

---

## 2. What this means in practice

| Context | Rule |
|---------|------|
| **Catch reports** | `techniqueId` required — species + lure + technique together |
| **Usage assertions** | lure + species + technique + geographic context (see `007`) |
| **Top lure rankings** | Group and rank by technique — never species-wide lure lists |
| **Discovery** | Primary flow: user picks species **and** technique → lure list |
| **AI summaries** | Must cite technique when claiming effectiveness |
| **Studio editorial** | Assign species targets per technique context, not bare species tags for effectiveness |

---

## 3. Catalog links vs effectiveness claims

`LureSpecies` (lure ↔ species association) may exist for **catalog metadata only**:

| `association_kind` | Purpose | Technique required? |
|--------------------|---------|-------------------|
| `MANUFACTURER_MARKETING` | Box/packaging target species | No — marketing claim, not field recommendation |
| `MODERATOR_CURATED` | Editorial browse filter seed | No — catalog index only; discovery still filters by technique |
| `COMMUNITY_EFFECTIVENESS` | **Deprecated path** | Yes — must migrate to Usage Assertion with technique |

**Rule:** `LureSpecies` rows must **never** power effectiveness rankings, “most successful lure” UI, or AI recommendation copy without a technique qualifier.

Effectiveness and recommendations use the **Species → Technique → Lure** triple — stored in Catch Reports, Usage Assertions, and future `SpeciesTechniqueLure` aggregates.

---

## 4. Environmental dimensions (independent)

Technique is the primary qualifier. These dimensions attach to the triple — not to species alone:

| Dimension | Examples |
|-----------|----------|
| **Presentation** | retrieve speed, jigging cadence, trolling pattern |
| **Depth** | lure depth, water column |
| **Speed** | trolling speed (kn), retrieve band |
| **Environment** | boat/shore, region, season, water type |

A lure effective for *Lichia amia* on **trolling** at 4 kn is not the same claim as the same lure on **casting** from shore.

---

## 5. UI behaviour

### Species pages

- **Allowed:** “Top lures for *Akya* — **trolling**” (per-technique sections)
- **Forbidden:** “Top lures for *Akya*” (species-only ranking)
- **Catalog section:** “All linked lures” — browse index from `LureSpecies`; not an effectiveness recommendation

### Lure pages

- Species lists must show technique context when derived from field evidence
- Manufacturer marketing species tags labelled as packaging claims

### Search & discovery

- Species + technique filters are the primary discovery axes
- Species-only filter returns catalog matches with technique filter prompt

---

## 6. Schema direction

| Model | Role |
|-------|------|
| `LureTechnique` | Lure compatible with technique (gear axis) |
| `LureSpecies` | Catalog/metadata association — not bare effectiveness |
| `CatchReport` | species + lure variant + **technique** (required) |
| `UsageAssertion` (future) | species + lure + **technique** + geographic/temporal scope |

Future: `SpeciesTechniqueLure` aggregate or materialized view for ranked triples.

---

## 7. Lexicon alignment

Fishing technique names follow the **Fishing Lexicon** (`TERMINOLOGY.md`) — lexicon-first gate applies. Do not invent technique labels in UI or seeds.

---

## 8. Related documents

| Document | Role |
|----------|------|
| `TERMINOLOGY.md` | Technique vocabulary |
| `TAXONOMY_POLICY.md` | Species naming |
| `docs/007_DATABASE_VISION.md` | Usage Assertion, Catch Report derivation |
| `docs/domain/LURE_DOMAIN_MODEL.md` | LureAtlas association semantics |

---

*Platform law: Species → Technique → Lure. Never Species → Lure for recommendations.*
