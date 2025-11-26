// lib/moon.ts
// Moon phase calculation using simplified astronomical formulas.
// Returns: phase_value (0–1), illumination %, and phase name.

export interface MoonPhaseResult {
    phaseValue: number;       // 0–1
    illumination: number;     // 0–1
    phaseName: string;
  }
  
  export function getMoonPhase(date: Date): MoonPhaseResult {
    // Convert to days since known new moon reference (2000-01-06)
    const reference = new Date(Date.UTC(2000, 0, 6, 18, 14)); 
    const diffMs = date.getTime() - reference.getTime();
    const days = diffMs / (1000 * 60 * 60 * 24);
  
    // Synodic month = 29.53058867 days
    const lunarCycle = 29.53058867;
    let phase = (days % lunarCycle) / lunarCycle;
    if (phase < 0) phase += 1;
  
    // Illumination formula
    const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * phase));
  
    // Map to human-readable names
    const phaseName = getPhaseName(phase);
  
    return {
      phaseValue: phase,
      illumination,
      phaseName,
    };
  }
  
  export function getPhaseName(phase: number): string {
    if (phase < 0.03 || phase > 0.97) return "New Moon";
    if (phase < 0.22) return "Waxing Crescent";
    if (phase < 0.28) return "First Quarter";
    if (phase < 0.47) return "Waxing Gibbous";
    if (phase < 0.53) return "Full Moon";
    if (phase < 0.72) return "Waning Gibbous";
    if (phase < 0.78) return "Last Quarter";
    return "Waning Crescent";
  }