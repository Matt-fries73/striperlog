"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

import { getAllTrips, deleteTrip } from "@/lib/tripStorage";
import type { Trip } from "@/types/trip";

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();

  const tripId = Array.isArray(params.id) ? params.id[0] : params.id;  

  const [trip, setTrip] = React.useState<Trip | null>(null);

  React.useEffect(() => {
    const all = getAllTrips();
    const found = all.find((t) => t.id === tripId) || null;
    setTrip(found);
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

        {/* Conditions */}
        <section className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300 mb-2">Conditions</h2>

          <p className="text-sm text-slate-400">
            Wind: {trip.windDir} {trip.windSpeedKts ? `${trip.windSpeedKts} kts` : ""}
          </p>
          <p className="text-sm text-slate-400">Water clarity: {trip.waterClarity}</p>
          <p className="text-sm text-slate-400">
            Water temp: {trip.waterTempF ? `${trip.waterTempF}°F` : "unknown"}
          </p>
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

