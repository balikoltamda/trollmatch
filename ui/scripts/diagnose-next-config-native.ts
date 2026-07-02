/**
 * Temporary diagnostic — reproduce next.config.ts load and print full native errors.
 * Run: npx tsx scripts/diagnose-next-config-native.ts
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uiRoot = join(__dirname, "..");
const require = createRequire(join(uiRoot, "package.json"));

type Probe = {
  label: string;
  load: () => unknown;
};

function formatError(error: unknown, depth = 0): string {
  if (error instanceof Error) {
    const indent = "  ".repeat(depth);
    const parts = [
      `${indent}name: ${error.name}`,
      `${indent}message: ${error.message}`,
      error.cause
        ? `${indent}cause:\n${formatError(error.cause, depth + 1)}`
        : undefined,
      depth === 0 && error.stack
        ? `${indent}stack:\n${error.stack}`
        : undefined,
    ];
    return parts.filter(Boolean).join("\n");
  }

  return String(error);
}

function probeModule(probe: Probe): void {
  console.log(`\n=== PROBE: ${probe.label} ===`);
  try {
    const loaded = probe.load();
    console.log(
      "OK",
      typeof loaded === "object" && loaded !== null
        ? Object.keys(loaded as object)
        : typeof loaded,
    );
  } catch (error) {
    console.error("FAILED");
    console.error(formatError(error));
  }
}

function installRequireTracer(): void {
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function (this: NodeModule, id: string) {
    const nativeTargets = [
      "@swc/core",
      "@tailwindcss/oxide",
      "unrs-resolver",
      "@parcel/watcher",
    ];
    for (const target of nativeTargets) {
      if (id === target || id.includes(target)) {
        console.log(`[require trace] ${id}`);
        console.log(`  from: ${this.filename ?? "(unknown)"}`);
      }
    }
    return originalRequire.apply(this, arguments as unknown as [string]);
  };
}

const probes: Probe[] = [
  {
    label: "next-intl/plugin",
    load: () => require("next-intl/plugin"),
  },
  {
    label: "@swc/core (next-intl dependency)",
    load: () => require("@swc/core"),
  },
  {
    label: "@parcel/watcher",
    load: () => require("@parcel/watcher"),
  },
  {
    label: "@tailwindcss/postcss -> @tailwindcss/oxide",
    load: () => require("@tailwindcss/postcss"),
  },
  {
    label: "unrs-resolver (eslint-import-resolver-typescript)",
    load: () => require("unrs-resolver"),
  },
];

async function main(): Promise<void> {
  console.log("Platform:", process.platform, process.arch);
  console.log("Node:", process.version);
  console.log("cwd:", uiRoot);

  for (const probe of probes) {
    probeModule(probe);
  }

  console.log("\n=== PROBE: Next.js loadConfig (same path as next build) ===");
  installRequireTracer();
  try {
    process.chdir(uiRoot);
    const loadConfig = require("next/dist/server/config").default as (
      phase: string,
      dir: string,
      opts?: { silent?: boolean },
    ) => Promise<unknown>;
    const { PHASE_PRODUCTION_BUILD } = require("next/constants") as {
      PHASE_PRODUCTION_BUILD: string;
    };
    await loadConfig(PHASE_PRODUCTION_BUILD, uiRoot, { silent: false });
    console.log("OK loadConfig completed");
  } catch (error) {
    console.error("FAILED loadConfig");
    console.error(formatError(error));
  }

  console.log("\n=== PROBE: @swc/core optional binding packages present ===");
  const swcCorePkg = require("@swc/core/package.json") as {
    version: string;
    optionalDependencies?: Record<string, string>;
  };
  console.log("@swc/core version:", swcCorePkg.version);
  for (const [name, version] of Object.entries(
    swcCorePkg.optionalDependencies ?? {},
  )) {
    if (!name.includes(process.platform.replace("win32", "win32"))) {
      // show linux bindings on all platforms for CI diagnosis
    }
    try {
      require.resolve(name, { paths: [join(uiRoot, "node_modules/@swc/core")] });
      console.log(`  INSTALLED: ${name}@${version}`);
    } catch {
      console.log(`  MISSING:   ${name}@${version}`);
    }
  }
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
