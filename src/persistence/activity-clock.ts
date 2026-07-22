/**
 * Monotonic ISO timestamps for activity stream ordering.
 * Prevents same-millisecond ties when multiple transitions run back-to-back.
 */
let lastActivityMs = 0;

export function nextActivityTimestamp(baseMs = Date.now()): string {
  lastActivityMs = Math.max(lastActivityMs + 1, baseMs);
  return new Date(lastActivityMs).toISOString();
}

/** Test helper: reset the clock (does not travel time backward in wall clock). */
export function resetActivityTimestampClock(): void {
  lastActivityMs = 0;
}
