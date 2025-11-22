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
  const trip = {
    id: body.id,
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

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/trips" });
}
