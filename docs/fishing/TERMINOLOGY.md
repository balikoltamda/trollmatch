# Balık Oltamda Fishing Lexicon — Terminology

**Document:** `docs/fishing/TERMINOLOGY.md`  
**Status:** Authoritative reference (Sprint 7.2)  
**Module:** `ui/src/modules/terminology/`  
**Audience:** Engineers, editors, translators, AI prompt authors, importers

---

## 1. What this is

The **Balık Oltamda Fishing Lexicon** is the canonical terminology used by the entire platform.

It is **not** a translation dictionary.

| Consumer | How lexicon is used |
|----------|---------------------|
| **UI** | Preferred labels in tr/en copy |
| **Search** | Aliases, regional names, misspellings |
| **AI summaries** | Consistent vocabulary in generated text |
| **Importers** | Map manufacturer text → canonical term ids |
| **Studio** | Editor vocabulary picker and validation |
| **Public pages** | Species, tackle, technique labels |
| **Future APIs** | Stable term ids across clients |

Every future feature that displays or indexes fishing vocabulary **must** reference lexicon term ids — not ad hoc strings.

---

## 2. Core rules

1. **Never translate fishing terminology literally.** Turkish and English are independently localized angler language.
2. **Preferred term** is the only label shown in primary UI for each locale.
3. **Aliases** power search and importer matching — never replace preferred labels without editorial action.
4. **Deprecated terms** must not appear in UI copy. They may remain searchable with a redirect to the preferred term.
5. **Regional terms** are scoped (country/region). They do not override scientific taxonomy (see `TAXONOMY_POLICY.md`).
6. **Notes** carry full conceptual documentation. Do not simplify rigging or biological concepts for UI convenience.

---

## 3. Term record shape

Each lexicon entry (`LexiconTerm`) includes:

| Field | Purpose |
|-------|---------|
| `id` | Stable slug — used in code, DB foreign keys, APIs |
| `domain` | Vocabulary area (`line`, `leader`, `tackle`, `technique`, `species`, …) |
| `preferred.en` / `preferred.tr` | Independently authored angler labels |
| `aliases` | Search terms, synonyms, manufacturer codes |
| `deprecatedTerms` | Labels that must not be used — with reason |
| `regionalTerms` | Locale + region scoped angler names |
| `scientificTerms` | Formal nomenclature where applicable |
| `internationalTerms` | Cross-market standard labels |
| `notes.en` / `notes.tr` | Full conceptual documentation |
| `parentId` | Hierarchy (e.g. `monofilament-line` → `fishing-line`) |

Seed data: `ui/src/modules/terminology/data/`.

---

## 4. Fishing Line

**Term id:** `fishing-line`  
**Domain:** `line`

### Preferred labels

| Locale | Preferred term |
|--------|----------------|
| English | Fishing Line |
| Turkish | Misina |

General category for cordage used in sport fishing — main line, running line, and line systems.

### Subtypes (child terms)

| Term id | English preferred | Turkish preferred |
|---------|-------------------|-------------------|
| `monofilament-line` | Monofilament Line | Monofilament Misina |
| `fluorocarbon-line` | Fluorocarbon Line | Florokarbon Misina |
| `braided-line` | Braided Line | Örgü Misina |
| `hybrid-line` | Hybrid Line | Hibrit Misina |
| `wire-leader` | Wire Leader | Tel Leader |

Subtypes are **separate lexicon entries**, not inline adjectives. Importers that read "PE braid" map to `braided-line`, not a free-text tag.

### Aliases (examples)

| Label | Locale | Kind |
|-------|--------|------|
| mono | en | search_term |
| braid | en | search_term |
| PE line | en | international |
| örgü | tr | search_term |
| mono misina | tr | search_term |

---

## 5. Leader

**Term id:** `leader`  
**Domain:** `leader`

### Preferred labels

| Locale | Preferred term |
|--------|----------------|
| English | Leader |
| Turkish | Leader |

### Deprecated — never use in UI

| Label | Locale | Reason |
|-------|--------|--------|
| Beden | tr | Literal translation of English "leader". Not angler-natural in Türkiye or Northern Cyprus. Does not convey the rigging concept. |
| Lider | tr | Phonetic loan misused as direct translation — not established angler terminology. |

### Concept (documentation — do not simplify)

**Leader** is NOT a generic translation problem — it is a specific rigging component.

Leader is a **short section of monofilament or fluorocarbon** attached to braided line (or, in some setups, attached between main line and terminal tackle).

It provides **one or more** of:

- abrasion resistance
- reduced visibility
- controlled stretch
- knot transition (between braid and terminal tackle)

The exact benefit **depends on leader material**.

#### Monofilament leader

- more stretch
- better shock absorption

**Term id:** `monofilament-leader`  
English: Monofilament Leader · Turkish: Monofilament Leader

#### Fluorocarbon leader

- higher abrasion resistance
- lower visibility

**Term id:** `fluorocarbon-leader`  
English: Fluorocarbon Leader · Turkish: Florokarbon Leader

#### Wire leader

**Term id:** `wire-leader` (child of `fishing-line`, not of `leader`)  
Metal section for toothy species — distinct rigging purpose from mono/fluoro leaders.

### Regional terms

| Label | Locale | Region | Notes |
|-------|--------|--------|-------|
| Fore | tr | TR | Regional search alias — tackle shops and forums; not preferred UI label |
| Fore | tr | CY | Same in Northern Cyprus — search alias only |

### International aliases

`leader`, `leader line`, `shock leader`, `tippet` — searchable, not preferred UI labels unless locale is `en` and term is `leader`.

---

## 6. Hierarchy diagram

```
fishing-line (Misina / Fishing Line)
├── monofilament-line
├── fluorocarbon-line
├── braided-line
├── hybrid-line
└── wire-leader

leader (Leader / Leader)
├── monofilament-leader
└── fluorocarbon-leader
```

`wire-leader` is under `fishing-line` because it is a material category; `leader` parent covers mono/fluoro leader sections in a braid-to-tackle rig.

---

## 7. Adding new terms

1. Author **preferred.en** and **preferred.tr** independently (see `LOCALIZATION_GUIDE.md`).
2. Add aliases from manufacturer catalogs, forums, and import evidence.
3. List deprecated labels with explicit reasons.
4. Write full `notes` — especially for rigging and technique terms.
5. Add seed entry under `ui/src/modules/terminology/data/`.
6. Update this document.
7. Wire into UI/search/importers in a **later sprint** — lexicon first, integration second.

---

## 8. Related documents

| Document | Role |
|----------|------|
| `LOCALIZATION_GUIDE.md` | How tr/en labels are authored |
| `TAXONOMY_POLICY.md` | Scientific vs regional names for species |
| `docs/010_ANGLER_PRODUCT.md` | Sprint 7.2 delivery record |

---

*This document is the authoritative human reference. The machine-readable source of truth is `LEXICON_REGISTRY` in `ui/src/modules/terminology/`.*
