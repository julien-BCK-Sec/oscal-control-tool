/**
 * Control-navigation pane width (presentation only).
 * Persisted in localStorage like theme preference — never in PostgreSQL.
 */

export const CONTROL_NAV_WIDTH_STORAGE_KEY = "cf-control-nav-width";

/** Minimum pane width so IDs, titles, and badges remain usable (16rem). */
export const CONTROL_NAV_WIDTH_MIN = 256;

/** Maximum pane width so the editor stays usable (35rem). */
export const CONTROL_NAV_WIDTH_MAX = 560;

/** Matches `--layout-nav` (22rem). */
export const CONTROL_NAV_WIDTH_DEFAULT = 352;

export const CONTROL_NAV_WIDTH_KEYBOARD_STEP = 16;

/** Leave at least this much room for the control editor when clamping. */
export const CONTROL_NAV_EDITOR_MIN = 384;

export function clampControlNavWidth(
  width: number,
  containerWidth: number | null = null,
): number {
  let max = CONTROL_NAV_WIDTH_MAX;
  if (containerWidth != null && Number.isFinite(containerWidth)) {
    const roomForEditor = Math.max(
      CONTROL_NAV_WIDTH_MIN,
      containerWidth - CONTROL_NAV_EDITOR_MIN,
    );
    max = Math.min(max, roomForEditor);
  }
  if (!Number.isFinite(width)) {
    return Math.min(max, CONTROL_NAV_WIDTH_DEFAULT);
  }
  return Math.min(max, Math.max(CONTROL_NAV_WIDTH_MIN, Math.round(width)));
}

export function parseStoredControlNavWidth(
  raw: string | null | undefined,
): number {
  if (raw == null || raw.trim() === "") {
    return CONTROL_NAV_WIDTH_DEFAULT;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return CONTROL_NAV_WIDTH_DEFAULT;
  }
  return clampControlNavWidth(parsed);
}

export function nextControlNavWidthFromKey(
  key: string,
  current: number,
  containerWidth: number | null = null,
): number | null {
  if (key === "ArrowLeft") {
    return clampControlNavWidth(
      current - CONTROL_NAV_WIDTH_KEYBOARD_STEP,
      containerWidth,
    );
  }
  if (key === "ArrowRight") {
    return clampControlNavWidth(
      current + CONTROL_NAV_WIDTH_KEYBOARD_STEP,
      containerWidth,
    );
  }
  if (key === "Home") {
    return clampControlNavWidth(CONTROL_NAV_WIDTH_MIN, containerWidth);
  }
  if (key === "End") {
    return clampControlNavWidth(CONTROL_NAV_WIDTH_MAX, containerWidth);
  }
  return null;
}

function defaultStorage(): Pick<Storage, "getItem" | "setItem"> | null {
  if (typeof globalThis === "undefined") {
    return null;
  }
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readStoredControlNavWidth(
  storage: Pick<Storage, "getItem"> | null | undefined = defaultStorage(),
): number {
  if (!storage) {
    return CONTROL_NAV_WIDTH_DEFAULT;
  }
  try {
    return parseStoredControlNavWidth(
      storage.getItem(CONTROL_NAV_WIDTH_STORAGE_KEY),
    );
  } catch {
    return CONTROL_NAV_WIDTH_DEFAULT;
  }
}

export function writeStoredControlNavWidth(
  width: number,
  storage: Pick<Storage, "setItem"> | null | undefined = defaultStorage(),
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(
      CONTROL_NAV_WIDTH_STORAGE_KEY,
      String(clampControlNavWidth(width)),
    );
  } catch {
    // Quota / private mode — width still applies for this session via state.
  }
}
