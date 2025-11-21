"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import { getAllTrips, deleteTrip } from "@/lib/tripStorage";
import type { Trip } from "@/types/trip";

export default function HomePage() {
  const [trips, setTrips] = React.useState<Trip[]>([]);

  React.useEffect(() => {
    const all = getAllTrips();
    all.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    setTrips(all);
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Delete this trip?")) {
      deleteTrip(id);
      const all = getAllTrips();
      all.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      setTrips(all);
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
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="px-4 py-3 border-b border-slate-800">
        <h1 className="text-2xl font-semibold tracking-tight">StriperLog</h1>
        <p className="text-sm text-slate-400">
          NJ surf &amp; bay trip log (local-only MVP)
        </p>
      </header>

      {/* Content area */}
      <section className="flex-1 px-4 py-4 max-w-xl w-full mx-auto overflow-y-auto">
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
            Trip list will appear here after we hook up storage.
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
  );
}
