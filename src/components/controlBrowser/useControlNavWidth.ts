"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import {
  CONTROL_NAV_WIDTH_DEFAULT,
  clampControlNavWidth,
  readStoredControlNavWidth,
  writeStoredControlNavWidth,
} from "./navWidth";

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): number {
  return readStoredControlNavWidth();
}

function getServerSnapshot(): number {
  return CONTROL_NAV_WIDTH_DEFAULT;
}

export function useControlNavWidth() {
  const stored = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [draft, setDraft] = useState<number | null>(null);
  const width = draft ?? stored;

  const preview = useCallback(
    (next: number, containerWidth: number | null = null) => {
      setDraft(clampControlNavWidth(next, containerWidth));
    },
    [],
  );

  const commit = useCallback(
    (next: number, containerWidth: number | null = null) => {
      const clamped = clampControlNavWidth(next, containerWidth);
      writeStoredControlNavWidth(clamped);
      emitChange();
      setDraft(null);
    },
    [],
  );

  return { width, preview, commit };
}
