import { DEFAULT_PROJECT_METADATA } from "./defaults";
import { normalizeProjectMetadata } from "./validation";
import type { ProjectMetadata } from "./types";

/** Versioned localStorage key for project metadata only. */
export const PROJECT_METADATA_STORAGE_KEY =
  "oscal-control-tool.project-metadata.v1";

const STORAGE_VERSION = 1 as const;

type StoredProjectMetadataEnvelope = {
  version: typeof STORAGE_VERSION;
  metadata: ProjectMetadata;
};

/**
 * Parse and validate raw localStorage JSON.
 * Missing, malformed, or incompatible payloads yield empty defaults.
 */
export function parseStoredProjectMetadata(raw: string | null): ProjectMetadata {
  if (raw === null || raw.trim() === "") {
    return { ...DEFAULT_PROJECT_METADATA };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_PROJECT_METADATA };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ...DEFAULT_PROJECT_METADATA };
  }

  const envelope = parsed as Record<string, unknown>;
  if (envelope.version !== STORAGE_VERSION) {
    return { ...DEFAULT_PROJECT_METADATA };
  }

  return normalizeProjectMetadata(envelope.metadata);
}

/** Load validated project metadata from localStorage. Client-only. */
export function loadProjectMetadataFromStorage(): ProjectMetadata {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PROJECT_METADATA };
  }

  try {
    return parseStoredProjectMetadata(
      window.localStorage.getItem(PROJECT_METADATA_STORAGE_KEY),
    );
  } catch {
    return { ...DEFAULT_PROJECT_METADATA };
  }
}

/** Persist project metadata to localStorage. No-ops on failure. */
export function saveProjectMetadataToStorage(metadata: ProjectMetadata): void {
  if (typeof window === "undefined") {
    return;
  }

  const envelope: StoredProjectMetadataEnvelope = {
    version: STORAGE_VERSION,
    metadata,
  };

  try {
    window.localStorage.setItem(
      PROJECT_METADATA_STORAGE_KEY,
      JSON.stringify(envelope),
    );
  } catch {
    // Quota errors or disabled storage must not crash the editor.
  }
}
