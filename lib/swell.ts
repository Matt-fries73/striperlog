// lib/swell.ts
// Fetch surf swell + water temperature for a trip.

export type TripSwell = {
    swellHeightFt: number | null;
    swellPeriodS: number | null;
    swellDirectionDeg: number | null;
    swellDirectionCardinal: string | null;
    waterTempF: number | null;
  };
  
  const OPEN_METEO_MARINE_BASE = "https://marine-api.open-meteo.com/v1/marine";
  
  /**
   * Fetch swell + water temperature for the given trip.
   * We use the trip's startedAt time to pick the closest hourly marine record.
   */
  export async function fetchSwellForTrip(
    lat: number,
    lon: number,
    startedAtIso: string
  ): Promise<TripSwell | null> {
    try {
      const startedAt = new Date(startedAtIso);
      if (Number.isNaN(startedAt.getTime())) {
        console.error("Invalid startedAtIso for swell:", startedAtIso);
        return null;
      }
  
      // Build date in YYYY-MM-DD (UTC) for marine API range
      const yyyy = startedAt.getUTCFullYear();
      const mm = String(startedAt.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(startedAt.getUTCDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
  
      const url =
        `${OPEN_METEO_MARINE_BASE}?latitude=${lat}&longitude=${lon}` +
        `&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature` +
        `&timezone=GMT&start_date=${dateStr}&end_date=${dateStr}`;
  
      const res = await fetch(url);
      if (!res.ok) {
        console.error("Swell API fetch failed:", res.status, await res.text());
        return null;
      }
  
      const json = await res.json();
  
      const times: string[] | undefined = json?.hourly?.time;
      const heights: number[] | undefined = json?.hourly?.wave_height;
      const dirs: number[] | undefined = json?.hourly?.wave_direction;
      const periods: number[] | undefined = json?.hourly?.wave_period;
      const waterTemps: number[] | undefined = json?.hourly?.sea_surface_temperature;
  
      if (!times || times.length === 0) {
        console.warn("No marine hourly data returned for swell.");
        return null;
      }
  
      // Find the index of the hour closest to startedAt
      let bestIndex = 0;
      let bestDiff = Number.POSITIVE_INFINITY;
  
      for (let i = 0; i < times.length; i++) {
        const t = new Date(times[i] + "Z"); // times are ISO-without-Z, assume UTC
        const diff = Math.abs(t.getTime() - startedAt.getTime());
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIndex = i;
        }
      }
  
      const heightM = heights?.[bestIndex] ?? null;
      const dirDeg = dirs?.[bestIndex] ?? null;
      const periodS = periods?.[bestIndex] ?? null;
      const waterTempC = waterTemps?.[bestIndex] ?? null;
  
      const swellHeightFt =
        typeof heightM === "number" ? heightM * 3.28084 : null;
      const waterTempF =
        typeof waterTempC === "number" ? waterTempC * (9 / 5) + 32 : null;
  
      const swellDirectionDeg =
        typeof dirDeg === "number" ? dirDeg : null;
      const swellDirectionCardinal =
        typeof dirDeg === "number" ? degToCardinal(dirDeg) : null;
  
      return {
        swellHeightFt: swellHeightFt != null ? round(swellHeightFt, 2) : null,
        swellPeriodS: periodS != null ? round(periodS, 1) : null,
        swellDirectionDeg,
        swellDirectionCardinal,
        waterTempF: waterTempF != null ? round(waterTempF, 1) : null,
      };
    } catch (err) {
      console.error("fetchSwellForTrip error:", err);
      return null;
    }
  }
  
  function round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
  
  /**
   * Convert direction in degrees (0–360) to a simple cardinal (N, NE, E, etc.)
   */
  function degToCardinal(deg: number): string {
    const dirs = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    const index = Math.round(((deg % 360) / 22.5)) % 16;
    return dirs[index];
  }