"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

import type { Trip, TideStage, WindDir, WaterClarity, SizeBucket } from "@/types/trip";
import { supabaseBrowser } from "@/lib/supabaseClient";

const TIDE_OPTIONS: TideStage[] = ["incoming", "outgoing", "high", "low", "slack", "unknown"];
const WIND_DIR_OPTIONS: WindDir[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "VAR", "unknown"];
const CLARITY_OPTIONS: WaterClarity[] = ["clean", "stained", "dirty", "unknown"];
const SIZE_BUCKET_OPTIONS: SizeBucket[] = ["schoolie", "slot", "over_slot", "cow", "unknown"];

export default function EditTripPage() {
  const params = useParams();
  const router = useRouter();

  const tripId = Array.isArray(params.id) ? params.id[0] : params.id;

  // undefined = still loading; null = not found; Trip = found
  const [trip, setTrip] = React.useState<Trip | null | undefined>(undefined);

  // Form state
  const [date, setDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");

  const [spotLabel, setSpotLabel] = React.useState("");
  const [lat, setLat] = React.useState<string>("");
  const [lon, setLon] = React.useState<string>("");

  const [tideStage, setTideStage] = React.useState<TideStage>("unknown");
  const [windDir, setWindDir] = React.useState<WindDir>("unknown");
  const [windSpeedKts, setWindSpeedKts] = React.useState<string>("");
  const [waterClarity, setWaterClarity] = React.useState<WaterClarity>("unknown");
  const [waterTempF, setWaterTempF] = React.useState<string>("");

  const [lureType, setLureType] = React.useState("");
  const [numBass, setNumBass] = React.useState<string>("0");
  const [bestSizeIn, setBestSizeIn] = React.useState<string>("");
  const [sizeBucket, setSizeBucket] = React.useState<SizeBucket>("unknown");
  const [skunk, setSkunk] = React.useState(false);

  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Load the trip once based on the id from the URL
  React.useEffect(() => {
    async function fetchTrip() {
      try {
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();

        if (!session?.user) {
          setTrip(null);
          return;
        }

        const { data, error } = await supabaseBrowser
          .from("trips")
          .select("*")
          .eq("id", tripId)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching trip:", error);
          setTrip(null);
          return;
        }

        if (!data) {
          setTrip(null);
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

        // Pre-fill form fields from found trip
        const start = new Date(tripData.startedAt);
        const end = tripData.endedAt ? new Date(tripData.endedAt) : null;

        setDate(start.toISOString().slice(0, 10)); // YYYY-MM-DD
        setStartTime(start.toISOString().slice(11, 16)); // HH:MM
        setEndTime(end ? end.toISOString().slice(11, 16) : "");

        setSpotLabel(tripData.spotLabel);
        setLat(tripData.lat !== null ? String(tripData.lat) : "");
        setLon(tripData.lon !== null ? String(tripData.lon) : "");

        setTideStage(tripData.tideStage);
        setWindDir(tripData.windDir);
        setWindSpeedKts(tripData.windSpeedKts !== null ? String(tripData.windSpeedKts) : "");
        setWaterClarity(tripData.waterClarity);
        setWaterTempF(tripData.waterTempF !== null ? String(tripData.waterTempF) : "");

        setLureType(tripData.lureType);
        setNumBass(String(tripData.numBass));
        setBestSizeIn(tripData.bestSizeIn !== null ? String(tripData.bestSizeIn) : "");
        setSizeBucket(tripData.sizeBucket);
        setSkunk(tripData.skunk);

        setNotes(tripData.notes);
      } catch (err) {
        console.error("Error fetching trip:", err);
        setTrip(null);
      }
    }

    fetchTrip();
  }, [tripId]);

  if (trip === undefined) {
    // Still "loading" sync data
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading trip...</p>
      </main>
    );
  }

  if (trip === null) {
    // Trip not found
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
        <p className="text-slate-400">Trip not found.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg text-sm"
        >
          Go Home
        </button>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session?.user) {
        alert("Not authenticated. Please sign in.");
        setSaving(false);
        return;
      }

      const startDateTime = new Date(`${date}T${startTime || "00:00"}:00`);
      const endDateTime = endTime ? new Date(`${date}T${endTime}:00`) : null;

      const updated: Trip = {
        // keep original id + createdAt
        id: trip.id,
        createdAt: trip.createdAt,

        startedAt: startDateTime.toISOString(),
        endedAt: endDateTime ? endDateTime.toISOString() : null,

        spotLabel: spotLabel.trim() || "Unnamed spot",
        lat: lat ? parseFloat(lat) : null,
        lon: lon ? parseFloat(lon) : null,

        tideStage,
        windDir,
        windSpeedKts: windSpeedKts ? parseFloat(windSpeedKts) : null,
        waterClarity,
        waterTempF: waterTempF ? parseFloat(waterTempF) : null,

        lureType: lureType.trim() || "Unknown",
        numBass: parseInt(numBass || "0", 10),
        bestSizeIn: bestSizeIn ? parseFloat(bestSizeIn) : null,
        sizeBucket,
        skunk,

        notes: notes.trim(),
      };

      // ✅ consistency rules for skunk vs numBass
      if (updated.skunk) {
        updated.numBass = 0;
      } else if (updated.numBass > 0) {
        updated.skunk = false;
      }

      // Update trip in Supabase scoped to the logged-in user
      const { error } = await supabaseBrowser
        .from("trips")
        .update({
          started_at: updated.startedAt,
          ended_at: updated.endedAt,
          spot_label: updated.spotLabel,
          lat: updated.lat,
          lon: updated.lon,
          tide_stage: updated.tideStage,
          wind_dir: updated.windDir,
          wind_speed_kts: updated.windSpeedKts,
          water_clarity: updated.waterClarity,
          water_temp_f: updated.waterTempF,
          lure_type: updated.lureType,
          num_bass: updated.numBass,
          best_size_in: updated.bestSizeIn,
          size_bucket: updated.sizeBucket,
          skunk: updated.skunk,
          notes: updated.notes,
        })
        .eq("id", trip.id)
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error updating trip:", error);
        alert("Failed to update trip. Please try again.");
        setSaving(false);
        return;
      }

      router.push(`/trip/${trip.id}`);
    } catch (err) {
      console.error("Error updating trip:", err);
      alert("Failed to update trip. Please try again.");
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="px-4 py-3 border-b border-slate-800">
        <button
          onClick={() => router.push(`/trip/${trip.id}`)}
          className="text-sm text-slate-400"
        >
          ← Back to trip
        </button>
        <h1 className="text-xl font-semibold tracking-tight mt-2">Edit Trip</h1>
        <p className="text-xs text-slate-400">
          Update details for this striped bass session.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex-1 px-4 py-4 max-w-xl w-full mx-auto space-y-4 overflow-y-auto"
      >
        {/* Core info */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">Core Info</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs space-y-1">
              <span className="block text-slate-400">Date</span>
              <input
                type="date"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="block text-slate-400">Start time</span>
              <input
                type="time"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="block text-slate-400">End time (optional)</span>
              <input
                type="time"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
            <label className="text-xs space-y-1 col-span-2">
              <span className="block text-slate-400">Spot label</span>
              <input
                type="text"
                placeholder="e.g. North Beach outer bar"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={spotLabel}
                onChange={(e) => setSpotLabel(e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* Location */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">Location (optional)</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs space-y-1">
              <span className="block text-slate-400">Latitude</span>
              <input
                type="text"
                placeholder="40.466"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="block text-slate-400">Longitude</span>
              <input
                type="text"
                placeholder="-74.005"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* Conditions */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">Conditions</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs space-y-1">
              <span className="block text-slate-400">Tide stage</span>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={tideStage}
                onChange={(e) => setTideStage(e.target.value as TideStage)}
              >
                {TIDE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="block text-slate-400">Wind dir</span>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={windDir}
                onChange={(e) => setWindDir(e.target.value as WindDir)}
              >
                {WIND_DIR_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="block text-slate-400">Wind speed (kts)</span>
              <input
                type="number"
                min={0}
                max={80}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={windSpeedKts}
                onChange={(e) => setWindSpeedKts(e.target.value)}
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="block text-slate-400">Water clarity</span>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={waterClarity}
                onChange={(e) => setWaterClarity(e.target.value as WaterClarity)}
              >
                {CLARITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="block text-slate-400">Water temp (°F)</span>
              <input
                type="number"
                min={30}
                max={80}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={waterTempF}
                onChange={(e) => setWaterTempF(e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* Catch */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">Catch</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs space-y-1">
              <span className="block text-slate-400"># bass landed</span>
              <input
                type="number"
                min={0}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={numBass}
                onChange={(e) => setNumBass(e.target.value)}
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="block text-slate-400">Best size (inches)</span>
              <input
                type="number"
                min={10}
                max={70}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={bestSizeIn}
                onChange={(e) => setBestSizeIn(e.target.value)}
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="block text-slate-400">Size bucket</span>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={sizeBucket}
                onChange={(e) => setSizeBucket(e.target.value as SizeBucket)}
              >
                {SIZE_BUCKET_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                checked={skunk}
                onChange={(e) => setSkunk(e.target.checked)}
              />
              <span className="text-slate-400">Skunk (no fish)</span>
            </label>
          </div>
        </section>

        {/* Lure & notes */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">Lure & Notes</h2>
          <label className="text-xs space-y-1">
            <span className="block text-slate-400">Lure / bait</span>
            <input
              type="text"
              placeholder="e.g. 1oz white bucktail, SP minnow, clam"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
              value={lureType}
              onChange={(e) => setLureType(e.target.value)}
            />
          </label>
          <label className="text-xs space-y-1">
            <span className="block text-slate-400">Notes</span>
            <textarea
              rows={4}
              placeholder="Bar shape, bird activity, bait, how they hit, what you learned..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={() => router.push(`/trip/${trip.id}`)}
            className="flex-1 py-2 rounded-lg border border-slate-700 text-sm text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </main>
  );
}

