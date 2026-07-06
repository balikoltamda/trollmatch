# Balık Oltamda Fishing Lexicon — Taxonomy Policy

**Document:** `docs/fishing/TAXONOMY_POLICY.md`  
**Status:** Authoritative reference (Sprint 7.2)  
**Scope:** Fish species naming — relationship between scientific, regional, and common names

---

## 1. Principle

**Scientific taxonomy is always canonical.**

Regional common names must **never** replace scientific taxonomy in the data model, APIs, or species identity.

```
CANONICAL IDENTITY          DISPLAY / SEARCH LAYER
──────────────────          ──────────────────────
FishSpecies.slug            preferred name (tr/en)
scientificName              regional aliases
parent hierarchy            community slang (search only)
```

A fish is **one** `FishSpecies` record. It has exactly one scientific name. It may have many regional names — all subordinate to the scientific identity.

---

## 2. Hierarchy of names

| Layer | Authority | Example (European seabass) |
|-------|-----------|----------------------------|
| **Scientific** | Canonical identity | *Dicentrarchus labrax* |
| **Platform preferred** | Lexicon / `FishSpecies.nameEn/Tr` | European seabass · Levrek |
| **Regional common** | `SpeciesCommonName`, `regionalTerms` | Levrek (TR), Levrek (CY), Lubina (ES) |
| **Search aliases** | `SpeciesAlias` | lüfer ≠ seabass — different species |
| **Deprecated** | Must not be primary label | — |

---

## 3. Rules

### 3.1 Scientific name

- Stored on `FishSpecies.scientificName`
- Used in species detail headings (italic presentation)
- Used in AI citations and trust evidence
- **Never** overwritten by regional import text
- Changes require taxonomic review — not importer automation

### 3.2 Regional names

- Stored in `SpeciesCommonName` and `SpeciesAlias` (kind `REGIONAL_NAME`)
- Scoped by `locale` and `countryScope` (`TR`, `CY`, `global`, …)
- Valid for **display** and **search** in that region
- **Invalid** as the sole identity key — two regions saying "levrek" must still resolve to one species id

### 3.3 Regional names never replace scientific taxonomy

| Allowed | Forbidden |
|---------|-----------|
| Show "Levrek" as Turkish preferred common name for *D. labrax* | Create separate species record per regional name |
| Search "lüfer" → bluefish (*Pomatomus saltatrix*) | Merge levrek and lüfer because both are "popular fish" |
| Note in editorial copy: "called levrek in the Aegean" | Store scientific name as optional metadata |

### 3.4 Homonyms and false friends

Turkish and English regional names can collide across species:

| Name | Species A | Species B |
|------|-----------|-----------|
| Bluefish context | *Pomatomus saltatrix* (lüfer) | — |
| Seabass context | *Dicentrarchus labrax* (levrek) | — |

Disambiguation:

1. Scientific name in trust/species UI when homonym risk exists
2. Habitat/region context in species page copy
3. Search ranks by curated species links + lexicon — not raw string match alone

---

## 4. Relationship to Fishing Lexicon

| System | Scope |
|--------|-------|
| **Fishing Lexicon** (`terminology` module) | Tackle, rigging, technique, measurement vocabulary |
| **Fish taxonomy** (`FishSpecies` schema) | Biological species identity |

Species **display names** will eventually align with lexicon patterns (`preferred`, `aliases`, `deprecated`, `regional`, `scientific`, `notes`) but species identity remains in `fish_species` tables — not merged into tackle lexicon.

Cross-links:

- Lure → species associations reference `FishSpecies.id`
- Lexicon term domain `species` is for **vocabulary** (e.g. "target species", "bycatch") — not species records themselves

---

## 5. Importer behavior (current and future)

When manufacturer or community text mentions a fish:

1. Match against `SpeciesAlias` + `SpeciesCommonName` for locale/region
2. Resolve to `FishSpecies.id`
3. If no match → suggestion with confidence — never auto-create species from regional name alone
4. Scientific name from import is **evidence**, not override — editor confirms

---

## 6. Public UI behavior (future)

Species pages (`/species/[slug]`):

- **H1:** preferred common name for locale
- **Subtitle:** scientific name (always visible)
- **Regional variants:** shown as "Also known as …" when scoped to user's region
- **Never:** hide scientific name to simplify for local audience

Fish pages and lure species links use `FishSpecies.slug` — stable URL identity tied to taxonomy.

---

## 7. AI and trust

AI summaries and trust evidence must:

- Cite scientific name when stating species compatibility
- Use regional names only with region scope explicit
- Never claim two species are the same because regional names overlap

---

## 8. Eastern Mediterranean default lens

Platform default region: **Aegean & Eastern Mediterranean** (Türkiye, Northern Cyprus).

- Turkish preferred common names reflect TR/CY angler usage
- Scientific names remain global canonical
- Regional names from other countries (Greece, Italy, …) are aliases — not preferred tr labels unless editorially adopted for that locale

---

## 9. Editorial workflow

| Action | Who |
|--------|-----|
| Add regional alias | Editor + evidence |
| Change preferred common name | Senior editor |
| Change scientific name assignment | Taxonomic review |
| Deprecate misleading regional name | Editor with documented reason |

Studio species reference (`/studio/species`) remains taxonomy tooling — lexicon docs govern **how names are used**, schema governs **what exists**.

---

## 10. Related documents

| Document | Role |
|----------|------|
| `TERMINOLOGY.md` | Tackle and rigging terms |
| `LOCALIZATION_GUIDE.md` | tr/en authoring rules |
| `docs/domain/LURE_DOMAIN_MODEL.md` | Lure–species associations |
| `ui/prisma/schema.prisma` | `FishSpecies`, `SpeciesAlias`, `SpeciesCommonName` |

---

*Regional names inform anglers. Scientific taxonomy identifies fish. The platform never confuses the two.*
