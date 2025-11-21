// lib/tripStorage.ts

import type { Trip } from "@/types/trip";

const STORAGE_KEY = "striperlog_trips_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAllTrips(): Trip[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed as Trip[];
  } catch (err) {
    console.error("Error reading trips:", err);
    return [];
  }
}

function writeTrips(trips: Trip[]) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (err) {
    console.error("Error writing trips:", err);
  }
}

export function saveTrip(trip: Trip) {
  const all = getAllTrips();
  all.push(trip);
  writeTrips(all);
}

export function updateTrip(id: string, updated: Trip) {
  const trips = getAllTrips();
  const index = trips.findIndex((t) => t.id === id);
  if (index === -1) {
    console.warn("Tried to update trip that does not exist:", id);
    return;
  }

  trips[index] = updated;
  writeTrips(trips);
}

export function deleteTrip(id: string) {
  const next = getAllTrips().filter((t) => t.id !== id);
  writeTrips(next);
}

export function clearAllTrips() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
