# Cursor Rules

**Document:** 010_CURSOR_RULES  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Status:** Sprint 0 — Agent and developer rules for Cursor IDE  
**Extends:** `.cursor/rules/project.md` and specialized rule files under `.cursor/rules/`

---

## 1. Purpose

Cursor AI agents and developers using Cursor must produce code and documentation aligned with Balık Oltamda Guide’s **data quality**, **trust**, and **modular architecture** mission—not generic web app patterns.

These rules bind all automated edits unless the user explicitly overrides in a task prompt.

---

## 2. Mandatory Reading Order

Before **any production code** change, read in order:

1. `docs/000_DISCOVERY.md`
2. `docs/001_PROJECT_CHARTER.md`
3. `docs/002_ENGINEERING_PRINCIPLES.md`
4. `docs/003_MASTER_CONTEXT.md`
5. `docs/004_DECISIONS.md`

Before **database, API, or LureAtlas** work, also read:

6. `docs/006_SYSTEM_ARCHITECTURE.md`
7. `docs/007_DATABASE_VISION.md`
8. `docs/008_TECH_STACK.md`

Before **domain terminology** in user-facing copy or types:

9. `docs/011_GLOSSARY.md` (when populated)

**Task prompts must name the module** (e.g., `platform/trust`, `lure-atlas`, `moderation`) and explicit non-goals.

---

## 3. Project Identity (Do Not Drift)

| Correct | Wrong |
|---------|-------|
| Public: **Balık Oltamda Guide** | Calling the public site “TrollMatch” |
| Internal repo: **TrollMatch** | Renaming repo folders without ADR |
| First module: **LureAtlas** | “Fishing app” generic scope |
| Entities: **LureAtlas Model**, **Knowledge Claim**, **Provenance Attribution** | Legacy vague names unless mapping documented in `007` |

Platform is **not e-commerce**. Never add cart, checkout, inventory, or payment tables.

---

## 4. Repository Layout Law

Only these top-level code directories unless ADR amends:

| Path | Purpose |
|------|---------|
| `api/` | REST server + workers |
| `ui/` | Next.js |
| `shared/` | Types, Zod schemas |
| `database/migrations/` | Forward SQL migrations |
| `database/seeds/` | Idempotent seed data |
| `research/` | Evidence **never imported at runtime** by production API |

Do **not** create `backend/`, `services/`, `src/` at root, or duplicate module trees.

---

## 5. Architecture Rules for Agents

### 5.1 Modular Monolith

- LureAtlas code under `api/src/modules/lure-atlas/` and matching UI routes.
- Platform services under `api/src/platform/`—no lure-specific filters in platform search kernel.
- Cross-module references use platform canonical ids only.

### 5.2 Trust Model

- All canonical catalog facts flow through **Knowledge Claim** + **Provenance Attribution**.
- Publish transitions require **Data Quality Assessment** pass—no shortcut endpoints.
- **Verification Event** required when promoting AI Suggestion text to published Localized Text or claims.
- Never auto-publish from ingestion or AI without Moderation Case resolution + audit log entry.

### 5.3 Projections

- Public search reads **Meilisearch**, not PostgreSQL full table scans for faceted browse.
- On publish, write **Domain Event Outbox** in same transaction as lifecycle change.
- Never index `pending_review` or `draft` entities in public search or RAG corpus.

### 5.4 Sponsored Links

- Ranking and sort functions must not accept sponsored parameters.
- Sponsored UI is a separate component reading Commerce service after organic results.

---

## 6. Coding Rules for Agents

- **TypeScript strict** only in `api/`, `ui/`, `shared/`.
- Validate all request bodies with **Zod** at HTTP boundary.
- State transitions via named services—no ad hoc `UPDATE lifecycle_state` in random handlers.
- Turkish strings: never raw `toLowerCase()` for slugs—use locale utilities (ADR-011).
- Shared types live in `shared/`—do not duplicate lure types in ui and api separately.
- Prefer **edit over rewrite**; do not reformat unrelated files.
- No `TODO` on provenance, audit, or moderation paths—implement or do not merge.

---

## 7. Database Rules for Agents

- Migrations in `database/migrations/` only—linear, reviewed.
- Schemas: `platform`, `lure_atlas`, `audit`.
- Metric canonical storage (mm, g, Celsius, knots for Speed Range).
- Soft deprecate catalog entities—no hard delete of published models.
- Entity merge must write **Entity Merge Record** + **Slug Redirect Entry**.
- See `007` relationship law for Geographic Context, Catch Report derivation, species association kinds.

