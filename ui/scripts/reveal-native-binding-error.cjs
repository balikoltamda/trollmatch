/**
 * Temporary diagnostic — print full error chain when @swc/core binding is missing.
 * Reproduces Linux CI failure path: next.config.ts -> next-intl/plugin -> @swc/core.
 * Run: node scripts/reveal-native-binding-error.cjs
 */
const Module = require("module");
const path = require("path");

const uiRoot = __dirname.replace(/[\\/]scripts$/, "");
const origRequire = Module.prototype.require;

// Block platform binding (mirrors npm optional-dep omission on Linux CI)
const blockedBinding =
  process.platform === "win32"
    ? "@swc/core-win32-x64-msvc"
    : process.platform === "linux"
      ? process.arch === "arm64"
        ? "@swc/core-linux-arm64-musl"
        : "@swc/core-linux-x64-musl"
      : null;

Module.prototype.require = function (id) {
  if (blockedBinding && (id === blockedBinding || id.includes(blockedBinding))) {
    const err = new Error(`Cannot find module '${id}'`);
    err.code = "MODULE_NOT_FOUND";
    throw err;
  }
  return origRequire.apply(this, arguments);
};

function printErrorChain(error, depth = 0) {
  if (!(error instanceof Error)) {
    console.error(`${"  ".repeat(depth)}${String(error)}`);
    return;
  }
  const pad = "  ".repeat(depth);
  console.error(`${pad}[${error.name}] ${error.message}`);
  if (error instanceof Error && "code" in error && error.code) {
    console.error(`${pad}code: ${error.code}`);
  }
  if (error.cause) {
    printErrorChain(error.cause, depth + 1);
  }
  if (depth === 0 && error.stack) {
    console.error("\n--- stack ---");
    console.error(error.stack);
  }
}

async function main() {
  process.chdir(uiRoot);
  console.log("Platform:", process.platform, process.arch);
  console.log("Blocking binding package:", blockedBinding ?? "(none — adjust script)");
  console.log("Trigger: Next.js loadConfig -> next.config.ts -> next-intl/plugin -> @swc/core\n");

  const loadConfig = require("next/dist/server/config").default;
  const { PHASE_PRODUCTION_BUILD } = require("next/constants");
  await loadConfig(PHASE_PRODUCTION_BUILD, uiRoot, { silent: false });
}

main().catch((error) => {
  console.error("\n=== Full underlying exception (not generic Next.js wrapper) ===\n");
  printErrorChain(error);
  process.exit(1);
});
