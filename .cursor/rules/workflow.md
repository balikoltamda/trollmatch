# Workflow Rules

- Always modify real project files.
- Always save every modified file to disk.
- Never leave completed work only in chat.
- **Every commit must produce a deployable application.** Before committing, always run `npm run verify` (lint → typecheck → build). A commit that does not build is incomplete — do not push broken commits.
- When npm dependencies change, follow `docs/012_CROSS_PLATFORM_DEPENDENCIES.md`: delete `package-lock.json` and `node_modules`, then run `npm install`. Never regenerate the lockfile over an existing `node_modules` tree. Run `npm run verify:lockfile` before committing dependency changes.
- At the end of every task report:
  - Modified files
  - Approximate word count (documents)
  - Status: Completed / Partial / Blocked
- Never ask for permission after completing a requested task.
