import type { ControlImplementation, ImplementationStatus } from "./types";

export const IMPLEMENTATION_STATUSES: readonly ImplementationStatus[] = [
  "not-started",
  "in-progress",
  "implemented",
  "not-applicable",
] as const;

export function isImplementationStatus(
  value: unknown,
): value is ImplementationStatus {
  return (
    typeof value === "string" &&
    (IMPLEMENTATION_STATUSES as readonly string[]).includes(value)
  );
}

export function isControlImplementation(
  value: unknown,
): value is ControlImplementation {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    isImplementationStatus(record.status) && typeof record.narrative === "string"
  );
}
