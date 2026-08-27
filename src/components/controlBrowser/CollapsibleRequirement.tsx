"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";

const DEFAULT_STORAGE_KEY = "control-freak:requirement-expanded";
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

function readExpanded(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export type CollapsibleRequirementProps = {
  controlId: string;
  children: ReactNode;
  heading?: string;
  headingId?: string;
  showHint?: string;
  hideHint?: string;
  /** Presentation-only localStorage flag. Defaults collapsed. */
  storageKey?: string;
};

/**
 * Collapsible catalog reference. Collapsed by default; preference remembered
 * in localStorage (presentation only).
 */
export function CollapsibleRequirement({
  controlId,
  children,
  heading = "Requirement",
  headingId = "requirement-heading",
  showHint = "Show OSCAL text",
  hideHint = "Hide reference",
  storageKey = DEFAULT_STORAGE_KEY,
}: CollapsibleRequirementProps) {
  const getSnapshot = useCallback(() => readExpanded(storageKey), [storageKey]);
  const expanded = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = useCallback(() => {
    const next = !readExpanded(storageKey);
    try {
      window.localStorage.setItem(storageKey, next ? "1" : "0");
    } catch {
      // Ignore quota / private mode failures.
    }
    emitChange();
  }, [storageKey]);

  const panelId = `${headingId}-panel-${controlId}`;

  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <button
        type="button"
        id={headingId}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={toggle}
        className="group flex w-full items-center gap-2 rounded-sm py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <span
          aria-hidden="true"
          className="text-[10px] text-text-muted transition-transform group-hover:text-text-secondary"
        >
          {expanded ? "▼" : "▶"}
        </span>
        <span className="text-sm font-semibold tracking-tight text-text-secondary group-hover:text-foreground">
          {heading}
        </span>
        <span className="text-xs text-text-muted">
          {expanded ? hideHint : showHint}
        </span>
      </button>

      {expanded ? (
        <div
          id={panelId}
          className="mt-2 border-l-2 border-border bg-surface-secondary/50 px-4 py-3"
        >
          {children}
        </div>
      ) : (
        <div id={panelId} hidden />
      )}
    </section>
  );
}
