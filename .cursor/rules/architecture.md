# Architecture Rules

**Current implementation:** [`AI_CONTEXT.md` § Architecture](../../AI_CONTEXT.md#architecture) — repo layout, modules, importer, deployment reality.

Before major structural work, also read `docs/006_SYSTEM_ARCHITECTURE.md` and `docs/004_DECISIONS.md` (ADRs).

Cursor-specific:

- Prefer modular boundaries under `ui/src/modules/`.
- Heavy tasks must be asynchronous (imports, batch jobs).
- Target long-horizon layout in `docs/006` — implement only what the current sprint needs (`AI_CONTEXT.md` § Key data concepts).
