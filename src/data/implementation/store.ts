import {
  loadImplementationsFromStorage,
  saveImplementationsToStorage,
} from "./storage";
import type { ControlImplementation } from "./types";

type Listener = () => void;

const listeners = new Set<Listener>();

const EMPTY_IMPLEMENTATIONS: Record<string, ControlImplementation> = {};

/**
 * In-memory cache so getSnapshot returns a stable reference between updates.
 * null means localStorage has not been read yet (matches the server snapshot).
 */
let cache: Record<string, ControlImplementation> | null = null;
let hasHydratedFromStorage = false;

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Subscribe for store updates. On first client subscription, load localStorage
 * after the current render so SSR/hydration snapshots stay aligned.
 */
export function subscribeToImplementations(onStoreChange: Listener): () => void {
  listeners.add(onStoreChange);

  if (!hasHydratedFromStorage && typeof window !== "undefined") {
    hasHydratedFromStorage = true;
    cache = loadImplementationsFromStorage();
    queueMicrotask(() => {
      emit();
    });
  }

  return () => {
    listeners.delete(onStoreChange);
  };
}

/** Client snapshot for useSyncExternalStore. */
export function getImplementationsSnapshot(): Record<
  string,
  ControlImplementation
> {
  return cache ?? EMPTY_IMPLEMENTATIONS;
}

/** Server snapshot — empty defaults, no window/localStorage access. */
export function getImplementationsServerSnapshot(): Record<
  string,
  ControlImplementation
> {
  return EMPTY_IMPLEMENTATIONS;
}

export function replaceImplementations(
  next: Record<string, ControlImplementation>,
): void {
  cache = next;
  saveImplementationsToStorage(next);
  emit();
}
