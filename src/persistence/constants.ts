/** Autosave debounce after the last edit (ms). */
export const AUTOSAVE_DEBOUNCE_MS = 1500;

/** Maximum undo/redo history entries in the editor session. */
export const EDITOR_HISTORY_LIMIT = 75;

/** Minimum interval between automatic snapshots during active editing. */
export const AUTOMATIC_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;

/** Keep at most this many automatic snapshots per project. */
export const AUTOMATIC_SNAPSHOT_RETENTION = 30;

/** Keep at most this many pre-restore safety snapshots per project. */
export const PRE_RESTORE_SNAPSHOT_RETENTION = 20;

/**
 * Marker written to localStorage after a successful one-time import.
 * Legacy keys are never deleted automatically.
 */
export const LOCAL_STORAGE_MIGRATION_MARKER_KEY =
  "oscal-control-tool.db-migration.v1";

export const LEGACY_PROJECT_METADATA_STORAGE_KEY =
  "oscal-control-tool.project-metadata.v1";

export const LEGACY_IMPLEMENTATION_STORAGE_KEY =
  "oscal-control-tool.implementations.v1";
