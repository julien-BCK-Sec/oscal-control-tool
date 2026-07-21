import { isControlImplementation } from "./validation";
import type { ControlImplementation } from "./types";

/** Versioned localStorage key for user implementation data only. */
export const IMPLEMENTATION_STORAGE_KEY =
  "oscal-control-tool.implementations.v1";

const STORAGE_VERSION = 1 as const;

type StoredImplementationsEnvelope = {
  version: typeof STORAGE_VERSION;
  implementations: Record<string, ControlImplementation>;
};

/**
 * Parse and validate raw localStorage JSON.
 * Returns only valid control implementations; invalid payloads yield {}.
 */
export function parseStoredImplementations(
  raw: string | null,
): Record<string, ControlImplementation> {
  if (raw === null || raw.trim() === "") {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  const envelope = parsed as Record<string, unknown>;
  if (envelope.version !== STORAGE_VERSION) {
    return {};
  }

  if (
    envelope.implementations === null ||
    typeof envelope.implementations !== "object" ||
    Array.isArray(envelope.implementations)
  ) {
    return {};
  }

  const implementations: Record<string, ControlImplementation> = {};
  for (const [controlId, value] of Object.entries(envelope.implementations)) {
    if (typeof controlId !== "string" || controlId.trim() === "") {
      continue;
    }
    if (!isControlImplementation(value)) {
      continue;
    }
    implementations[controlId] = {
      status: value.status,
      narrative: value.narrative,
    };
  }

  return implementations;
}

/** Load validated implementation data from localStorage. Safe for client-only use. */
export function loadImplementationsFromStorage(): Record<
  string,
  ControlImplementation
> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return parseStoredImplementations(
      window.localStorage.getItem(IMPLEMENTATION_STORAGE_KEY),
    );
  } catch {
    return {};
  }
}

/** Persist implementation data to localStorage. No-ops on failure. */
export function saveImplementationsToStorage(
  implementations: Record<string, ControlImplementation>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const envelope: StoredImplementationsEnvelope = {
    version: STORAGE_VERSION,
    implementations,
  };

  try {
    window.localStorage.setItem(
      IMPLEMENTATION_STORAGE_KEY,
      JSON.stringify(envelope),
    );
  } catch {
    // Quota errors or disabled storage must not crash the editor.
  }
}
