# TrollMatch

**Public platform:** [Balık Oltamda Guide](https://guide.balikoltamda.net) (planned)  
**Repository:** Private — fishing knowledge platform engineering home for Balık Oltamda

## Documentation hierarchy

```
README.md          ← you are here (human entry)
    ↓
AI_CONTEXT.md      ← onboarding: vision, architecture, laws, current sprint
    ↓
docs/              ← specialized: charter, ADRs, lexicon, sprint records
```

| Audience | Start here |
|----------|------------|
| **Humans** | Quick start below, then [`AI_CONTEXT.md`](AI_CONTEXT.md) |
| **AI agents** | [`AI_CONTEXT.md`](AI_CONTEXT.md) first — always |

## Quick start

See [`AI_CONTEXT.md` § Getting Started](AI_CONTEXT.md#getting-started-dev) for full commands and env setup.

```bash
npm install
npm run db:up
npm run db:migrate
npm run dev            # http://localhost:3000/tr
```

Verify before commit: `npm run verify`

## Specialized docs

Binding scope and governance: [`docs/001_PROJECT_CHARTER.md`](docs/001_PROJECT_CHARTER.md)  
Architectural memory (do not revisit lightly): [`docs/KNOWN_DECISIONS.md`](docs/KNOWN_DECISIONS.md)  
Sprint history: [`docs/CHANGELOG.md`](docs/CHANGELOG.md)  
Sprint delivery record: [`docs/010_ANGLER_PRODUCT.md`](docs/010_ANGLER_PRODUCT.md)  
Engineering sprints (commit log): [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md)
