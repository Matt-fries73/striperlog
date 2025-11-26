// lib/spots.ts
// Canonical list of known NJ spots + their tide stations + approx coords.

export type SpotMeta = {
    label: string;          // Display name (what you see in the UI)
    stationId: string;      // NOAA tide station ID to use for this spot
    lat?: number | null;    // Approx lat for future use (map, precise enrichment)
    lon?: number | null;    // Approx lon
  };
  
  // Helper to keep labels consistent (trim, collapse spaces, lowercase)
  function normalizeLabel(label: string): string {
    return label.trim().toLowerCase();
  }
  
  // Starter set of spots you actually fish.
  // We can expand this later; for now keep it tight + real.
  export const SPOTS: SpotMeta[] = [
    {
      label: "Sea Bright Jetty 6",
      stationId: "8531680",      // Sandy Hook
      lat: 40.357,               // approx
      lon: -73.974,
    },
    {
      label: "Sandy Hook – North Beach",
      stationId: "8531680",      // Sandy Hook
      lat: 40.465,
      lon: -74.0,
    },
    {
      label: "Seven Presidents",
      stationId: "8531680",      // still close enough to Sandy Hook for now
      lat: 40.282,
      lon: -73.974,
    },
    {
      label: "Manasquan Inlet – North Jetty",
      stationId: "8530580",      // Manasquan River station
      lat: 40.104,
      lon: -74.037,
    },
  ];
  
  // Look up a spot by label (case-insensitive).
  export function getSpotMeta(label: string | null | undefined): SpotMeta | undefined {
    if (!label) return undefined;
    const norm = normalizeLabel(label);
    return SPOTS.find((s) => normalizeLabel(s.label) === norm);
  }
  
  // Get the station ID for a given spot label,
  // or undefined if we don't know this spot.
  export function getStationIdForSpot(label: string | null | undefined): string | undefined {
    const meta = getSpotMeta(label);
    return meta?.stationId;
  }