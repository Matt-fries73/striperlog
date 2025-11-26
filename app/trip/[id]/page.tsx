"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

import { getAllTrips, deleteTrip } from "@/lib/tripStorage";
import type { Trip } from "@/types/trip";

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

  React.useEffect(() => {
    const all = getAllTrips();
    const found = all.find((t) => t.id === tripId) || null;
    setTrip(found);

    if (!found) return;

    // Fetch enriched env_* fields from Supabase and merge into local trip
    const fetchEnrichedTrip = async () => {
      try {
        const res = await fetch(`/api/trips?id=${encodeURIComponent(found.id)}`);

        if (!res.ok) {
          // 404 or other error – just log and keep local data
          console.warn("Failed to fetch enriched trip:", await res.text());
          return;
        }

        const data = await res.json();

        if (!data.trip) return;

        const env = data.trip as Partial<Trip>;

        setTrip((prev) => {
          if (!prev) return prev;

          // Merge ONLY env_* and related fields to avoid snake_case collisions
          return {
            ...prev,
            env_source: env.env_source ?? prev.env_source,
            env_timestamp: env.env_timestamp ?? prev.env_timestamp,
            env_wind_speed_kts: env.env_wind_speed_kts ?? prev.env_wind_speed_kts,
            env_wind_dir_deg: env.env_wind_dir_deg ?? prev.env_wind_dir_deg,
            env_wind_dir_cardinal:
              env.env_wind_dir_cardinal ?? prev.env_wind_dir_cardinal,
            env_air_temp_f: env.env_air_temp_f ?? prev.env_air_temp_f,
            env_tide_station_id:
              env.env_tide_station_id ?? prev.env_tide_station_id,
            env_tide_height_ft:
              env.env_tide_height_ft ?? prev.env_tide_height_ft,
            env_tide_stage_simple:
              env.env_tide_stage_simple ?? prev.env_tide_stage_simple,
            env_tide_stage_detailed:
              env.env_tide_stage_detailed ?? prev.env_tide_stage_detailed,
            env_moon_phase_name:
              env.env_moon_phase_name ?? prev.env_moon_phase_name,
            env_moon_phase_value:
              env.env_moon_phase_value ?? prev.env_moon_phase_value,
            env_moon_illumination:
              env.env_moon_illumination ?? prev.env_moon_illumination,
            env_sunrise_utc:
              env.env_sunrise_utc ?? prev.env_sunrise_utc,
            env_sunset_utc:
              env.env_sunset_utc ?? prev.env_sunset_utc,
            env_daylight_stage:
              env.env_daylight_stage ?? prev.env_daylight_stage,
          };
        });
      } catch (err) {
        console.error("Error fetching enriched trip:", err);
      }
    };

    fetchEnrichedTrip();
  }, [tripId]);

  if (!trip) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
        <p className="text-slate-400">Trip not found.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg"
        >
          Go Home
        </button>
      </main>
    );
  }

  const date = new Date(trip.startedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
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
          </div>
        </section>

        <section className="rounded-lg bg-neutral-900 p-4 space-y-2">
          <h2 className="text-sm font-semibold">Conditions (manual)</h2>
          <p className="text-sm text-neutral-400">Manual conditions are not recorded for this trip.</p>
        </section>

        {/* Delete */}
        <button
          onClick={() => {
            const ok = window.confirm("Delete this trip? This cannot be undone.");
            if (!ok) return;

            deleteTrip(trip.id);
            router.push("/");
          }}
          className="w-full py-3 bg-red-600 text-slate-100 rounded-xl mt-4"
        >
          Delete Trip
        </button>

      </div>
    </main>
  );
}
