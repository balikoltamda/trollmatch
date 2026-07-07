# Tech Stack

**Document:** 008_TECH_STACK  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Status:** Ratified stack (target)  
**Authority:** Implements ADRs in `004_DECISIONS.md`

**Current implementation:** [`AI_CONTEXT.md`](../AI_CONTEXT.md) § Architecture — today: Next.js + Prisma in `ui/`. This document describes **target** stack from ADRs; drift is noted in `PROJECT_STATE.md`.

---

## 1. Stack Summary

| Layer | Choice | Version policy |
|-------|--------|----------------|
| Language | TypeScript | Strict mode; single application language |
| Runtime | Node.js | LTS (22.x at project start) |
| Public UI | Next.js App Router | 15.x |
| API server | Fastify | 5.x (or Hono if team prefers—Fastify default here) |
| Database | PostgreSQL | 16+ |
| Migrations | node-pg-migrate | Linear forward migrations |
| Search | Meilisearch | 1.x |
| Object storage | S3-compatible API | Provider per ADR-015 |
| Auth | Auth.js (NextAuth v5) pattern | Email + Google OAuth |
| Validation | Zod | Shared schemas api ↔ ui |
| ORM / query | Drizzle ORM | Type-safe; SQL escape hatch |
| Job queue | pg-boss | Postgres-backed; no Redis required initially |
| AI | Provider adapter → OpenAI-compatible API | Configurable model env |
| Vector / RAG | pgvector extension OR dedicated embed store | ADR-012 defers; pgvector default for monolith simplicity |
| Email | Resend or SMTP | Transactional only at launch |
| CI | GitHub Actions | lint, typecheck, test, migrate dry-run |
| Containers | Docker + Docker Compose | Dev and prod baseline |
| Reverse proxy | Caddy 2 | Auto TLS |
| Error tracking | Sentry | api + ui |
| Analytics | Plausible or self-hosted Umami | Privacy-respecting; no GPS |

---

## 2. Monorepo Layout

```
trollmatch/
  api/                 # Fastify REST server + workers entrypoints
  ui/                  # Next.js application
  shared/              # Zod schemas, domain types, locale utils
  database/
    migrations/
    seeds/
  research/            # Evidence only (not deployed)
  docs/
  docker-compose.yml
  package.json         # npm workspaces root
```

**Package manager:** npm workspaces (pnpm acceptable via ADR amendment if team prefers). See `012_CROSS_PLATFORM_DEPENDENCIES.md` for lockfile regeneration on Windows → Linux deploys.

---

