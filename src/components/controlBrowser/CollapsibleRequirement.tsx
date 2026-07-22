"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";

const STORAGE_KEY = "control-freak:requirement-expanded";
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

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
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
};

/**
 * Collapsible OSCAL requirement reference. Collapsed by default; preference
 * remembered in localStorage (presentation only).
 */
export function CollapsibleRequirement({
  controlId,
  children,
}: CollapsibleRequirementProps) {
  const expanded = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = useCallback(() => {
    const next = !getSnapshot();
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Ignore quota / private mode failures.
    }
    emitChange();
  }, []);

  const panelId = `requirement-panel-${controlId}`;

  return (
    <section aria-labelledby="requirement-heading" className="min-w-0">
      <button
        type="button"
        id="requirement-heading"
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
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted group-hover:text-text-secondary">
          Requirement
        </span>
        <span className="text-xs text-text-muted">
          {expanded ? "Hide reference" : "Show OSCAL text"}
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
