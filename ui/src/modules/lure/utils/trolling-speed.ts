const KNOT_TO_KMH = 1.852;

function formatKnotValue(knots: number): string {
  return Number.isInteger(knots) ? String(knots) : knots.toFixed(1);
}

function formatKmhValue(knots: number): string {
  return (knots * KNOT_TO_KMH).toFixed(1);
}

/** Display trolling speed as "7 knot (13.0 km/h)" with km/h always beside knot. */
export function formatTrollingSpeedRange(minKnots: number, maxKnots: number): string {
  const min = Math.min(minKnots, maxKnots);
  const max = Math.max(minKnots, maxKnots);

  if (min === max) {
    return `${formatKnotValue(min)} knot (${formatKmhValue(min)} km/h)`;
  }

  return `${formatKnotValue(min)}–${formatKnotValue(max)} knot (${formatKmhValue(min)}–${formatKmhValue(max)} km/h)`;
}

export function hasTrollingSpeed(
  speedKnots: { min: number; max: number } | undefined,
): boolean {
  if (!speedKnots) {
    return false;
  }

  return speedKnots.min > 0 || speedKnots.max > 0;
}
