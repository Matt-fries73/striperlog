"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import type { Trip } from "@/types/trip";

export default function ExportPage() {
  const router = useRouter();
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [json, setJson] = React.useState<string>("[]");
  const [copied, setCopied] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchTrips() {
      try {
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
        setJson(JSON.stringify(tripsData, null, 2));
      } catch (err) {
        console.error("Error fetching trips:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy JSON:", err);
      alert("Could not copy to clipboard. You can still select and copy manually.");
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "striperlog-trips.json";
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to trigger download:", err);
      alert("Could not start download.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading trips...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-slate-400"
        >
          ← Back
        </button>
        <div className="text-right">
          <h1 className="text-lg font-semibold">Export Data</h1>
          <p className="text-xs text-slate-400">
            Trips: {trips.length}
          </p>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 max-w-3xl w-full mx-auto flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition"
          >
            {copied ? "Copied!" : "Copy JSON"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 py-2 rounded-lg border border-slate-700 text-sm text-slate-200 hover:bg-slate-900 transition"
          >
            Download JSON file
          </button>
        </div>

        <p className="text-xs text-slate-400">
          This is a full export of your current trips from this device. You can
          paste it into a notebook, Python, or a database later for analysis
          and modeling.
        </p>

        <div className="flex-1 border border-slate-800 rounded-xl overflow-hidden">
          <textarea
            readOnly
            className="w-full h-full bg-slate-950 text-xs text-slate-100 font-mono p-3 outline-none resize-none"
            value={json}
          />
        </div>
      </div>
    </main>
  );
}
