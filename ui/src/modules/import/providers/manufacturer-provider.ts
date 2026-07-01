/**
 * Re-exports the manufacturer provider contract from core.
 * Future Halco, Rapala, Yo-Zuri, Maria, Shimano providers live under this folder.
 *
 * Example layout (future sprints):
 *   providers/halco/halco-import-provider.ts
 *   providers/rapala/rapala-import-provider.ts
 */
export type {
  ImportProviderMetadata,
  ManufacturerImportProvider,
  ImportProviderRegistry,
} from "../core";
