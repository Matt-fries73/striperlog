import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchWeatherForTrip } from "@/lib/weather";
import { fetchTideForTrip } from "@/lib/tide";
import { getMoonPhase } from "@/lib/moon";
import { fetchSunForTrip } from "@/lib/sun";

// Map spot keywords → NOAA tide station IDs
const SPOT_TIDE_STATION: Record<string, string> = {
  "sea bright": "8531680",
  "sandy hook": "8531680",
  "monmouth beach": "8531680",
  "long branch": "8531680",
  "island beach": "8532680",
  "ibsp": "8532680",
};

// Find station by checking if spot label includes any known keyword
function getTideStationId(label: string | null): string | null {
  if (!label) return null;
  const lower = label.toLowerCase();

  for (const key in SPOT_TIDE_STATION) {
    if (lower.includes(key)) return SPOT_TIDE_STATION[key];
  }

  return null;
}

// ---- SPOT → LAT/LON MAP (v0) ----
// Later we'll move this to Supabase, but for now it's perfect.
const SPOT_COORDS: Record<string, { lat: number; lon: number }> = {
  "sea bright": { lat: 40.3618, lon: -73.9783 },
  "north beach": { lat: 40.4663, lon: -73.9930 },
  "sandy hook": { lat: 40.4663, lon: -73.9930 },
  "deal": { lat: 40.2478, lon: -73.9990 },
  "long branch": { lat: 40.3030, lon: -73.9887 },
  "monmouth beach": { lat: 40.3308, lon: -73.9722 },
  "island beach": { lat: 39.8091, lon: -74.0840 },
};

// Helper to get coordinates from a spot label
function getSpotCoords(spotLabel: string | null) {
  if (!spotLabel) return null;
  const key = spotLabel.toLowerCase();

  for (const name in SPOT_COORDS) {
    if (key.includes(name)) {
      return SPOT_COORDS[name];
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  let payload;
  try {
    payload = await req.json();
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { tripId } = payload;
  if (!tripId) {
    return NextResponse.json(
      { success: false, error: "Missing tripId" },
      { status: 400 }
    );
  }

  // Load trip
  const { data: trip, error: loadErr } = await supabaseAdmin
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .maybeSingle();

  if (loadErr || !trip) {
    return NextResponse.json(
      { success: false, error: "Trip not found" },
      { status: 404 }
    );
  }

  // Already enriched?
  if (trip.enriched) {
    return NextResponse.json({ success: true, alreadyEnriched: true });
  }

  // Determine lat/lon
  let lat = trip.lat;
  let lon = trip.lon;

  if (!lat || !lon) {
    // fallback to spot
    const mapped = getSpotCoords(trip.spot_label);
    if (mapped) {
      lat = mapped.lat;
      lon = mapped.lon;
    }
  }

  if (!lat || !lon) {
    // can't enrich
    await supabaseAdmin
      .from("trips")
      .update({
        enriched: false,
        enrich_error: "No location available",
        enriched_at: new Date().toISOString(),
      })
      .eq("id", tripId);

    return NextResponse.json(
      { success: false, error: "Missing lat/lon to enrich" },
      { status: 400 }
    );
  }

  // Fetch weather
  const weather = await fetchWeatherForTrip(lat, lon, trip.started_at);

  if (!weather) {
    await supabaseAdmin
      .from("trips")
      .update({
        enriched: false,
        enrich_error: "Weather API returned null",
        enriched_at: new Date().toISOString(),
      })
      .eq("id", tripId);

    return NextResponse.json(
      { success: false, error: "Weather fetch failed" },
      { status: 500 }
    );
  }

  // Build update payload
  const update: Record<string, any> = {
    env_source: "open-meteo",
    env_timestamp: weather.timestamp,
    env_wind_speed_kts: weather.windSpeedKts,
    env_wind_dir_deg: weather.windDirDeg,
    env_wind_dir_cardinal: weather.windDirCardinal,
    env_air_temp_f: weather.airTempF,
    env_conditions: weather.conditions,
    env_raw: weather.raw,
    enriched: true,
    enrich_error: null,
    enriched_at: new Date().toISOString(),
  };

  // Copy to primary fields ONLY if user left them blank
  if (!trip.wind_speed_kts && update.env_wind_speed_kts) {
    update.wind_speed_kts = update.env_wind_speed_kts;
  }
  if (!trip.wind_dir && update.env_wind_dir_cardinal) {
    update.wind_dir = update.env_wind_dir_cardinal;
  }

  // ---- Tide enrichment ----
  const stationId =
    trip.env_tide_station_id || getTideStationId(trip.spot_label);

  if (stationId && trip.started_at) {
    try {
      const tide = await fetchTideForTrip(stationId, trip.started_at);

      if (tide) {
        update.env_tide_station_id = stationId;
        update.env_tide_height_ft = tide.heightFt;
        update.env_tide_stage_simple = tide.stageSimple;
        update.env_tide_stage_detailed = tide.stageDetailed;
        // If you ever want to inspect full tide curve:
        // update.env_tide_raw = tide.raw;  // only if you add this column later
      }
    } catch (err) {
      console.error("Tide enrichment failed:", err);
    }
  }

  // ---- Moon enrichment ----
  if (trip.started_at) {
    try {
      const startedAt = new Date(trip.started_at);
      const moon = getMoonPhase(startedAt);

      update.env_moon_phase_name = moon.phaseName;
      update.env_moon_phase_value = moon.phaseValue;
      update.env_moon_illumination = moon.illumination;
    } catch (err) {
      console.error("Moon enrichment failed:", err);
    }
  }

  // ---- Sun / daylight enrichment ----
  if (lat && lon && trip.started_at) {
    try {
      const sun = await fetchSunForTrip(lat, lon, trip.started_at);

      if (sun) {
        update.env_sunrise_utc = sun.sunriseUtc;
        update.env_sunset_utc = sun.sunsetUtc;
        update.env_daylight_stage = sun.daylightStage;
      }
    } catch (err) {
      console.error("Sun enrichment failed:", err);
    }
  }

  // Save
  const { error: updateErr } = await supabaseAdmin
    .from("trips")
    .update(update)
    .eq("id", tripId);

  if (updateErr) {
    return NextResponse.json(
      { success: false, error: "Failed to update trip" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}