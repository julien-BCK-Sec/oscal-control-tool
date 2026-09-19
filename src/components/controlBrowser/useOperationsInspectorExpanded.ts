"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  OPERATIONS_INSPECTOR_STORAGE_KEY,
  parseOperationsInspectorExpanded,
} from "./operationsInspector";

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

function readExpanded(): boolean {
  try {
    return parseOperationsInspectorExpanded(
      window.localStorage.getItem(OPERATIONS_INSPECTOR_STORAGE_KEY),
    );
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function useOperationsInspectorExpanded() {
  const expanded = useSyncExternalStore(
    subscribe,
    readExpanded,
    getServerSnapshot,
  );

  const setExpanded = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(
        OPERATIONS_INSPECTOR_STORAGE_KEY,
        next ? "1" : "0",
      );
    } catch {
      // Quota / private mode — ignore.
    }
    emitChange();
  }, []);

  const toggle = useCallback(() => {
    setExpanded(!readExpanded());
  }, [setExpanded]);

  return { expanded, toggle, setExpanded };
}
