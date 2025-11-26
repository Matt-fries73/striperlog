import { TripTide } from "@/lib/TripTide";
import { analyzeTideCycle, TidePoint } from "@/lib/tideCycle";

// NOAA tide predictions API (CO-OPS)
const NOAA_BASE = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

/**
 * Fetch predicted tide heights for a station on a given date.
 * 
 * We request hourly predictions, which is enough resolution
 * for detecting high/low turning points and slope direction.
 */
export async function fetchTidePredictions(
  stationId: string,
  date: string
): Promise<TidePoint[] | null> {
  const url =
    `${NOAA_BASE}?product=predictions&application=STRIPERLOG&format=json&datum=MLLW` +
    `&station=${stationId}&units=english&time_zone=gmt&interval=h` +
    `&begin_date=${date}&end_date=${date}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.predictions) return null;

    return json.predictions.map((p: any) => ({
      time: p.t, // "2023-11-20 06:00"
      heightFt: parseFloat(p.v), // height in feet
    }));
  } catch (err) {
    console.error("NOAA tide fetch failed:", err);
    return null;
  }
}

/**
 * High-level tide enrichment for a trip:
 * - Derives date from startedAt
 * - Fetches hourly predictions
 * - Runs tide-cycle analysis
 */
export async function fetchTideForTrip(
  stationId: string,
  startedAtISO: string
): Promise<TripTide | null> {
  const startedAt = new Date(startedAtISO);
  if (isNaN(startedAt.getTime())) {
    console.error("Invalid startedAt passed to fetchTideForTrip:", startedAtISO);
    return null;
  }

  // Use UTC date for NOAA (YYYYMMDD)
  const yyyy = startedAt.getUTCFullYear();
  const mm = String(startedAt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(startedAt.getUTCDate()).padStart(2, "0");
  const dateStr = `${yyyy}${mm}${dd}`;

  const predictions = await fetchTidePredictions(stationId, dateStr);
  if (!predictions || predictions.length === 0) {
    return null;
  }

  const analysis = analyzeTideCycle(predictions, startedAt);
  if (!analysis) return null;

  return {
    ...analysis,
    stationId,
  };
}
