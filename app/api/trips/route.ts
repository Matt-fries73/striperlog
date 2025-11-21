import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

import type { Trip } from "@/types/trip";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const trip = body as Trip;

    // Basic sanity check
    if (!trip.id || !trip.startedAt || !trip.spotLabel) {
      return NextResponse.json(
        { success: false, error: "Missing required trip fields" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("trips").insert({
      id: trip.id,
      created_at: trip.createdAt,
      started_at: trip.startedAt,
      ended_at: trip.endedAt,

      spot_label: trip.spotLabel,
      lat: trip.lat,
      lon: trip.lon,

      tide_stage: trip.tideStage,
      wind_dir: trip.windDir,
      wind_speed_kts: trip.windSpeedKts,
      water_clarity: trip.waterClarity,
      water_temp_f: trip.waterTempF,

      lure_type: trip.lureType,
      num_bass: trip.numBass,
      best_size_in: trip.bestSizeIn,
      size_bucket: trip.sizeBucket,
      skunk: trip.skunk,

      notes: trip.notes,

      enriched: false,
      enrich_error: null,
      enriched_at: null
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Trips API error:", err);
    return NextResponse.json(
      { success: false, error: "Invalid request payload" },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/trips" });
}
