import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

import type { Trip } from "@/types/trip";

async function triggerEnrichment(tripId: string) {
  try {
    const url =
      process.env.NEXT_PUBLIC_APP_URL + "/enrich-trip";

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId }),
    });
  } catch (err) {
    console.error("Failed to trigger enrichment:", err);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.userId) {
    return NextResponse.json(
      { success: false, error: "Missing userId" },
      { status: 400 }
    );
  }

  const trip = {
    id: body.id,
    user_id: body.userId,
    started_at: body.startedAt,
    ended_at: body.endedAt,
    spot_label: body.spotLabel,
    lat: body.lat,
    lon: body.lon,
    tide_stage: body.tideStage,
    wind_dir: body.windDir,
    wind_speed_kts: body.windSpeedKts,
    water_clarity: body.waterClarity,
    water_temp_f: body.waterTempF,
    lure_type: body.lureType,
    num_bass: body.numBass,
    best_size_in: body.bestSizeIn,
    size_bucket: body.sizeBucket,
    skunk: body.skunk,
    notes: body.notes,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("trips")
    .insert(trip);

    if (error) {
      return NextResponse.json(
      { success: false, error: "Failed to insert trip" },
        { status: 500 }
      );
    }

  // 🔥 Fire enrichment — do NOT await
  triggerEnrichment(trip.id).catch((err) =>
    console.error("Enrichment trigger failed:", err)
  );

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing id query param" },
      { status: 400 }
    );
  }

  // Only select env_* fields we care about (no PII, no service-role leaks)
  const { data, error } = await supabaseAdmin
    .from("trips")
    .select(
      [
        "id",
        "env_source",
        "env_timestamp",
        "env_wind_speed_kts",
        "env_wind_dir_deg",
        "env_wind_dir_cardinal",
        "env_air_temp_f",
        "env_tide_station_id",
        "env_tide_height_ft",
        "env_tide_stage_simple",
        "env_tide_stage_detailed",
        "env_moon_phase_name",
        "env_moon_phase_value",
        "env_moon_illumination",
        "env_sunrise_utc",
        "env_sunset_utc",
        "env_daylight_stage",
        "env_swell_height_ft",
        "env_swell_period_s",
        "env_swell_direction_deg",
        "env_swell_direction_cardinal",
        "env_water_temp_f",
      ].join(",")
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("Supabase GET /api/trips error:", error);
    return NextResponse.json(
      { error: "Trip not found or query failed" },
      { status: 404 }
    );
  }

  return NextResponse.json({ trip: data });
}
