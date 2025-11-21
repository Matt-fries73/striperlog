"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { Trip, TideStage, WindDir, WaterClarity, SizeBucket } from "@/types/trip";
import { saveTrip, getAllTrips } from "@/lib/tripStorage";

const TIDE_OPTIONS: TideStage[] = ["incoming", "outgoing", "high", "low", "slack", "unknown"];
const WIND_DIR_OPTIONS: WindDir[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "VAR", "unknown"];
const CLARITY_OPTIONS: WaterClarity[] = ["clean", "stained", "dirty", "unknown"];
const SIZE_BUCKET_OPTIONS: SizeBucket[] = ["schoolie", "slot", "over_slot", "cow", "unknown"];

export default function LogTripPage() {
  const router = useRouter();

  const now = new Date();
  const [date, setDate] = useState(now.toISOString().slice(0, 10)); // YYYY-MM-DD
  const [startTime, setStartTime] = useState(now.toISOString().slice(11, 16)); // HH:MM
  const [endTime, setEndTime] = useState(""); // optional

  const lastTrips = getAllTrips();
  const lastSpot = lastTrips.length > 0 ? lastTrips[lastTrips.length - 1].spotLabel : "";
  const [spotLabel, setSpotLabel] = useState(lastSpot);
  const [lat, setLat] = useState<string>("");
  const [lon, setLon] = useState<string>("");

  const [tideStage, setTideStage] = useState<TideStage>("unknown");
  const [windDir, setWindDir] = useState<WindDir>("unknown");
  const [windSpeedKts, setWindSpeedKts] = useState<string>("");
  const [waterClarity, setWaterClarity] = useState<WaterClarity>("unknown");
  const [waterTempF, setWaterTempF] = useState<string>("");

  const [lureType, setLureType] = useState("");
  const [numBass, setNumBass] = useState<string>("0");
  const [bestSizeIn, setBestSizeIn] = useState<string>("");
  const [sizeBucket, setSizeBucket] = useState<SizeBucket>("unknown");
  const [skunk, setSkunk] = useState(false);

  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = endTime ? new Date(`${date}T${endTime}:00`) : null;

    const now = new Date();

    const trip: Trip = {
      id: `trip_${now.getTime()}`,
      createdAt: now.toISOString(),
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
    if (trip.skunk) {
      trip.numBass = 0;
    } else if (trip.numBass > 0) {
      trip.skunk = false;
    }

    saveTrip(trip);

    alert("Trip saved locally.");
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="px-4 py-3 border-b border-slate-800">
        <h1 className="text-xl font-semibold tracking-tight">Log Trip</h1>
        <p className="text-xs text-slate-400">
          Enter details for this striped bass session.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 px-4 py-4 max-w-xl w-full mx-auto space-y-4 overflow-y-auto">
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

        {/* Location (optional GPS) */}
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

        {/* Catch details */}
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

        {/* Lure + notes */}
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
            onClick={() => router.push("/")}
            className="flex-1 py-2 rounded-lg border border-slate-700 text-sm text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition"
          >
            Save Trip
          </button>
        </div>
      </form>
    </main>
  );
}
