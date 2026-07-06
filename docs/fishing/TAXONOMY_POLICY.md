# Balık Oltamda Fishing Lexicon — Taxonomy Policy

**Document:** `docs/fishing/TAXONOMY_POLICY.md`  
**Status:** Authoritative reference (Sprint 7.2, refined 7.4.1)  
**Scope:** Fish species naming — scientific, preferred, aliases, regional, confusion

---

## 1. Principle

**Scientific taxonomy is always canonical.**

Do **not** rely on internet consensus. Do **not** use search popularity as truth.

Regional common names must **never** replace scientific taxonomy in the data model, APIs, or species identity.

```
CANONICAL IDENTITY          DISPLAY / SEARCH LAYER
──────────────────          ──────────────────────
FishSpecies.slug            preferred Turkish / English name
scientificName              aliases (same species)
parent hierarchy            regional names (country/region scope)
                            frequently confused species (separate relation)
                            editorial notes
```

A fish is **one** `FishSpecies` record. It has exactly one scientific name. It may have many regional names and aliases — all subordinate to the scientific identity.

---

## 2. Required fields per species

Every fish species record must support:

| Field | Storage | Rule |
|-------|---------|------|
| **Scientific name** | `FishSpecies.scientificName` + `SpeciesScientificName` | Canonical identity — always wins |
| **Preferred Turkish name** | `FishSpecies.nameTr` | Angler-natural TR label — Fishing Lexicon aligned |
| **English name** | `FishSpecies.nameEn` | Internationally accepted fishing terminology |
| **Other common names** | `SpeciesAlias` (kind `SYNONYM`, `SEARCH_TERM`) | Same species only — never cross-species |
| **Regional names** | `SpeciesCommonName` + `SpeciesAlias` (`REGIONAL_NAME`) | Country / major region scope only |
| **Frequently confused species** | `SpeciesConfusion` | Different species — **not** aliases |
| **Editorial notes** | `FishSpecies.editorialNotesEn/Tr` | Taxonomy guidance for editors and UI |

---

## 3. Regional names — country and major region only

**Do NOT model regional names per city.** City-level naming is impossible to maintain.

Regional names are stored only at:

| Scope | Examples |
|-------|----------|
| Country | `TR`, `GR`, `IT`, `ES` |
| Major region | `KKTC`, `global` |
| **Forbidden** | Istanbul, Izmir, Bodrum, Athens, … |

`countryScope` on `SpeciesCommonName` and `SpeciesAlias` enforces this boundary.

---

## 4. Aliases vs frequently confused species

### 4.1 Aliases

Aliases are names commonly used for the **same** species. They never replace canonical taxonomy.

**Example — *Lichia amia***

| Layer | Value |
|-------|-------|
| Scientific | *Lichia amia* |
| Preferred Turkish | Akya |
| English | Leerfish |
| Aliases | Liça, Litsa, Çatal Kuyruk, Çıplak |
| Regional (KKTC) | Litsa |

### 4.2 Frequently confused species

Different species that anglers confuse must **not** become aliases. Use `SpeciesConfusion` instead.

**Example**

| Species | Relation |
|---------|----------|
| *Lichia amia* (Akya) | Frequently confused with *Seriola dumerili* |
| Reason | Some regions incorrectly use "Akya" for *Seriola dumerili* |

**Example — *Seriola dumerili***

| Layer | Value |
|-------|-------|
| Scientific | *Seriola dumerili* |
| Preferred Turkish | Kuzu |
| English | Greater amberjack |
| Regional (KKTC) | Mineri |
| Alias | Sarı Kuyruk |
| **Do NOT** | Use "Akya" as alias — document only in confusion explanation |

---

## 5. Search behaviour

Search matches:

- Scientific names
- Preferred Turkish and English names
- Aliases
- Regional names
- Misapplied names on confusion records (with disambiguation)

When a confused or misapplied name is searched:

1. Show the **correct** species for that name (preferred match)
2. If the query matches a misapplied confusion label, show the confused species **with explicit reason**
3. Never silently merge two species because names overlap

Module: `ui/src/modules/taxonomy/data/species-search.ts`

---

## 6. Localization

- Do **not** translate names literally
- English names use internationally accepted fishing terminology
- Turkish names follow the Fishing Lexicon (`TERMINOLOGY.md`)
- Regional names inform search and display — they do not override `nameTr` / `nameEn` without editorial action

---

## 7. Rules summary

| Allowed | Forbidden |
|---------|-----------|
| Show "Akya" as Turkish preferred for *Lichia amia* | Create separate species per regional name |
| Store KKTC regional "Litsa" on *Lichia amia* | City-level regional names |
| `SpeciesConfusion` between *Lichia* and *Seriola* | Add "Akya" as alias on *Seriola* |
| Search disambiguation with editorial reason | Internet popularity as truth source |
| Change scientific assignment via taxonomic review | Importer auto-overwrites scientific name |

---

## 8. Schema reference

| Model | Purpose |
|-------|---------|
| `FishSpecies` | Core record + preferred names + editorial notes |
| `SpeciesScientificName` | Canonical Latin name (1:1) |
| `SpeciesCommonName` | Locale + countryScope regional names |
| `SpeciesAlias` | Search synonyms, misspellings, regional slang |
| `SpeciesConfusion` | Cross-species confusion with reason + misapplied name |

Migration: `ui/prisma/migrations/20250706200000_taxonomy_refinement/`

Module: `ui/src/modules/taxonomy/`

Seed reference: `ensureTaxonomyReferenceSeeds()` — *Lichia amia* / *Seriola dumerili* exemplar pair.

---

## 9. Related documents

| Document | Role |
|----------|------|
| `TERMINOLOGY.md` | Tackle vocabulary + species naming rules |
| `LOCALIZATION_GUIDE.md` | tr/en authoring |
| `docs/010_ANGLER_PRODUCT.md` | Sprint delivery record |

---

*Scientific taxonomy identifies fish. Regional names help anglers search. Confusion is documented — never aliased.*
