"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

import type { Trip, TideStage, WindDir, WaterClarity, SizeBucket } from "@/types/trip";

import { getAllTrips, updateTrip } from "@/lib/tripStorage";

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

  // Load the trip once based on the id from the URL
  React.useEffect(() => {
    const all = getAllTrips();
    const found = all.find((t) => t.id === tripId) || null;
    setTrip(found);

    if (found) {
      // Pre-fill form fields from found trip
      const start = new Date(found.startedAt);
      const end = found.endedAt ? new Date(found.endedAt) : null;

      setDate(start.toISOString().slice(0, 10)); // YYYY-MM-DD
      setStartTime(start.toISOString().slice(11, 16)); // HH:MM
      setEndTime(end ? end.toISOString().slice(11, 16) : "");

      setSpotLabel(found.spotLabel);
      setLat(found.lat !== null ? String(found.lat) : "");
      setLon(found.lon !== null ? String(found.lon) : "");

      setTideStage(found.tideStage);
      setWindDir(found.windDir);
      setWindSpeedKts(found.windSpeedKts !== null ? String(found.windSpeedKts) : "");
      setWaterClarity(found.waterClarity);
      setWaterTempF(found.waterTempF !== null ? String(found.waterTempF) : "");

      setLureType(found.lureType);
      setNumBass(String(found.numBass));
      setBestSizeIn(found.bestSizeIn !== null ? String(found.bestSizeIn) : "");
      setSizeBucket(found.sizeBucket);
      setSkunk(found.skunk);

      setNotes(found.notes);
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    // consistency rules for skunk vs numBass
    if (updated.skunk) {
      updated.numBass = 0;
    } else if (updated.numBass > 0) {
      updated.skunk = false;
    }

    updateTrip(trip.id, updated);

    alert("Trip updated.");
    router.push(`/trip/${trip.id}`);
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
            className="flex-1 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition"
          >
            Save Changes
          </button>
        </div>
      </form>
    </main>
  );
}

