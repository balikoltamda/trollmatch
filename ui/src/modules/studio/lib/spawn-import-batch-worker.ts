import { spawn } from "node:child_process";
import { resolve } from "node:path";

/**
 * Starts a detached child process so import work survives HTTP request completion
 * and browser navigation.
 */
export function spawnImportBatchWorker(batchId: string): void {
  const cwd = process.cwd();
  const script = resolve(cwd, "scripts/run-import-batch.ts");
  const isWindows = process.platform === "win32";

  const child = spawn(
    isWindows ? "npx.cmd" : "npx",
    ["tsx", script, batchId],
    {
      cwd,
      detached: true,
      stdio: "ignore",
      env: process.env,
      windowsHide: true,
    },
  );

  child.unref();
}
