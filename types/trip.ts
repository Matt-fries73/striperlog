// types/trip.ts

export type TideStage = "incoming" | "outgoing" | "high" | "low" | "slack" | "unknown";

export type WindDir =
  | "N" | "NE" | "E" | "SE" | "S"
  | "SW" | "W" | "NW" | "VAR" | "unknown";

export type WaterClarity = "clean" | "stained" | "dirty" | "unknown";

export type SizeBucket = "schoolie" | "slot" | "over_slot" | "cow" | "unknown";

export interface Trip {
  id: string;
  createdAt: string;
  startedAt: string;
  endedAt: string | null;

  spotLabel: string;
  lat: number | null;
  lon: number | null;

  tideStage: TideStage;
  windDir: WindDir;
  windSpeedKts: number | null;
  waterClarity: WaterClarity;
  waterTempF: number | null;

  lureType: string;
  numBass: number;
  bestSizeIn: number | null;
  sizeBucket: SizeBucket;
  skunk: boolean;

  notes: string;
}

