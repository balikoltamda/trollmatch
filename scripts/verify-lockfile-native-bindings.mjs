#!/usr/bin/env node
/**
 * Ensures package-lock.json contains installable optional native binding entries
 * for Linux deploy targets (not just optionalDependencies metadata).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = resolve(root, "package-lock.json");

const REQUIRED_ENTRIES = [
  "node_modules/@swc/core-linux-x64-gnu",
  "node_modules/@swc/core-linux-x64-musl",
  "node_modules/@parcel/watcher-linux-x64-glibc",
  "node_modules/@parcel/watcher-linux-x64-musl",
  "node_modules/@tailwindcss/oxide-linux-x64-gnu",
  "node_modules/@tailwindcss/oxide-linux-x64-musl",
  "node_modules/@unrs/resolver-binding-linux-x64-gnu",
  "node_modules/@unrs/resolver-binding-linux-x64-musl",
];

const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const packages = lock.packages ?? {};
const failures = [];

for (const entry of REQUIRED_ENTRIES) {
  const pkg = packages[entry];
  if (!pkg) {
    failures.push(`missing lockfile node: ${entry}`);
    continue;
  }
  if (!pkg.version) {
    failures.push(`${entry}: missing version`);
  }
  if (!pkg.resolved) {
    failures.push(`${entry}: missing resolved URL`);
  }
  if (!pkg.integrity) {
    failures.push(`${entry}: missing integrity`);
  }
  if (!pkg.optional) {
    failures.push(`${entry}: expected optional=true`);
  }
}

if (failures.length > 0) {
  console.error("Lockfile native binding verification failed:\n");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  console.error(
    "\nRegenerate from a clean tree (see docs/012_CROSS_PLATFORM_DEPENDENCIES.md).",
  );
  process.exit(1);
}

console.log(
  `OK: ${REQUIRED_ENTRIES.length} Linux native binding lockfile entries are installable.`,
);
