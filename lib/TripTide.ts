export type TripTide = {
    stationId: string | null;          // NOAA station used for tide data
    heightFt: number | null;           // Tide height at trip start, interpolated
    stageSimple: string | null;        // incoming, outgoing, high, low, slack
    stageDetailed: string | null;      // early_incoming, mid_incoming, late_outgoing, near_high_slack, etc.
    
    raw?: any;                         // entire tide prediction JSON for debugging
  };