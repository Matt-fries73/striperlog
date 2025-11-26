import { TripTide } from "@/lib/TripTide";

/**
 * Represents a single tide prediction point.
 */
export type TidePoint = {
  time: string;      // "2023-11-20 06:00" (GMT-ish string)
  heightFt: number;  // Tide height in feet
};

function toMs(t: string): number {
  return new Date(t.replace(" ", "T") + "Z").getTime();
}

/**
 * Find the index of the prediction closest in time to targetMs.
 */
function findClosestIndex(points: TidePoint[], targetMs: number): number {
  let closestIndex = 0;
  let closestDiff = Infinity;

  for (let i = 0; i < points.length; i++) {
    const diff = Math.abs(toMs(points[i].time) - targetMs);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Find local highs and lows (simple 1D maxima/minima).
 */
function findHighsLows(points: TidePoint[]) {
  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = 1; i < points.length - 1; i++) {
    const hPrev = points[i - 1].heightFt;
    const h = points[i].heightFt;
    const hNext = points[i + 1].heightFt;

    if (h > hPrev && h > hNext) {
      highs.push(i);
    } else if (h < hPrev && h < hNext) {
      lows.push(i);
    }
  }

  return { highs, lows };
}

/**
 * Given hourly predictions + a trip start time,
 * compute the tide height, simple stage, and detailed stage.
 */
export function analyzeTideCycle(
  predictions: TidePoint[],
  startedAt: Date
): TripTide | null {
  try {
    if (!predictions || predictions.length === 0) {
      return null;
    }

    // Step 1: sort predictions in time order
    const sorted = [...predictions].sort(
      (a, b) => toMs(a.time) - toMs(b.time)
    );

    const startMs = startedAt.getTime();

    // Step 2: find closest prediction to start time
    const closestIndex = findClosestIndex(sorted, startMs);

    // Height at trip start: just use closest point (hourly is fine)
    const closestPoint = sorted[closestIndex];
    const heightFt = closestPoint.heightFt;

    // Step 3: determine rising/falling (slope) using neighbors
    const prevIndex = Math.max(closestIndex - 1, 0);
    const nextIndex = Math.min(closestIndex + 1, sorted.length - 1);

    const hPrev = sorted[prevIndex].heightFt;
    const hNext = sorted[nextIndex].heightFt;

    const slope = hNext - hPrev;
    let stageSimple: string | null = null;
    let stageDetailed: string | null = null;

    // Step 4: find highs and lows and classify position in the cycle
    const { highs, lows } = findHighsLows(sorted);

    // Find nearest high and low by time
    let nearestHighIndex: number | null = null;
    let nearestLowIndex: number | null = null;
    let nearestHighDiff = Infinity;
    let nearestLowDiff = Infinity;

    for (const idx of highs) {
      const diff = Math.abs(toMs(sorted[idx].time) - startMs);
      if (diff < nearestHighDiff) {
        nearestHighDiff = diff;
        nearestHighIndex = idx;
      }
    }

    for (const idx of lows) {
      const diff = Math.abs(toMs(sorted[idx].time) - startMs);
      if (diff < nearestLowDiff) {
        nearestLowDiff = diff;
        nearestLowIndex = idx;
      }
    }

    // Step 4.1: slack detection near highs/lows
    const SLACK_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

    let isNearHighSlack = false;
    let isNearLowSlack = false;

    if (nearestHighIndex !== null) {
      const tHigh = toMs(sorted[nearestHighIndex].time);
      if (Math.abs(tHigh - startMs) <= SLACK_WINDOW_MS) {
        isNearHighSlack = true;
      }
    }

    if (nearestLowIndex !== null) {
      const tLow = toMs(sorted[nearestLowIndex].time);
      if (Math.abs(tLow - startMs) <= SLACK_WINDOW_MS) {
        isNearLowSlack = true;
      }
    }

    if (isNearHighSlack) {
      stageSimple = "high";
      stageDetailed = "near_high_slack";
    } else if (isNearLowSlack) {
      stageSimple = "low";
      stageDetailed = "near_low_slack";
    } else {
      // Not slack — incoming/outgoing logic
      const rising = slope > 0;
      const falling = slope < 0;

      // Find previous/next highs and lows around the start time
      let prevLow: TidePoint | null = null;
      let nextHigh: TidePoint | null = null;
      let prevHigh: TidePoint | null = null;
      let nextLow: TidePoint | null = null;

      const startTime = startMs;

      for (const idx of lows) {
        const t = toMs(sorted[idx].time);
        if (t <= startTime) {
          if (!prevLow || t > toMs(prevLow.time)) {
            prevLow = sorted[idx];
          }
        } else {
          if (!nextLow || t < toMs(nextLow.time)) {
            nextLow = sorted[idx];
          }
        }
      }

      for (const idx of highs) {
        const t = toMs(sorted[idx].time);
        if (t <= startTime) {
          if (!prevHigh || t > toMs(prevHigh.time)) {
            prevHigh = sorted[idx];
          }
        } else {
          if (!nextHigh || t < toMs(nextHigh.time)) {
            nextHigh = sorted[idx];
          }
        }
      }

      if (rising) {
        stageSimple = "incoming";

        if (prevLow && nextHigh) {
          const tStart = startTime;
          const tStartCycle = toMs(prevLow.time);
          const tEndCycle = toMs(nextHigh.time);

          const progressRaw = (tStart - tStartCycle) / (tEndCycle - tStartCycle);
          const progress = Math.min(Math.max(progressRaw, 0), 1);

          if (progress < 0.33) {
            stageDetailed = "early_incoming";
          } else if (progress < 0.66) {
            stageDetailed = "mid_incoming";
          } else {
            stageDetailed = "late_incoming";
          }
        } else {
          stageDetailed = null;
        }
      } else if (falling) {
        stageSimple = "outgoing";

        if (prevHigh && nextLow) {
          const tStart = startTime;
          const tStartCycle = toMs(prevHigh.time);
          const tEndCycle = toMs(nextLow.time);

          const progressRaw = (tStart - tStartCycle) / (tEndCycle - tStartCycle);
          const progress = Math.min(Math.max(progressRaw, 0), 1);

          if (progress < 0.33) {
            stageDetailed = "early_outgoing";
          } else if (progress < 0.66) {
            stageDetailed = "mid_outgoing";
          } else {
            stageDetailed = "late_outgoing";
          }
        } else {
          stageDetailed = null;
        }
      } else {
        // Very small slope but not near high/low window — treat as slack/unknown
        stageSimple = "slack";
        stageDetailed = null;
      }
    }

    const tide: TripTide = {
      stationId: null, // will be set by caller
      heightFt,
      stageSimple,
      stageDetailed,
      raw: { predictions: sorted },
    };

    return tide;
  } catch (err) {
    console.error("analyzeTideCycle error:", err);
    return null;
  }
}