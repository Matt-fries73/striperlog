import { TripWeather } from "@/lib/TripWeather";

/**
 * Convert wind direction in degrees to a compass cardinal (e.g., "N", "NE", "SW").
 */
function degToCardinal(deg: number | null): string | null {
  if (deg === null || deg === undefined || isNaN(deg)) return null;

  const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW"
  ];

  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

/**
 * Convert meters/second → knots (1 m/s = 1.94384 kts)
 */
function mpsToKnots(mps: number | null): number | null {
  if (mps === null || mps === undefined || isNaN(mps)) return null;
  return parseFloat((mps * 1.94384).toFixed(1));
}

/**
 * Fetch historical weather for latitude, longitude, and time using Open-Meteo.
 */
export async function fetchWeatherForTrip(
  lat: number,
  lon: number,
  startedAtISO: string
): Promise<TripWeather | null> {

  // 1) Parse time
  const tripTime = new Date(startedAtISO);
  if (isNaN(tripTime.getTime())) {
    console.error("Invalid date passed to fetchWeatherForTrip:", startedAtISO);
    return null;
  }

  // Open-Meteo expects a date range. We request the entire day of the trip.
  const yyyy = tripTime.getUTCFullYear();
  const mm = String(tripTime.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(tripTime.getUTCDate()).padStart(2, "0");

  const dateStr = `${yyyy}-${mm}-${dd}`;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,winddirection_10m,windspeed_10m&timezone=UTC&start_date=${dateStr}&end_date=${dateStr}`;

  let json: any;

  try {
    const res = await fetch(url, { cache: "no-store" });
    json = await res.json();
  } catch (err) {
    console.error("Weather fetch failed:", err);
    return null;
  }

  if (!json || !json.hourly || !json.hourly.time) {
    console.error("Unexpected weather API shape:", json);
    return null;
  }

  // Extract arrays
  const { time, windspeed_10m, winddirection_10m, temperature_2m } = json.hourly;

  // Find the hourly index closest to the trip's start time
  let closestIndex = 0;
  let closestDiff = Infinity;

  for (let i = 0; i < time.length; i++) {
    const readingTime = new Date(time[i]).getTime();
    const diff = Math.abs(readingTime - tripTime.getTime());
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }

  // Extract values from the closest hour
  const readingISO = time[closestIndex] ?? null;
  const windDeg = winddirection_10m[closestIndex] ?? null;
  const windSpeedMS = windspeed_10m[closestIndex] ?? null;
  const tempC = temperature_2m[closestIndex] ?? null;

  const weather: TripWeather = {
    timestamp: readingISO,
    windSpeedKts: mpsToKnots(windSpeedMS),
    windDirDeg: windDeg,
    windDirCardinal: degToCardinal(windDeg),
    airTempF: tempC !== null ? parseFloat(((tempC * 9) / 5 + 32).toFixed(1)) : null,
    conditions: null, // Open-Meteo v1 doesn’t include a simple condition. We add this in E1.1.
    raw: json,
  };

  return weather;
}