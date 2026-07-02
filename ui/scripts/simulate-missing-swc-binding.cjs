/**
 * Temporary diagnostic — simulate missing @swc/core platform binding.
 * Run: node scripts/simulate-missing-swc-binding.cjs
 */
const Module = require("module");
const path = require("path");

const uiRoot = __dirname.replace(/[\\/]scripts$/, "");
const origRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  if (
    id === "@swc/core-win32-x64-msvc" ||
    id.endsWith("swc.win32-x64-msvc.node")
  ) {
    const err = new Error(`Cannot find module '${id}'`);
    err.code = "MODULE_NOT_FOUND";
    throw err;
  }
  return origRequire.apply(this, arguments);
};

async function main() {
  process.chdir(uiRoot);
  const loadConfig = require("next/dist/server/config").default;
  const { PHASE_PRODUCTION_BUILD } = require("next/constants");
  await loadConfig(PHASE_PRODUCTION_BUILD, uiRoot, { silent: false });
}

function format(error, depth = 0) {
  if (!(error instanceof Error)) return String(error);
  const pad = "  ".repeat(depth);
  console.error(`${pad}${error.name}: ${error.message}`);
  if (error.cause) format(error.cause, depth + 1);
  if (depth === 0 && error.stack) console.error(error.stack);
}

main().catch((error) => {
  console.error("\n=== Simulated missing @swc/core binding during loadConfig ===");
  format(error);
  process.exit(1);
});
