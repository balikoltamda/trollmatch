import type { ManufacturerImporter } from "./manufacturer-importer";

/**
 * Central registry for all supported manufacturer importers.
 * Register manufacturers here — not in `scripts/run-import.ts`.
 */
export class ManufacturerRegistry {
  private readonly importers = new Map<string, ManufacturerImporter>();
  private defaultCode = "duel";

  register(importer: ManufacturerImporter): this {
    if (this.importers.has(importer.code)) {
      throw new Error(`Manufacturer importer already registered: ${importer.code}`);
    }

    this.importers.set(importer.code, importer);
    return this;
  }

  setDefault(code: string): this {
    if (!this.importers.has(code)) {
      throw new Error(`Cannot set default — manufacturer not registered: ${code}`);
    }

    this.defaultCode = code;
    return this;
  }

  get(code: string): ManufacturerImporter | undefined {
    return this.importers.get(code);
  }

  has(code: string): boolean {
    return this.importers.has(code);
  }

  list(): ManufacturerImporter[] {
    return [...this.importers.values()];
  }

  listCodes(): string[] {
    return [...this.importers.keys()].sort();
  }

  getDefaultCode(): string {
    return this.defaultCode;
  }

  resolveCodes(input: { manufacturers: string[]; all: boolean }): string[] {
    if (input.all) {
      return this.listCodes();
    }

    if (input.manufacturers.length > 0) {
      return input.manufacturers;
    }

    return [this.defaultCode];
  }

  resolveMany(codes: string[]): ManufacturerImporter[] {
    const resolved: ManufacturerImporter[] = [];

    for (const code of codes) {
      const importer = this.get(code);
      if (!importer) {
        const available = this.listCodes().join(", ");
        throw new Error(
          `Unknown manufacturer "${code}". Registered manufacturers: ${available}`,
        );
      }

      resolved.push(importer);
    }

    return resolved;
  }
}

export function createManufacturerRegistry(): ManufacturerRegistry {
  return new ManufacturerRegistry();
}
