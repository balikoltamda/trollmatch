/** Discriminated result for public data fetchers — never throw to pages. */
export type DataFetchResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_found" }
  | { status: "unavailable" };

export function isOk<T>(
  result: DataFetchResult<T>,
): result is { status: "ok"; data: T } {
  return result.status === "ok";
}
