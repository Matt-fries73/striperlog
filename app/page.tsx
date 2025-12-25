"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabaseClient";
import type { Trip } from "@/types/trip";
import { AuthGate } from "@/app/components/AuthGate";

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchTrips = React.useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseBrowser
        .from("trips")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching trips:", error);
        setLoading(false);
        return;
      }

      if (!data) {
        setLoading(false);
        return;
      }

      // Convert Supabase rows (snake_case) to Trip type (camelCase)
      const tripsData: Trip[] = data.map((row: any) => ({
        id: row.id,
        createdAt: row.created_at,
        startedAt: row.started_at,
        endedAt: row.ended_at,
        spotLabel: row.spot_label,
        lat: row.lat,
        lon: row.lon,
        tideStage: row.tide_stage,
        windDir: row.wind_dir,
        windSpeedKts: row.wind_speed_kts,
        waterClarity: row.water_clarity,
        waterTempF: row.water_temp_f,
        lureType: row.lure_type,
        numBass: row.num_bass,
        bestSizeIn: row.best_size_in,
        sizeBucket: row.size_bucket,
        skunk: row.skunk,
        notes: row.notes,
        // Enrichment fields
        env_source: row.env_source,
        env_timestamp: row.env_timestamp,
        env_wind_speed_kts: row.env_wind_speed_kts,
        env_wind_dir_cardinal: row.env_wind_dir_cardinal,
        env_wind_dir_deg: row.env_wind_dir_deg,
        env_air_temp_f: row.env_air_temp_f,
        env_tide_stage_simple: row.env_tide_stage_simple,
        env_tide_stage_detailed: row.env_tide_stage_detailed,
        env_tide_height_ft: row.env_tide_height_ft,
        env_tide_station_id: row.env_tide_station_id,
        env_moon_phase_name: row.env_moon_phase_name,
        env_moon_phase_value: row.env_moon_phase_value,
        env_moon_illumination: row.env_moon_illumination,
        env_sunrise_utc: row.env_sunrise_utc,
        env_sunset_utc: row.env_sunset_utc,
        env_daylight_stage: row.env_daylight_stage,
        env_swell_height_ft: row.env_swell_height_ft,
        env_swell_period_s: row.env_swell_period_s,
        env_swell_direction_deg: row.env_swell_direction_deg,
        env_swell_direction_cardinal: row.env_swell_direction_cardinal,
        env_water_temp_f: row.env_water_temp_f,
      }));

      setTrips(tripsData);
    } catch (err) {
      console.error("Error fetching trips:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch trips on mount and when pathname changes to "/"
  React.useEffect(() => {
    if (pathname === "/") {
      fetchTrips();
    }
  }, [pathname, fetchTrips]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this trip?")) return;

    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session?.user) {
        alert("Not authenticated");
        return;
      }

      const { error } = await supabaseBrowser
        .from("trips")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error deleting trip:", error);
        alert("Failed to delete trip");
        return;
      }

      // Refresh the list
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting trip:", err);
      alert("Failed to delete trip");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <AuthGate>
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Top bar */}
        <header className="px-4 py-3 border-b border-slate-800">
          <h1 className="text-2xl font-semibold tracking-tight">StriperLog</h1>
          <p className="text-sm text-slate-400">
            NJ surf &amp; bay trip log
          </p>
        </header>

        {/* Content area */}
        <section className="flex-1 px-4 py-4 max-w-xl w-full mx-auto overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-slate-400 text-sm">Loading trips...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-medium">
                  Trips {trips.length > 0 && `(${trips.length})`}
                </h2>
                {trips.length === 0 && (
                  <p className="text-sm text-slate-400">
                    You haven&apos;t logged any trips yet. Once you save a session, it
                    will show up here.
                  </p>
                )}
              </div>

              {/* Trip list */}
              {trips.length === 0 ? (
                <div className="border border-dashed border-slate-700 rounded-xl p-4 text-sm text-slate-400">
                  No trips yet. Log your first trip to get started!
                </div>
              ) : (
                <ul className="space-y-3">
                  {trips.map((trip) => (
                    <li key={trip.id}>
                      <a
                        href={`/trip/${trip.id}`}
                        className="block p-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-slate-100">
                              {trip.spotLabel || "Unnamed Spot"}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {formatDate(trip.startedAt)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(trip.id);
                            }}
                            className="text-slate-500 hover:text-red-400 text-sm px-2 py-1 rounded transition"
                            title="Delete trip"
                          >
                            ×
                          </button>
                        </div>
                        <div className="text-sm text-slate-300 space-y-1">
                          {trip.numBass > 0 && (
                            <p>
                              <span className="text-emerald-400 font-medium">
                                {trip.numBass} bass
                              </span>
                              {trip.bestSizeIn && (
                                <span className="text-slate-400 ml-2">
                                  (best: {trip.bestSizeIn}&quot;)
                                </span>
                              )}
                            </p>
                          )}
                          {trip.skunk && (
                            <p className="text-slate-500 italic">Skunked</p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-2">
                            {trip.tideStage !== "unknown" && (
                              <span>Tide: {trip.tideStage}</span>
                            )}
                            {trip.windDir !== "unknown" && (
                              <span>Wind: {trip.windDir}</span>
                            )}
                            {trip.waterClarity !== "unknown" && (
                              <span>Water: {trip.waterClarity}</span>
                            )}
                            {trip.lureType && <span>Lure: {trip.lureType}</span>}
                          </div>
                          {trip.notes && (
                            <p className="text-xs text-slate-400 mt-2 italic">
                              {trip.notes}
                            </p>
                          )}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {/* Bottom bar with main action */}
        <footer className="px-4 py-3 border-t border-slate-800">
          <Link href="/log">
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-base hover:bg-emerald-400 transition"
            >
              Log New Trip
            </button>
          </Link>
        </footer>
      </main>
    </AuthGate>
  );
}
