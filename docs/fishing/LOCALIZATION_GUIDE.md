# Balık Oltamda Fishing Lexicon — Localization Guide

**Document:** `docs/fishing/LOCALIZATION_GUIDE.md`  
**Status:** Authoritative reference (Sprint 7.2)  
**Locales at launch:** Turkish (`tr`), English (`en`)

**Onboarding summary:** [`AI_CONTEXT.md`](../../AI_CONTEXT.md) § Fishing Knowledge Rules. **This document** defines how tr/en labels are authored — roles, forbidden patterns, field-by-field rules, and worked examples.

---

## 1. Principle

Turkish and English are **independently localized**.

They are **NOT** direct translations of each other.

The lexicon is not a bilingual dictionary. It is a **canonical vocabulary** where each locale has angler-natural preferred terms tied to the same stable term `id`.

```
term id: leader
  preferred.en → "Leader"     (international angler English)
  preferred.tr → "Leader"       (Türkiye / Northern Cyprus sport-fishing usage)

  NOT: preferred.tr → "Beden"   (literal translation — deprecated)
  "Fore" → regional search alias (TR, CY) — not preferred label
```

---

## 2. Who authors labels

| Role | Responsibility |
|------|----------------|
| **Domain editor** | Preferred tr/en labels for tackle, rigging, technique |
| **Taxonomist / biologist reviewer** | Scientific terms on species entries |
| **Regional editor** | Regional aliases — never preferred label without platform approval |
| **Engineer** | Implements term ids in code — does not invent copy |
| **AI system** | Must use term ids → resolved preferred labels — never freestyle translate |

Machine translation (Google Translate, DeepL, LLM literal translate) is **forbidden** for preferred labels.

---

## 3. Turkish localization rules

### 3.1 Source of truth

Turkish terminology must match language **naturally used by anglers in Türkiye and Northern Cyprus**.

Sources of evidence (in priority order):

1. Established tackle retailers and distributors in TR/CY
2. Sport-fishing forums and social channels (Boğaz, Ege, Akdeniz context)
3. Manufacturer Turkish packaging where angler-natural
4. Editorial judgment — documented in term `notes.tr`

### 3.2 Loanwords

International angler loanwords are valid **preferred** labels when that is what anglers say:

| Acceptable | Example |
|------------|---------|
| Established loanword | Fore, jig, spin, trolling, crankbait (when no better tr label exists) |
| Manufacturer model names | Laser Pro, Shore Jigging (proper nouns — not lexicon terms) |

Loanwords are not lazy — they are accurate when the Turkish angler community adopted the term.

### 3.3 Forbidden patterns

| Pattern | Example | Why |
|---------|---------|-----|
| Literal dictionary translation | Beden ← Leader | Wrong rigging concept |
| Administrative Turkish | Lider ← Leader | Not angler vocabulary |
| Retail marketing exaggeration | "Ultra güçlü misina" as term id label | Marketing copy ≠ lexicon |
| Mixing locales in one label | "Leader fore" | Pick one locale per field |

### 3.4 Regional variation inside Turkish

Northern Cyprus and Türkiye share most sport-fishing vocabulary. When they diverge:

- Add `regionalTerms` with `regionScope` (`TR`, `CY`, or platform region id)
- Keep a single `preferred.tr` for the default Eastern Mediterranean lens
- Document divergence in `notes.tr`

---

## 4. English localization rules

### 4.1 Source of truth

English terminology must match **internationally accepted fishing terminology**.

Sources:

1. IGFA, major manufacturer English technical docs
2. UK/US/AU sport-fishing media (prefer international neutral over regional slang for preferred label)
3. Scientific English for species-related terms

### 4.2 Spelling variants

| Variant | Lexicon handling |
|---------|------------------|
| colour / color | `aliases` with locale `en` — preferred label uses platform style guide (colour for en-GB alignment with charter) |
| leader line / leader | `leader` preferred; `leader line` alias |

### 4.3 Forbidden patterns

| Pattern | Why |
|---------|-----|
| American-only slang as global preferred | Use alias; preferred should be internationally understood |
| Manufacturer hype | "Unstoppable action" is not a lexicon term |

---

## 5. Field-by-field localization

| Field | Localized? | Notes |
|-------|------------|-------|
| `preferred.en` | Yes | English angler label |
| `preferred.tr` | Yes | Turkish angler label — independent authoring |
| `aliases[].label` | Per alias locale | May be `any` for manufacturer codes |
| `deprecatedTerms[].reason` | Yes — per locale | Explain in the language editors read |
| `regionalTerms[].label` | Yes | Scoped to region |
| `scientificTerms` | No — Latin/universal | `Sparus aurata` not translated |
| `internationalTerms` | Often English | Search aids |
| `notes.en` / `notes.tr` | Yes | Full documentation per locale |

---

## 6. UI copy resolution (future)

When wired into the application:

```
resolvePreferredLabel(termId, locale) → string
```

Rules:

1. Always resolve from lexicon — never inline strings for domain terms
2. Fall back: `preferred.en` if `preferred.tr` missing (dev only — both required for publish)
3. Aliases never shown as primary headings
4. Deprecated terms: redirect or editor warning in Studio — never public UI

---

## 7. Importer mapping (future)

Manufacturer text → lexicon term id:

1. Normalize input (`normalizeTermLabel`)
2. Match against aliases for locale + `any`
3. If ambiguous → `PENDING_REVIEW` suggestion in Studio
4. Never auto-create preferred labels from import text

---

## 8. AI summaries (future)

AI must:

1. Receive term ids in context, not raw translated strings
2. Output preferred labels for the target locale
3. Cite lexicon `notes` for rigging explanations (Leader section, etc.)
4. Never invent Turkish equivalents — use `preferred.tr` or flag gap for editors

---

## 9. Worked example — Leader

| | English | Turkish |
|---|---------|---------|
| **Preferred** | Leader | Leader |
| **Search alias** | shock leader | fore, ön misina |
| **Deprecated** | — | Beden, Lider |
| **Regional** | — | Fore (TR, CY) — search only |
| **Notes** | Full rigging documentation | Full rigging documentation (Turkish prose, same concepts) |

English notes and Turkish notes describe the **same rigging physics** — they are not translations of each other sentence-by-sentence. They are independently written documentation for anglers reading in that language.

---

## 10. Related documents

| Document | Role |
|----------|------|
| `TERMINOLOGY.md` | Canonical term definitions |
| `TAXONOMY_POLICY.md` | Species naming law |
| `docs/001_PROJECT_CHARTER.md` | G2 bilingual experience goal |

---

*Every future feature that touches fishing vocabulary must comply with this guide.*
