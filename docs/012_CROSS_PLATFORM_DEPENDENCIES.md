# Cross-Platform Dependency Policy

**Document:** 012_CROSS_PLATFORM_DEPENDENCIES  
**Project:** TrollMatch  
**Status:** Active

---

This project is developed on Windows and deployed to Linux.

The root `package.json` declares supported OS/CPU targets so npm includes optional native bindings for all supported platforms inside `package-lock.json`.

When dependencies change:

1. Delete `package-lock.json`
2. Delete `node_modules`
3. Run `npm install`
4. Commit the regenerated `package-lock.json`

Do not regenerate the lockfile over an existing `node_modules` tree.
