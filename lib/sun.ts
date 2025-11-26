// lib/sun.ts
// Fetch sunrise/sunset from Open-Meteo and classify daylight stage for a trip.

export type TripSun = {
    sunriseUtc: string | null;
    sunsetUtc: string | null;
    daylightStage: string | null; // "night", "pre_dawn", "sunrise", "day", "sunset", "post_sunset"
  };
  
  const OPEN_METEO_SUN_BASE = "https://api.open-meteo.com/v1/forecast";
  
  /**
   * Fetch sunrise/sunset for the given lat/lon and date (UTC) and
   * compute a daylight stage for the trip's start time.
   */
  export async function fetchSunForTrip(
    lat: number,
    lon: number,
    startedAtIso: string
  ): Promise<TripSun | null> {
    try {
      const startedAt = new Date(startedAtIso);
      if (Number.isNaN(startedAt.getTime())) {
        console.error("Invalid startedAtIso for sun:", startedAtIso);
        return null;
      }
  
      // Use the calendar date of the trip's start (in UTC) for sunrise/sunset.
      const yyyy = startedAt.getUTCFullYear();
      const mm = String(startedAt.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(startedAt.getUTCDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
  
      const url =
        `${OPEN_METEO_SUN_BASE}?latitude=${lat}&longitude=${lon}` +
        `&daily=sunrise,sunset&timezone=GMT&start_date=${dateStr}&end_date=${dateStr}`;
  
      const res = await fetch(url);
      if (!res.ok) {
        console.error("Sun API fetch failed:", res.status, await res.text());
        return null;
      }
  
      const json = await res.json();
  
      const sunriseArr: string[] | undefined = json?.daily?.sunrise;
      const sunsetArr: string[] | undefined = json?.daily?.sunset;
  
      const sunriseUtc = sunriseArr && sunriseArr.length > 0 ? sunriseArr[0] : null;
      const sunsetUtc = sunsetArr && sunsetArr.length > 0 ? sunsetArr[0] : null;
  
      const daylightStage = classifyDaylightStage(startedAtIso, sunriseUtc, sunsetUtc);
  
      return {
        sunriseUtc,
        sunsetUtc,
        daylightStage,
      };
    } catch (err) {
      console.error("fetchSunForTrip error:", err);
      return null;
    }
  }
  
  /**
   * Classify the daylight stage of the trip relative to sunrise/sunset.
   * startedAtIso, sunriseUtc, sunsetUtc are all ISO strings in UTC.
   */
  function classifyDaylightStage(
    startedAtIso: string,
    sunriseUtc: string | null,
    sunsetUtc: string | null
  ): string | null {
    if (!sunriseUtc || !sunsetUtc) return null;
  
    const start = new Date(startedAtIso);
    const sunrise = new Date(sunriseUtc);
    const sunset = new Date(sunsetUtc);
  
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(sunrise.getTime()) ||
      Number.isNaN(sunset.getTime())
    ) {
      return null;
    }
  
    const hoursBeforeSunrise = (start.getTime() - sunrise.getTime()) / (1000 * 60 * 60);
    const hoursBeforeSunset = (start.getTime() - sunset.getTime()) / (1000 * 60 * 60);
  
    // Heuristics for stages (all in hours)
    // Negative = before, positive = after
    if (hoursBeforeSunrise <= -2) {
      // More than 2 hours before sunrise
      return "night";
    }
  
    if (hoursBeforeSunrise > -2 && hoursBeforeSunrise <= 0) {
      // Within 2 hours before sunrise
      return "pre_dawn";
    }
  
    if (hoursBeforeSunrise > 0 && hoursBeforeSunrise <= 1) {
      // Within 1 hour after sunrise
      return "sunrise";
    }
  
    if (hoursBeforeSunrise > 1 && hoursBeforeSunset < -1) {
      // Well after sunrise and more than 1 hour before sunset
      return "day";
    }
  
    if (hoursBeforeSunset >= -1 && hoursBeforeSunset <= 0) {
      // Within 1 hour before sunset
      return "sunset";
    }
  
    if (hoursBeforeSunset > 0 && hoursBeforeSunset <= 2) {
      // Within 2 hours after sunset
      return "post_sunset";
    }
  
    // Fallback: if it's very late or weird times, treat as night
    return "night";
  }