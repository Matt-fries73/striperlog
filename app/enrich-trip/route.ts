import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchWeatherForTrip } from "@/lib/weather";
import { fetchTideForTrip } from "@/lib/tide";
import { getMoonPhase } from "@/lib/moon";
import { fetchSunForTrip } from "@/lib/sun";
import { fetchSwellForTrip } from "@/lib/swell";
import { getStationIdForSpot } from "@/lib/spots";

// Map spot keywords → NOAA tide station IDs
// Parsed by "includes" on the lowercased spot label.
// Covers Sandy Hook → IBSP coastline at a region/town level.
const SPOT_TIDE_STATION: Record<string, string> = {
  // Upper bay / Hook area
  "highlands": "8531680",
  "sandy hook": "8531680",
  "north beach": "8531680",

  // Northern Monmouth coast
  "sea bright": "8531680",
  "monmouth beach": "8531680",
  "seven presidents": "8531680",
  "long branch": "8531680",

  // Deal / Asbury / mid-Monmouth coast
  "deal": "8531678",
  "allenhurst": "8531678",
  "loch arbour": "8531678",
  "asbury": "8531678",
  "ocean grove": "8531678",
  "bradley beach": "8531678",
  "avon": "8531678",
  "belmar": "8531678",
  "spring lake": "8531678",
  "sea girt": "8531678",

  // Manasquan / inlet
  "manasquan": "8530580",

  // Point Pleasant / Bay Head
  "point pleasant": "8530590",
  "bay head": "8530590",

  // Mantoloking → Lavallette strip
  "mantoloking": "8532668",
  "normandy": "8532668",
  "lavallette": "8532668",
  "ortley": "8532668",

  // Seaside / Island Beach
  "seaside heights": "8532680",
  "seaside park": "8532680",
  "seaside": "8532680",
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
// Parsed by "includes" on the lowercased spot label.
// These are approximate coastal coordinates for weather/swell/tide context.
const SPOT_COORDS: Record<string, { lat: number; lon: number }> = {
  // Upper bay / Hook area
  "highlands": { lat: 40.402, lon: -74.001 },
  "sandy hook": { lat: 40.4663, lon: -73.9930 },
  "north beach": { lat: 40.4663, lon: -73.9930 },

  // Northern Monmouth coast
  "sea bright": { lat: 40.3618, lon: -73.9783 },
  "monmouth beach": { lat: 40.3308, lon: -73.9722 },
  "seven presidents": { lat: 40.282, lon: -73.974 },
  "long branch": { lat: 40.3030, lon: -73.9887 },

  // Deal / Asbury / mid-Monmouth coast
  "deal": { lat: 40.2478, lon: -73.9990 },
  "allenhurst": { lat: 40.237, lon: -73.999 },
  "loch arbour": { lat: 40.234, lon: -73.999 },
  "asbury": { lat: 40.223, lon: -73.998 },
  "ocean grove": { lat: 40.212, lon: -73.998 },
  "bradley beach": { lat: 40.203, lon: -73.998 },
  "avon": { lat: 40.192, lon: -74.000 },
  "belmar": { lat: 40.178, lon: -74.022 },
  "spring lake": { lat: 40.151, lon: -74.027 },
  "sea girt": { lat: 40.132, lon: -74.033 },

  // Manasquan / inlet
  "manasquan": { lat: 40.104, lon: -74.037 },

  // Point Pleasant / Bay Head
  "point pleasant": { lat: 40.091, lon: -74.046 },
  "bay head": { lat: 40.075, lon: -74.055 },

  // Mantoloking → Lavallette strip
  "mantoloking": { lat: 40.038, lon: -74.055 },
  "normandy": { lat: 39.998, lon: -74.066 },
  "lavallette": { lat: 39.97, lon: -74.07 },
  "ortley": { lat: 39.955, lon: -74.07 },

  // Seaside / Island Beach
  "seaside heights": { lat: 39.94, lon: -74.07 },
  "seaside park": { lat: 39.92, lon: -74.07 },
  "seaside": { lat: 39.93, lon: -74.07 },
  "island beach": { lat: 39.8091, lon: -74.0840 },
  "ibsp": { lat: 39.8091, lon: -74.0840 },
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
  // Priority:
  // 1) Station mapped from spot label (lib/spots)
  // 2) Existing env_tide_station_id on the trip (if any)
  // 3) Fallback to Sandy Hook (8531680)
  let stationId =
    getStationIdForSpot(trip.spot_label) ||
    trip.env_tide_station_id ||
    "8531680"; // Sandy Hook as global fallback

  if (stationId && trip.started_at) {
    try {
      const tide = await fetchTideForTrip(stationId, trip.started_at);

      if (tide) {
        update.env_tide_station_id = stationId;
        update.env_tide_height_ft = tide.heightFt;
        update.env_tide_stage_simple = tide.stageSimple;
        update.env_tide_stage_detailed = tide.stageDetailed;
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

  // ---- Swell / water temperature enrichment ----
  if (lat && lon && trip.started_at) {
    try {
      const swell = await fetchSwellForTrip(lat, lon, trip.started_at);

      if (swell) {
        update.env_swell_height_ft = swell.swellHeightFt;
        update.env_swell_period_s = swell.swellPeriodS;
        update.env_swell_direction_deg = swell.swellDirectionDeg;
        update.env_swell_direction_cardinal = swell.swellDirectionCardinal;
        update.env_water_temp_f = swell.waterTempF;
      }
    } catch (err) {
      console.error("Swell enrichment failed:", err);
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