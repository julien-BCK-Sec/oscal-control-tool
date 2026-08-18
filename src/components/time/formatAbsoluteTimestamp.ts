/**
 * Hydration-safe absolute timestamps.
 *
 * `toLocaleString()` without an explicit locale/timeZone follows the runtime
 * locale, so Node SSR and the browser can emit different strings for the same
 * instant (e.g. "2026-08-18, 5:15:48 p.m." vs "8/18/2026, 5:15:48 PM").
 */

const DETERMINISTIC_LOCALE = "en-US";

const UTC_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
};

const LOCAL_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

export type AbsoluteTimestampMode = "utc" | "local";

export function parseTimestampMs(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function timestampDateTimeAttr(value: string): string | undefined {
  const parsed = parseTimestampMs(value);
  return parsed === null ? undefined : new Date(parsed).toISOString();
}

/**
 * Format an ISO timestamp.
 * `utc` is deterministic across server and client (safe for SSR HTML).
 * `local` uses the runtime locale and timezone (browser-only after hydration).
 */
export function formatAbsoluteTimestamp(
  value: string,
  mode: AbsoluteTimestampMode,
): string {
  const parsed = parseTimestampMs(value);
  if (parsed === null) {
    return value;
  }
  const date = new Date(parsed);
  if (mode === "utc") {
    return new Intl.DateTimeFormat(DETERMINISTIC_LOCALE, UTC_FORMAT).format(date);
  }
  return new Intl.DateTimeFormat(undefined, LOCAL_FORMAT).format(date);
}