## 3. TypeScript Configuration

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` where compatible
- Shared types import path: `@trollmatch/shared`
- No `any` at module boundaries; `unknown` + Zod at IO edges
- Domain type names align with `007` and future `011_GLOSSARY.md`

---

## 4. Frontend (`ui/`)

| Concern | Technology |
|---------|------------|
| Framework | Next.js 15 App Router |
| Styling | Tailwind CSS 4 |
| Components | Radix UI primitives + project design tokens |
| i18n routing | `[locale]` segment; `tr`, `en` |
| i18n messages | next-intl or equivalent |
| Data fetching | Server Components + typed fetch to internal API; React Query for client interactive views |
| Forms | React Hook Form + Zod resolver |
| Images | next/image → CDN URLs from Media Asset derivatives |
| SEO | Metadata API, hreflang, JSON-LD (Product inappropriate—use `ItemList` / custom schema per SEO ADR follow-up) |

**Moderator console:** Same app; route group `(moderation)` protected by server-side session role check.

---

## 5. Backend (`api/`)

| Concern | Technology |
|---------|------------|
| HTTP | Fastify 5 |
| Auth middleware | JWT session cookie validation; role guards |
| OpenAPI | `@fastify/swagger` + Zod-to-OpenAPI or manual YAML in `api/openapi/` |
| DB access | Drizzle ORM → PostgreSQL |
| Transactions | `drizzle.transaction()` for publish + outbox |
| Outbox | Custom table + pg-boss job polling |
| File upload | Presigned S3 URLs from `@aws-sdk/client-s3` (compatible with R2/MinIO) |
| Image processing | Sharp |
| Logging | pino JSON |
| Testing | Vitest + testcontainers (postgres, meilisearch) for integration |

**Worker processes:** Same codebase; entrypoint `api/src/workers/index.ts` registering pg-boss handlers.

---

## 6. Data Layer

| Concern | Choice |
|---------|--------|
| RDBMS | PostgreSQL 16 |
| Schemas | `platform`, `lure_atlas`, `audit` |
| UUID | `uuid` v7 via app generator or `pg_uuidv7` extension |
| Full-text fallback | Not primary—Meilisearch for user search |
| Vectors | `pgvector` for RAG embeddings if corpus < few million chunks; re-evaluate Qdrant at scale |
| Collation | ICU Turkish for slug columns (ADR-011) |
| Backups | Daily pg_dump + WAL archiving prod policy (ops runbook) |

---

## 7. Search (Meilisearch)

| Index | Locale | Primary document |
|-------|--------|------------------|
| `lures_tr` | tr | LureAtlas Model projection |
| `lures_en` | en | LureAtlas Model projection |

**Facets:** manufacturer, form_factor, species (curated tags), technique, buoyancy, depth_band, action  

**Synonyms:** Taxonomy Synonym rows pushed to Meilisearch synonym config on taxonomy publish.

---

## 8. Object Storage & CDN

| Bucket | Access | Content |
|--------|--------|---------|
| `guide-media-private` | Signed URLs | Original uploads, pending moderation |
| `guide-media-public` | CDN origin | Processed WebP/AVIF derivatives |

**CDN:** Cloudflare in front of public bucket (recommended) or provider-native CDN.

---

## 9. Authentication

| Method | Use |
|--------|-----|
| Email magic link / password | Primary |
| Google OAuth 2.0 | Social login |

**Session:** HTTP-only cookie; `Secure`; `SameSite=Lax`  

**Library:** Auth.js integrated with Next.js; API validates session via shared session store or signed JWT from auth service.

Platform User ≠ shop PrestaShop account (no SSO v1).

---

## 10. AI Stack

| Component | Implementation |
|-----------|----------------|
| Provider | OpenAI API or Azure OpenAI (enterprise retention) |
| Embeddings | `text-embedding-3-small` or equivalent |
| Chunking | Structured from Knowledge Claim + Localized Text |
| Prompt storage | Git-versioned YAML/JSON in `api/src/platform/ai/prompts/` |
| Runtime registry | Prompt Template table mirrors git ids |
| Public feature flag | Env `FEATURE_AI_DISCOVERY=true` |
| CI | Stub provider; no live API calls in tests |

---

## 11. Infrastructure (Production)

Per ADR-015:

| Component | Initial hosting |
|-----------|-----------------|
| Compute | Hetzner / DigitalOcean VPS 8GB+ RAM |
| OS | Ubuntu LTS |
| Orchestration | Docker Compose |
| TLS | Caddy automatic certificates |
| DNS | guide.balikoltamda.net → VPS (Plesk DNS-only acceptable) |
| Staging | Second VPS or smaller instance |

**Not chosen for v1:** Kubernetes, serverless-only Next.js (needs workers co-located).

---

## 12. Developer Experience

| Tool | Purpose |
|------|---------|
| Docker Compose | postgres, meilisearch, minio, mailpit |
| `.env.example` | Documented variables; no secrets |
| `npm run dev` | ui + api concurrently |
| ESLint + Prettier | Root config |
| Husky | Pre-commit lint (optional Sprint 1) |

### Required environment variables (names only)

```
DATABASE_URL
MEILI_HOST
MEILI_MASTER_KEY
S3_ENDPOINT
S3_ACCESS_KEY
S3_SECRET_KEY
S3_PUBLIC_BUCKET
S3_PRIVATE_BUCKET
AUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
OPENAI_API_KEY
SENTRY_DSN
FEATURE_AI_DISCOVERY
```

---

## 13. Testing Strategy (Stack Level)

| Level | Tool |
|-------|------|
| Unit | Vitest — lifecycle, claims, Turkish slug utils |
| Integration | Vitest + testcontainers — API routes, outbox |
| E2E | Playwright — discover, compare, moderate (staging) |
| Load smoke | k6 script optional pre-release |

---

## 14. Dependencies Policy

Aligns with `002_ENGINEERING_PRINCIPLES.md` §1.9:

- Prefer maintained packages with TypeScript types
- New native deps (Sharp only) justified in PR
- Lockfile committed; Dependabot or Renovate enabled
- Critical CVEs block merge

---

## 15. Deliberately Excluded Technologies

| Excluded | Reason |
|----------|--------|
| GraphQL | ADR-004 REST first |
| Redis (initially) | pg-boss sufficient; add when proven bottleneck |
| PrestaShop module | No shared commerce DB |
| WordPress headless | Custom knowledge model |
| Mobile native | Responsive web per charter |
| Elasticsearch | Meilisearch sufficient for Year 1–2 scale |

---

## 16. Version Pinning

Production Docker images pin minor versions; security patches applied via CI rebuild. Application semver tagged `guide-v*` per engineering git workflow.

---

*Stack ratified Sprint 0. Changes require ADR amendment.*
