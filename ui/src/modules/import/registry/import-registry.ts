import type { PrismaClient } from "@/generated/prisma/client";
import type { ImportSummary } from "../persistence/types";

/** Options passed from the CLI to a registered catalog importer. */
export type CatalogImporterRunOptions = {
  prisma: PrismaClient;
  argv?: string[];
};

/** Result of a registered catalog import run. */
export type CatalogImporterRunResult = {
  providerCode: string;
  summary: ImportSummary;
  success: boolean;
};

/**
 * Runnable catalog importer registered for CLI dispatch.
 * Manufacturers register here without changing `scripts/run-import.ts`.
 */
export interface CatalogImporter {
  readonly code: string;
  readonly displayName: string;
  run(options: CatalogImporterRunOptions): Promise<CatalogImporterRunResult>;
}

/**
 * Registry of catalog importers keyed by provider code.
 */
export class ImportRegistry {
  private readonly importers = new Map<string, CatalogImporter>();
  private defaultCode = "duel";

  register(importer: CatalogImporter): this {
    if (this.importers.has(importer.code)) {
      throw new Error(`Import provider already registered: ${importer.code}`);
    }
    this.importers.set(importer.code, importer);
    return this;
  }

  setDefault(code: string): this {
    if (!this.importers.has(code)) {
      throw new Error(`Cannot set default — provider not registered: ${code}`);
    }
    this.defaultCode = code;
    return this;
  }

  get(code: string): CatalogImporter | undefined {
    return this.importers.get(code);
  }

  has(code: string): boolean {
    return this.importers.has(code);
  }

  list(): Array<{ code: string; displayName: string }> {
    return [...this.importers.values()].map((importer) => ({
      code: importer.code,
      displayName: importer.displayName,
    }));
  }

  getDefaultCode(): string {
    return this.defaultCode;
  }

  resolve(code?: string): CatalogImporter {
    const resolved = code?.trim() || process.env.IMPORT_PROVIDER?.trim() || this.defaultCode;
    const importer = this.get(resolved);

    if (!importer) {
      const available = this.list().map((entry) => entry.code).join(", ");
      throw new Error(
        `Unknown import provider "${resolved}". Registered providers: ${available || "(none)"}`,
      );
    }

    return importer;
  }
}

export function createImportRegistry(): ImportRegistry {
  return new ImportRegistry();
}
