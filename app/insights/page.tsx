"use client";

import React from "react";
import { useRouter } from "next/navigation";

type ConditionBucket = {
  key: string;
  trips: number;
  successTrips: number;
  successRate: number; // 0–1
};

type SpotBucket = {
  spotLabel: string;
  trips: number;
  successTrips: number;
  totalBass: number;
  avgBassPerTrip: number;
  successRate: number; // 0–1
};

type InsightsResponse = {
  summary: {
    totalTrips: number;
    totalBass: number;
    skunkTrips: number;
    successTrips: number;
    successRate: number; // 0–1
  };
  tide: {
    buckets: ConditionBucket[];
    best?: ConditionBucket;
  };
  wind: {
    buckets: ConditionBucket[];
    best?: ConditionBucket;
  };
  moon: {
    buckets: ConditionBucket[];
    best?: ConditionBucket;
  };
  daylight: {
    buckets: ConditionBucket[];
    best?: ConditionBucket;
  };
  spots: {
    buckets: SpotBucket[];
    best?: SpotBucket;
  };
};

export default function InsightsPage() {
  const router = useRouter();
  const [data, setData] = React.useState<InsightsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/insights");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setData(json.insights as InsightsResponse);
      } catch (err: any) {
        console.error("Failed to load insights:", err);
        setError("Could not load insights yet. Try logging a few trips.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const formatPercent = (value: number | undefined) => {
    if (value == null || Number.isNaN(value)) return "—";
    return `${Math.round(value * 100)}%`;
  };

  const renderBestBlock = (
    label: string,
    best?: ConditionBucket
  ) => {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <h3 className="text-sm font-semibold text-slate-200">{label}</h3>
        {best ? (
          <div className="mt-2 text-sm text-slate-300">
            <p className="text-lg font-semibold text-emerald-400">
              {best.key}
            </p>
            <p className="mt-1 text-slate-400">
              Success rate:{" "}
              <span className="font-medium">
                {formatPercent(best.successRate)}
              </span>{" "}
              over{" "}
              <span className="font-medium">
                {best.trips}
              </span>{" "}
              trips
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            Not enough data yet. Log more trips.
          </p>
        )}
      </div>
    );
  };

  const renderSpotRow = (spot: SpotBucket) => {
    return (
      <div
        key={spot.spotLabel}
        className="flex items-center justify-between text-sm text-slate-200"
      >
        <div className="flex flex-col">
          <span className="font-medium">{spot.spotLabel}</span>
          <span className="text-xs text-slate-400">
            {spot.trips} trips · {spot.totalBass} bass ·{" "}
            {formatPercent(spot.successRate)} success
          </span>
        </div>
        <div className="text-xs text-slate-300">
          Avg {spot.avgBassPerTrip.toFixed(2)} bass/trip
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/")}
            className="text-xs text-slate-400"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold mt-2">Insights</h1>
          <p className="text-xs text-slate-400">
            Patterns from your logged trips (local-only account).
          </p>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6 max-w-xl mx-auto w-full">
        {loading && (
          <p className="text-sm text-slate-400">Loading insights…</p>
        )}

        {!loading && error && (
          <div className="bg-red-900/30 border border-red-700 text-sm text-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary card */}
            <section className="bg-slate-900 rounded-xl border border-slate-800 p-4">
              <h2 className="text-sm font-semibold text-slate-200 mb-3">
                Summary
              </h2>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div className="text-slate-400">Trips logged</div>
                <div className="text-slate-100 font-medium">
                  {data.summary.totalTrips}
                </div>

                <div className="text-slate-400">Total bass</div>
                <div className="text-slate-100 font-medium">
                  {data.summary.totalBass}
                </div>

                <div className="text-slate-400">Skunk trips</div>
                <div className="text-slate-100 font-medium">
                  {data.summary.skunkTrips}
                </div>

                <div className="text-slate-400">Success rate</div>
                <div className="text-slate-100 font-medium">
                  {formatPercent(data.summary.successRate)}
                </div>
              </div>
            </section>

            {/* Best-condition blocks */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-200">
                Best conditions so far
              </h2>
              <div className="space-y-3">
                {renderBestBlock("Tide stage", data.tide.best)}
                {renderBestBlock("Wind direction", data.wind.best)}
                {renderBestBlock("Moon phase", data.moon.best)}
                {renderBestBlock("Daylight", data.daylight.best)}
              </div>
            </section>

            {/* Best spots */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Best spots so far
              </h2>

              {data.spots.buckets.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No spot data yet. Log some trips with a spot name.
                </p>
              ) : (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
                  {data.spots.best && (
                    <p className="text-xs text-emerald-400 mb-1">
                      Top spot right now:{" "}
                      <span className="font-semibold">
                        {data.spots.best.spotLabel}
                      </span>{" "}
                      ({formatPercent(data.spots.best.successRate)} success)
                    </p>
                  )}

                  {data.spots.buckets.slice(0, 3).map(renderSpotRow)}
                </div>
              )}
            </section>
          </>
        )}

        {!loading && !error && !data && (
          <p className="text-sm text-slate-400">
            No insights yet. Try logging a few trips first.
          </p>
        )}
      </div>
    </main>
  );
}