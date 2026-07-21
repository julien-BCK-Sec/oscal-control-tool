import { DEFAULT_PROJECT_METADATA } from "./defaults";
import {
  loadProjectMetadataFromStorage,
  saveProjectMetadataToStorage,
} from "./storage";
import type { ProjectMetadata } from "./types";

type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * In-memory cache so getSnapshot returns a stable reference between updates.
 * null means localStorage has not been read yet (matches the server snapshot).
 */
let cache: ProjectMetadata | null = null;
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
export function subscribeToProjectMetadata(
  onStoreChange: Listener,
): () => void {
  listeners.add(onStoreChange);

  if (!hasHydratedFromStorage && typeof window !== "undefined") {
    hasHydratedFromStorage = true;
    cache = loadProjectMetadataFromStorage();
    queueMicrotask(() => {
      emit();
    });
  }

  return () => {
    listeners.delete(onStoreChange);
  };
}

/** Client snapshot for useSyncExternalStore. */
export function getProjectMetadataSnapshot(): ProjectMetadata {
  return cache ?? DEFAULT_PROJECT_METADATA;
}

/** Server snapshot — empty defaults, no window/localStorage access. */
export function getProjectMetadataServerSnapshot(): ProjectMetadata {
  return DEFAULT_PROJECT_METADATA;
}

export function replaceProjectMetadata(next: ProjectMetadata): void {
  cache = next;
  saveProjectMetadataToStorage(next);
  emit();
}
