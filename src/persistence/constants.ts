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
