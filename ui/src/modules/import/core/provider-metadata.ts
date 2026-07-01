import type { ImportSourceFormat, ManufacturerProviderCode } from "./types";

/**
 * Metadata every manufacturer import provider must expose.
 * Used for registry lookup, batch provenance, and moderation case routing.
 */
export interface ImportProviderMetadata {
  /** Stable slug: halco, rapala, yo-zuri, maria, shimano, … */
  providerCode: ManufacturerProviderCode;
  /** Human-readable label for logs and moderation UI. */
  displayName: string;
  /** Target Manufacturer.slug in LureAtlas catalog. */
  manufacturerSlug: string;
  /** Formats this provider's parser accepts. */
  supportedSourceFormats: ImportSourceFormat[];
  /** Provider schema version for forward-compatible migrations. */
  schemaVersion: string;
}