---

## 8. API Rules for Agents

- Public routes under `/v1/lure-atlas/` or `/v1/platform/`.
- OpenAPI examples must include provenance fields on detail responses.
- Cursor pagination for lists; compare endpoint max four model ids server-enforced.
- Rate limit contributor write and AI endpoints in middleware.

---

## 9. UI Rules for Agents

- Provenance and verification badges visible on lure detail without hidden accordion default.
- Sponsored links visually distinct with disclosure text from **Disclosure Policy Version**.
- Locale fallback behavior per `007` §4.6—show “translation pending” label, not blank.
- Moderator routes require role check server-side.
- Mobile-first; touch targets for filter chips.

---

## 10. AI Rules for Agents

- Public AI: RAG over published corpus only; **Retrieval Citation Link** on segments.
- CI uses stub provider—no live OpenAI in tests.
- Store `prompt_template_id`, `model_id`, `corpus_snapshot_id` on AI Suggestion and Response Segment.
- Do not send contributor PII or private moderator notes to LLM without documented consent flag.
- Feature flag `FEATURE_AI_DISCOVERY` gates public assistant.

---

## 11. Security Rules for Agents

- Never commit secrets, `.env` values, or API keys—use `.env.example` placeholders only.
- Sanitize markdown in community narratives.
- Strip EXIF on image upload by default.
- Append-only audit log—no silent deletes.

---

## 12. Testing Rules for Agents

- Add tests for lifecycle transitions and provenance validation when touching trust code.
- Use realistic Turkish + English fixtures (species names, manufacturer names).
- AI tests use deterministic stubs.
- Do not call live Meilisearch/OpenAI in CI without testcontainers/stubs.

---

## 13. Documentation Rules for Agents

- New domain terms → update `011_GLOSSARY.md` when instructed or in same PR as feature.
- Architectural behavior change → ADR in `004_DECISIONS.md`.
- Do not create random new docs in `docs/` unless user requests.
- Comments explain **why** (moderation rules, locale edge cases)—not restate code.

---

## 14. Git and PR Rules for Agents

- Do not commit unless user explicitly asks.
- Do not force-push `main`.
- PR titles: `lure-atlas: description` or `platform/trust: description`.
- Reference backlog id when applicable (`BL-0xx`).
- Split large features: migration PR, API PR, UI PR per engineering principles.

Agents **do not merge their own PRs**—human review required.

---

## 15. Backlog Alignment

When implementing features, map work to `005_BACKLOG.md` ids. Sprint 1 focuses **Phase A** platform kernel unless user directs otherwise.

Do not implement Phase 6 AI or sponsored links before publish/outbox/moderation paths exist unless explicitly tasked.

---

## 16. Specialized Rule Files

Files under `.cursor/rules/` extend this document:

| File | Focus |
|------|-------|
| `project.md` | Read order summary |
| `architecture.md` | Component boundaries |
| `coding.md` | TypeScript conventions |
| `database.md` | Migration and schema |
| `security.md` | Auth, upload, secrets |
| `ui.md` | UX and accessibility |
| `performance.md` | LCP, N+1, index |
| `ai.md` | RAG, citations, flags |

When specialized files empty, **this document and `002` govern**. On conflict: `001` charter > `002` engineering > `010` cursor > specialized file.

---

## 17. Prohibited Agent Behaviors

1. Scraping `research/` into production tables at request time  
2. Presenting AI output as community or manufacturer verified  
3. Adding e-commerce patterns  
4. Undifferentiated species tags (must use `association_kind`)  
5. Skipping audit log on moderation approve  
6. Creating placeholder TODO documentation in `docs/` without content  
7. Shrinking entity model in `007` without Chief Database Architect approval  
8. Indexing unpublished content in Meilisearch  

---

## 18. Example Good Task Prompt

```
Module: lure-atlas ingestion
Read: 003, 004, 006, 007, 008
Goal: BL-025 manufacturer batch importer
Non-goals: no AI auto-publish, no cart, no GraphQL
Deliver: idempotent script + Ingestion Batch records + draft models only
```

---

## 19. Example Bad Task Prompt

```
Build the fishing shop with AI recommendations and user uploads
```

Reason: scope unbounded; violates charter; invites architecture drift.

---

## 20. Amendment

Changes to this document require product + technical lead acknowledgment. Agents use the version committed on the branch they execute against.

---

*Cursor rules ratified Sprint 0. Human reviewers enforce via `002` code review checklist.*
