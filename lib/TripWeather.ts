export type TripWeather = {
    // ISO timestamp of the weather reading we ended up using
    timestamp: string | null;
  
    // Wind speed in knots (converted from whatever the API gives us)
    windSpeedKts: number | null;
  
    // Wind direction in degrees (0–360), where 0/360 = North
    windDirDeg: number | null;
  
    // Wind direction as a compass label, e.g. "N", "NE", "SW"
    windDirCardinal: string | null;
  
    // Air temperature in Fahrenheit
    airTempF: number | null;
  
    // High-level condition label, e.g. "Clear", "Cloudy", "Rain"
    conditions: string | null;
  
    // Raw API response (or relevant slice of it) for debugging and deeper analysis
    raw: any;
  };