/**
 * Calendar-date helpers for Evidence freshness (YYYY-MM-DD, UTC).
 * Matches ControlRecord review-due comparisons (`toISOString().slice(0, 10)`).
 */

import { parseEvidenceDate } from "./validation";

/** UTC calendar date `YYYY-MM-DD` for `now` (default: current instant). */
export function utcTodayIsoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Add a signed day offset to a UTC calendar date.
 * Returns null when `isoDate` is not a valid `YYYY-MM-DD`.
 */
export function addUtcDays(isoDate: string, days: number): string | null {
  const parsed = parseEvidenceDate(isoDate);
  if (parsed === null || parsed === undefined) {
    return null;
  }
  const [year, month, day] = parsed.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
