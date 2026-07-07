# Engineering Principles

**Document:** `002_ENGINEERING_PRINCIPLES.md`  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Status:** Authoritative — binds engineers and AI agents  
**Authority:** Subordinate to `001_PROJECT_CHARTER.md`

**Onboarding summary:** [`AI_CONTEXT.md`](../AI_CONTEXT.md) — platform laws, architecture, contributing conventions. This document expands **engineering law** not duplicated there.

---

## 1. Software engineering

### 1.1 Modular monolith

- Bounded modules under `ui/src/modules/` and `api/src/modules/`
- Platform services shared; modules reference platform ids — never fork taxonomies
- No microservices until traffic and team size justify operational cost

### 1.2 Production-ready only

- No placeholder features in public paths
- Graceful degradation when data is missing — never unhandled 500s on angler pages
- Reuse existing code and conventions before adding abstractions

### 1.3 Minimize diff scope

- Solve the stated problem; do not refactor adjacent code without cause
- Prefer the simplest correct implementation

### 1.4 Bilingual by design

- Turkish and English are independently authored angler language — not machine translation
- See `docs/fishing/LOCALIZATION_GUIDE.md` (rules summary in `AI_CONTEXT.md`)

### 1.5–1.8 Platform laws

Trust over inference, feature gate, lexicon-first, and Species → Technique → Lure are defined in [`AI_CONTEXT.md` § Core Product Philosophy](../AI_CONTEXT.md#core-product-philosophy). Authoritative fishing docs: `docs/fishing/`.

### 1.9 Dependencies

- Prefer maintained packages with TypeScript types
- New native dependencies require justification in PR
- Lockfile committed; critical CVEs block merge

---

## 2. Domain modeling — do not over-model

**Platform design principle:** Do not over-model fishing knowledge.

### 2.1 Model only what the product needs now

Only model concepts **required by the current product**. Keep the domain simple.

| Model now (examples) | Defer until product requires |
|----------------------|------------------------------|
| `FishSpecies`, `Technique`, `LureModel` | Sub-techniques, technique hierarchies beyond parent id |
| Catch Report: species + technique + lure | Advanced rigging templates, leader setups as first-class entities |
| `LureSpecies` catalog tags | Per-presentation effectiveness matrices |
| Lexicon preferred + aliases | Full rigging ontology, speed-range applications |

### 2.2 Extensible, not premature

Design every entity to be **extensible** — nullable fields, typed association kinds, stable slugs, editorial notes — but do **not** populate future dimensions until a sprint explicitly needs them.

Future details should be added **only when they become necessary**:

- Sub-techniques
- Advanced rigging (leader setups, knot transitions)
- Lure presentations (retrieve cadence, trolling patterns)
- Speed/depth bands as separate aggregate tables
- Environmental condition taxonomies beyond catch-report fields

**Prefer evolutionary design over premature complexity.**

### 2.3 Easy to understand

The platform must remain easy to understand for **both anglers and developers**.

| Audience | Simplicity test |
|----------|-----------------|
| **Anglers** | Can they answer “what lure, for what fish, how?” without jargon overload? |
| **Developers** | Can a new engineer trace Species → Technique → Lure in one reading? |

If a model requires a diagram to explain its daily use, it is probably too early to build.

### 2.4 Relationship to `007_DATABASE_VISION.md`

`007` describes the long-horizon business model. **Not every entity in `007` belongs in the schema today.** Implement slices as product sprints demand them. `007` is the map; the codebase is the territory walked so far.

When adding schema:

1. Name the **current product requirement** (user story or sprint)
2. Confirm no simpler existing entity can carry the data
3. Add the minimum table/fields with extension points
4. Document deferrals explicitly

### 2.5 Forbidden patterns

| Forbidden | Why |
|-----------|-----|
| Building full `007` ontology “for completeness” | Premature complexity |
| City-level regional names, presentation matrices | Maintenance burden (see taxonomy policy) |
| Generic JSON blobs instead of typed fields **when the product already needs the type** | Loses queryability |
| Typed fields for concepts **no UI or workflow uses yet** | Over-modeling |

---

## 3. Repository and layout

See [`AI_CONTEXT.md` § Architecture](../AI_CONTEXT.md#architecture) for current repo layout and contributing conventions.

- `research/` never imported at runtime by production API
- Forward-only migrations; idempotent seeds

---

## 4. AI and agents

See [`AI_CONTEXT.md` § Things AI Must Never Do](../AI_CONTEXT.md#things-ai-must-never-do). Cursor binding rules: `010_CURSOR_RULES.md`.

---

## 5. Security

- Secrets in environment variables — **never** in repository
- PII minimal; contributor email not public
- Signed uploads; MIME allowlist; EXIF strip default
- RBAC on moderator and Studio routes
- Append-only audit where applicable

---

## 6. Related documents

| Document | Role |
|----------|------|
| [`AI_CONTEXT.md`](../AI_CONTEXT.md) | Onboarding summary |
| `003_MASTER_CONTEXT.md` | Domain narrative |
| `007_DATABASE_VISION.md` | Long-horizon model (not all implemented) |
| `docs/fishing/TERMINOLOGY.md` | Vocabulary law |
| `docs/fishing/SPECIES_TECHNIQUE_LURE_POLICY.md` | Compatibility triple |
| `010_CURSOR_RULES.md` | Agent binding rules |

---

*Evolutionary design: simple now, extensible always, complex only when earned.*
