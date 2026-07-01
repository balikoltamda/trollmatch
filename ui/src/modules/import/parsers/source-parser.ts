import type {
  ImportContext,
  ImportSourceFormat,
  ImportSourceInput,
} from "../core/types";
import type { ParseResult } from "./parse-result";

/**
 * Converts a manufacturer-specific raw source into normalized RawImportRecord rows.
 * Each provider implements one or more parsers for its supported formats.
 */
export interface SourceParser<TPayload = unknown> {
  readonly supportedFormats: ImportSourceFormat[];

  parse(
    input: ImportSourceInput<TPayload>,
    context: ImportContext,
  ): Promise<ParseResult>;
}

/** Optional capability: parser can peek at payload without full parse. */
export interface SourceFormatDetector {
  detectFormat(payload: unknown): ImportSourceFormat | null;
}

/** Factory for provider-scoped parsers (e.g. HalcoJsonParser implements SourceParser). */
export interface SourceParserFactory {
  createParser(format: ImportSourceFormat): SourceParser | undefined;
}
