# Workflow Rules

- Always modify real project files.
- Always save every modified file to disk.
- Never leave completed work only in chat.
- When npm dependencies change, follow `docs/012_CROSS_PLATFORM_DEPENDENCIES.md`: delete `package-lock.json` and `node_modules`, then run `npm install`. Never regenerate the lockfile over an existing `node_modules` tree.
- At the end of every task report:
  - Modified files
  - Approximate word count (documents)
  - Status: Completed / Partial / Blocked
- Never ask for permission after completing a requested task.
