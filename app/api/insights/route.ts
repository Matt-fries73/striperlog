// app/api/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

type TripRow = {
  id: string;
  spot_label: string | null;
  num_bass: number | null;
  skunk: boolean | null;
  env_tide_stage_simple: string | null;
  env_wind_dir_cardinal: string | null;
  env_moon_phase_name: string | null;
  env_daylight_stage: string | null;
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

export async function GET(_req: NextRequest) {
  // 1) Pull trips from Supabase
  const { data, error } = await supabaseAdmin
    .from("trips")
    .select(
      [
        "id",
        "spot_label",
        "num_bass",
        "skunk",
        "env_tide_stage_simple",
        "env_wind_dir_cardinal",
        "env_moon_phase_name",
        "env_daylight_stage",
      ].join(",")
    );

  if (error) {
    console.error("[insights] Supabase error:", error);
    return NextResponse.json(
      { error: "Failed to load trips for insights" },
      { status: 500 }
    );
  }

  const trips = (data ?? []) as unknown as TripRow[];

  // 2) Basic counts
  let totalTrips = 0;
  let totalBass = 0;
  let skunkTrips = 0;
  let successTrips = 0;

  // bucket helpers
  const tideBuckets = new Map<string, ConditionBucket>();
  const windBuckets = new Map<string, ConditionBucket>();
  const moonBuckets = new Map<string, ConditionBucket>();
  const daylightBuckets = new Map<string, ConditionBucket>();
  const spotBuckets = new Map<string, SpotBucket>();

  const bumpBucket = (
    map: Map<string, ConditionBucket>,
    key: string,
    isSuccess: boolean
  ) => {
    if (!key) return;
    const existing = map.get(key) ?? {
      key,
      trips: 0,
      successTrips: 0,
      successRate: 0,
    };
    existing.trips += 1;
    if (isSuccess) existing.successTrips += 1;
    map.set(key, existing);
  };

  const bumpSpotBucket = (
    map: Map<string, SpotBucket>,
    spotLabel: string,
    numBass: number,
    isSuccess: boolean
  ) => {
    if (!spotLabel) return;
    const label = spotLabel.trim() || "Unknown spot";
    const existing = map.get(label) ?? {
      spotLabel: label,
      trips: 0,
      successTrips: 0,
      totalBass: 0,
      avgBassPerTrip: 0,
      successRate: 0,
    };
    existing.trips += 1;
    existing.totalBass += numBass;
    if (isSuccess) existing.successTrips += 1;
    map.set(label, existing);
  };

  for (const row of trips) {
    totalTrips += 1;

    const numBass = typeof row.num_bass === "number" ? row.num_bass : 0;
    const skunk = row.skunk === true;

    totalBass += numBass;
    if (skunk) skunkTrips += 1;

    // Define "success" as: at least 1 bass OR skunk=false
    const isSuccess = numBass > 0 || skunk === false;
    if (isSuccess) successTrips += 1;

    // Condition keys
    const tideKey =
      (row.env_tide_stage_simple as string | null) ?? "unknown";
    const windKey =
      (row.env_wind_dir_cardinal as string | null) ?? "unknown";
    const moonKey =
      (row.env_moon_phase_name as string | null) ?? "unknown";
    const daylightKey =
      (row.env_daylight_stage as string | null) ?? "unknown";

    bumpBucket(tideBuckets, tideKey, isSuccess);
    bumpBucket(windBuckets, windKey, isSuccess);
    bumpBucket(moonBuckets, moonKey, isSuccess);
    bumpBucket(daylightBuckets, daylightKey, isSuccess);

    const spotLabel = (row.spot_label as string | null) ?? "Unknown spot";
    bumpSpotBucket(spotBuckets, spotLabel, numBass, isSuccess);
  }

  const computeRates = (
    map: Map<string, ConditionBucket>
  ): ConditionBucket[] => {
    const out: ConditionBucket[] = [];
    for (const bucket of map.values()) {
      bucket.successRate =
        bucket.trips > 0 ? bucket.successTrips / bucket.trips : 0;
      out.push(bucket);
    }
    // sort by trips desc so most-sampled conditions float up
    out.sort((a, b) => b.trips - a.trips);
    return out;
  };

  const tideList = computeRates(tideBuckets);
  const windList = computeRates(windBuckets);
  const moonList = computeRates(moonBuckets);
  const daylightList = computeRates(daylightBuckets);

  const computeSpotRates = (
    map: Map<string, SpotBucket>
  ): SpotBucket[] => {
    const out: SpotBucket[] = [];
    for (const bucket of map.values()) {
      bucket.avgBassPerTrip =
        bucket.trips > 0 ? bucket.totalBass / bucket.trips : 0;
      bucket.successRate =
        bucket.trips > 0 ? bucket.successTrips / bucket.trips : 0;
      out.push(bucket);
    }
    // sort by trips desc, then successRate desc
    out.sort((a, b) => {
      if (b.trips !== a.trips) return b.trips - a.trips;
      return b.successRate - a.successRate;
    });
    return out;
  };

  const spotList = computeSpotRates(spotBuckets);

  const pickBest = <T extends { trips: number; successRate: number }>(
    list: T[]
  ): T | undefined => {
    const MIN_TRIPS = 3;
    const filtered = list.filter((b) => b.trips >= MIN_TRIPS);
    if (filtered.length === 0) return undefined;

    return [...filtered].sort((a, b) => {
      if (b.successRate !== a.successRate) {
        return b.successRate - a.successRate;
      }
      return b.trips - a.trips;
    })[0];
  };

  const insights: InsightsResponse = {
    summary: {
      totalTrips,
      totalBass,
      skunkTrips,
      successTrips,
      successRate: totalTrips > 0 ? successTrips / totalTrips : 0,
    },
    tide: {
      buckets: tideList,
      best: pickBest(tideList),
    },
    wind: {
      buckets: windList,
      best: pickBest(windList),
    },
    moon: {
      buckets: moonList,
      best: pickBest(moonList),
    },
    daylight: {
      buckets: daylightList,
      best: pickBest(daylightList),
    },
    spots: {
      buckets: spotList,
      best: pickBest(spotList),
    },
  };

  return NextResponse.json({ insights });
}