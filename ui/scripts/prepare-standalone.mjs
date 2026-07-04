#!/usr/bin/env node
/**
 * Next.js standalone output omits .next/static and public/.
 * Copy them into the standalone tree so deployments are self-contained.
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const uiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneRoot = resolve(uiRoot, ".next/standalone");
const staticSrc = resolve(uiRoot, ".next/static");
const staticDest = resolve(standaloneRoot, "ui/.next/static");
const publicSrc = resolve(uiRoot, "public");
const publicDest = resolve(standaloneRoot, "ui/public");

function fail(message) {
  console.error(`prepare-standalone: ${message}`);
  process.exit(1);
}

function assertNonEmptyDir(path, label) {
  if (!existsSync(path)) {
    fail(`${label} missing: ${path}`);
  }
  if (!readdirSync(path).length) {
    fail(`${label} is empty: ${path}`);
  }
}

if (!existsSync(standaloneRoot)) {
  fail("missing .next/standalone — run next build first");
}

if (!existsSync(staticSrc)) {
  fail("missing .next/static — run next build first");
}

mkdirSync(dirname(staticDest), { recursive: true });
cpSync(staticSrc, staticDest, { recursive: true, force: true });

if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true, force: true });
} else {
  mkdirSync(publicDest, { recursive: true });
}

assertNonEmptyDir(staticDest, ".next/standalone/ui/.next/static");
assertNonEmptyDir(publicDest, ".next/standalone/ui/public");

for (const subdir of ["chunks", "css", "media"]) {
  if (!existsSync(resolve(staticDest, subdir))) {
    fail(`standalone static missing required subdirectory: ${subdir}/`);
  }
}

console.log("prepare-standalone: OK");
console.log(`  static → ${staticDest}`);
console.log(`  public → ${publicDest}`);
