"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabaseClient";
import type { Trip } from "@/types/trip";
import { AuthGate } from "@/app/components/AuthGate";

function formatDaylightStage(stage: string): string {
  switch (stage) {
    case "night":
      return "Night";
    case "pre_dawn":
      return "Pre-dawn";
    case "sunrise":
      return "Sunrise window";
    case "day":
      return "Day";
    case "sunset":
      return "Sunset window";
    case "post_sunset":
      return "Post-sunset";
    default:
      return stage;
  }
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();

  const tripId = Array.isArray(params.id) ? params.id[0] : params.id;  

  const [trip, setTrip] = React.useState<Trip | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchTrip() {
      try {
        // Get current user session
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();

        if (!session?.user) {
          setLoading(false);
          return;
        }

        // Fetch trip from Supabase scoped to the logged-in user
        const { data, error } = await supabaseBrowser
          .from("trips")
          .select("*")
          .eq("id", tripId)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching trip:", error);
          setLoading(false);
          return;
        }

        if (!data) {
          setLoading(false);
          return;
        }

        // Convert Supabase row (snake_case) to Trip type (camelCase)
        const tripData: Trip = {
          id: data.id,
          createdAt: data.created_at,
          startedAt: data.started_at,
          endedAt: data.ended_at,
          spotLabel: data.spot_label,
          lat: data.lat,
          lon: data.lon,
          tideStage: data.tide_stage,
          windDir: data.wind_dir,
          windSpeedKts: data.wind_speed_kts,
          waterClarity: data.water_clarity,
          waterTempF: data.water_temp_f,
          lureType: data.lure_type,
          numBass: data.num_bass,
          bestSizeIn: data.best_size_in,
          sizeBucket: data.size_bucket,
          skunk: data.skunk,
          notes: data.notes,
          // Enrichment fields
          env_source: data.env_source,
          env_timestamp: data.env_timestamp,
          env_wind_speed_kts: data.env_wind_speed_kts,
          env_wind_dir_cardinal: data.env_wind_dir_cardinal,
          env_wind_dir_deg: data.env_wind_dir_deg,
          env_air_temp_f: data.env_air_temp_f,
          env_tide_stage_simple: data.env_tide_stage_simple,
          env_tide_stage_detailed: data.env_tide_stage_detailed,
          env_tide_height_ft: data.env_tide_height_ft,
          env_tide_station_id: data.env_tide_station_id,
          env_moon_phase_name: data.env_moon_phase_name,
          env_moon_phase_value: data.env_moon_phase_value,
          env_moon_illumination: data.env_moon_illumination,
          env_sunrise_utc: data.env_sunrise_utc,
          env_sunset_utc: data.env_sunset_utc,
          env_daylight_stage: data.env_daylight_stage,
          env_swell_height_ft: data.env_swell_height_ft,
          env_swell_period_s: data.env_swell_period_s,
          env_swell_direction_deg: data.env_swell_direction_deg,
          env_swell_direction_cardinal: data.env_swell_direction_cardinal,
          env_water_temp_f: data.env_water_temp_f,
        };

        setTrip(tripData);
      } catch (err) {
        console.error("Error fetching trip:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [tripId]);

  if (loading) {
    return (
      <AuthGate>
        <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
          <p className="text-slate-400">Loading trip...</p>
        </main>
      </AuthGate>
    );
  }

  if (!trip) {
    return (
      <AuthGate>
        <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
          <p className="text-slate-400">Trip not found.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg"
          >
            Go Home
          </button>
        </main>
      </AuthGate>
    );
  }

  const date = new Date(trip.startedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AuthGate>
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="px-4 py-3 border-b border-slate-800">
        <button onClick={() => router.push("/")} className="text-sm text-slate-400">
          ← Back
        </button>
        <h1 className="text-xl font-semibold mt-2">{trip.spotLabel}</h1>
        <p className="text-xs text-slate-400">
          {date} • {trip.tideStage} tide
        </p>
        <button
          onClick={() => router.push(`/trip/${trip.id}/edit`)}
          className="mt-2 text-xs text-emerald-400 underline"
        >
          Edit trip
        </button>
      </header>

      <div className="px-4 py-4 space-y-6 max-w-xl mx-auto w-full">

        {/* Catch summary */}
        <section className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300 mb-2">Catch</h2>

          {trip.skunk ? (
            <p className="text-red-400 font-semibold">Skunk</p>
          ) : (
            <>
              <p className="text-emerald-400 font-semibold">{trip.numBass} bass</p>
              {trip.bestSizeIn && (
                <p className="text-sm text-slate-400">Best: {trip.bestSizeIn}"</p>
              )}
            </>
          )}
        </section>

        {/* Lure */}
        <section className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300 mb-2">Lure</h2>
          <p className="text-sm text-slate-400">{trip.lureType}</p>
        </section>

        {/* Notes */}
        <section className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300 mb-2">Notes</h2>
          <p className="text-sm text-slate-400 whitespace-pre-line">{trip.notes || "—"}</p>
        </section>

        <section className="mt-6 rounded-lg border bg-white p-4 text-sm space-y-3">
          <h2 className="font-semibold text-base text-black">Conditions</h2>
          <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-black">
            {/* Wind */}
            <div className="text-xs font-medium text-black">Wind</div>
            <div>
              {trip.env_wind_speed_kts != null && trip.env_wind_dir_cardinal ? (
                <span className="text-black">
                  {trip.env_wind_speed_kts} kts · {trip.env_wind_dir_cardinal}
                  {trip.env_wind_dir_deg != null && ` (${trip.env_wind_dir_deg}°)`}
                </span>
              ) : trip.windSpeedKts != null || trip.windDir ? (
                <span>
                  {trip.windSpeedKts != null && `${trip.windSpeedKts} kts`}
                  {trip.windSpeedKts != null && trip.windDir && " · "}
                  {trip.windDir}
                </span>
              ) : (
                <span className="text-black/60">No wind data</span>
              )}
            </div>
            {/* Air temp */}
            <div className="text-xs font-medium text-black">Air temp</div>
            <div>
              {trip.env_air_temp_f != null ? (
                <span className="text-black">{trip.env_air_temp_f} °F</span>
              ) : trip.waterTempF != null ? (
                <span className="text-black">{trip.waterTempF} °F</span>
              ) : (
                <span className="text-black/60">No temperature data</span>
              )}
            </div>
            {/* Tide */}
            <div className="text-xs font-medium text-black">Tide</div>
            <div>
              {trip.env_tide_stage_simple || trip.env_tide_height_ft != null ? (
                <span className="text-black">
                  {trip.env_tide_stage_detailed ?? trip.env_tide_stage_simple}
                  {trip.env_tide_height_ft != null && ` · ${trip.env_tide_height_ft} ft`}
                </span>
              ) : trip.tideStage ? (
                <span className="text-black">{trip.tideStage}</span>
              ) : (
                <span className="text-black/60">No tide data</span>
              )}
            </div>
            {/* Tide station */}
            <div className="text-xs font-medium text-black">Tide station</div>
            <div>
              {trip.env_tide_station_id ? (
                <span className="text-black">{trip.env_tide_station_id}</span>
              ) : (
                <span className="text-black/60">Not mapped</span>
              )}
            </div>
            {/* Moon */}
            <div className="text-xs font-medium text-black">Moon</div>
            <div>
              {trip.env_moon_phase_name || trip.env_moon_illumination != null ? (
                <span className="text-black">
                  {trip.env_moon_phase_name ?? "unknown"}
                  {trip.env_moon_illumination != null &&
                    ` · ${(trip.env_moon_illumination * 100).toFixed(0)}%`}
                </span>
              ) : (
                <span className="text-black/60">No moon data</span>
              )}
            </div>
            {/* Daylight */}
            <div className="text-xs font-medium text-black">Daylight</div>
            <div>
              {trip.env_daylight_stage ? (
                <span className="text-black">
                  {formatDaylightStage(trip.env_daylight_stage)}
                </span>
              ) : (
                <span className="text-black/60">No daylight data</span>
              )}
            </div>
            {/* Swell */}
            <div className="text-xs font-medium text-black">Swell</div>
            <div>
              {trip.env_swell_height_ft != null || trip.env_swell_period_s != null ? (
                <span className="text-black">
                  {trip.env_swell_height_ft != null &&
                    `${trip.env_swell_height_ft.toFixed(1)} ft`}
                  {trip.env_swell_period_s != null &&
                    ` @ ${trip.env_swell_period_s.toFixed(1)} s`}
                  {trip.env_swell_direction_cardinal &&
                    ` · ${trip.env_swell_direction_cardinal}`}
                </span>
              ) : (
                <span className="text-black/60">No swell data</span>
              )}
            </div>
            {/* Water temp */}
            <div className="text-xs font-medium text-black">Water temp</div>
            <div>
              {trip.env_water_temp_f != null ? (
                <span className="text-black">
                  {trip.env_water_temp_f.toFixed(1)} °F
                </span>
              ) : (
                <span className="text-black/60">No water temp data</span>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-neutral-900 p-4 space-y-2">
          <h2 className="text-sm font-semibold">Conditions (manual)</h2>
          <p className="text-sm text-neutral-400">Manual conditions are not recorded for this trip.</p>
        </section>

        {/* Delete */}
        <button
          onClick={async () => {
            const ok = window.confirm("Delete this trip? This cannot be undone.");
            if (!ok) return;

            try {
              // Get current user session
              const {
                data: { session },
              } = await supabaseBrowser.auth.getSession();

              if (!session?.user) {
                alert("Not authenticated");
                return;
              }

              // Delete trip from Supabase scoped to the logged-in user
              const { error } = await supabaseBrowser
                .from("trips")
                .delete()
                .eq("id", trip.id)
                .eq("user_id", session.user.id);

              if (error) {
                console.error("Error deleting trip:", error);
                alert("Failed to delete trip");
                return;
              }

              router.push("/");
            } catch (err) {
              console.error("Error deleting trip:", err);
              alert("Failed to delete trip");
            }
          }}
          className="w-full py-3 bg-red-600 text-slate-100 rounded-xl mt-4"
        >
          Delete Trip
        </button>

      </div>
    </main>
    </AuthGate>
  );
}
