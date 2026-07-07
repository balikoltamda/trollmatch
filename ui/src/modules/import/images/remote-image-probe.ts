export type RemoteImageProbe = {
  mimeType: string | null;
  widthPx: number | null;
  heightPx: number | null;
};

function parseSvgDimensions(svg: string): { width: number | null; height: number | null } {
  const widthMatch = svg.match(/\bwidth=["']?(\d+)/i);
  const heightMatch = svg.match(/\bheight=["']?(\d+)/i);
  const viewBoxMatch = svg.match(/viewBox=["']?\d+\s+\d+\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i);
  const width = widthMatch
    ? Number.parseInt(widthMatch[1] ?? "", 10)
    : viewBoxMatch
      ? Number.parseInt(viewBoxMatch[1] ?? "", 10)
      : null;
  const height = heightMatch
    ? Number.parseInt(heightMatch[1] ?? "", 10)
    : viewBoxMatch
      ? Number.parseInt(viewBoxMatch[2] ?? "", 10)
      : null;
  return {
    width: Number.isFinite(width) ? width : null,
    height: Number.isFinite(height) ? height : null,
  };
}

/** Probe remote image metadata without downloading the full asset. */
export async function probeRemoteImageMetadata(
  url: string,
  fetchFn: typeof fetch = fetch,
): Promise<RemoteImageProbe> {
  const trimmed = url.trim();
  try {
    const head = await fetchFn(trimmed, { method: "HEAD", redirect: "follow" });
    const contentType =
      head.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ??
      null;

    if (contentType === "image/svg+xml") {
      const response = await fetchFn(trimmed, { redirect: "follow" });
      const text = await response.text();
      const dims = parseSvgDimensions(text.slice(0, 4096));
      return {
        mimeType: contentType,
        widthPx: dims.width,
        heightPx: dims.height,
      };
    }

    return { mimeType: contentType, widthPx: null, heightPx: null };
  } catch {
    return { mimeType: null, widthPx: null, heightPx: null };
  }
}
