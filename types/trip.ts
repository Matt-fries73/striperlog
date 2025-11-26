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

  // Enrichment fields (added by backend)
  env_source?: string | null;
  env_timestamp?: string | null;
  env_wind_speed_kts?: number | null;
  env_wind_dir_cardinal?: string | null;
  env_wind_dir_deg?: number | null;
  env_air_temp_f?: number | null;
  env_tide_stage_simple?: string | null;
  env_tide_stage_detailed?: string | null;
  env_tide_height_ft?: number | null;
  env_tide_station_id?: string | null;
  env_moon_phase_name?: string | null;
  env_moon_phase_value?: number | null;
  env_moon_illumination?: number | null;
  env_sunrise_utc?: string | null;
  env_sunset_utc?: string | null;
  env_daylight_stage?: string | null;
}

