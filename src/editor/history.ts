import type { ControlImplementation } from "@/data/implementation";
import type { ProjectMetadata } from "@/data/project";
import {
  AUTOSAVE_DEBOUNCE_MS,
  EDITOR_HISTORY_LIMIT,
} from "@/persistence/constants";

export { AUTOSAVE_DEBOUNCE_MS };

/** Serializable editor working copy (no framework content). */
export type EditorWorkingCopy = {
  name: string;
  metadata: ProjectMetadata;
  implementations: Record<string, ControlImplementation>;
};

export function cloneWorkingCopy(copy: EditorWorkingCopy): EditorWorkingCopy {
  return {
    name: copy.name,
    metadata: { ...copy.metadata },
    implementations: Object.fromEntries(
      Object.entries(copy.implementations).map(([id, impl]) => [
        id,
        { status: impl.status, narrative: impl.narrative },
      ]),
    ),
  };
}

export function workingCopiesEqual(
  a: EditorWorkingCopy,
  b: EditorWorkingCopy,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Bounded in-session undo/redo. Database revisions are not undo history.
 */
export class EditorHistory {
  private past: EditorWorkingCopy[] = [];
  private future: EditorWorkingCopy[] = [];
  private present: EditorWorkingCopy;
  private readonly limit: number;

  constructor(
    initial: EditorWorkingCopy,
    limit: number = EDITOR_HISTORY_LIMIT,
  ) {
    this.present = cloneWorkingCopy(initial);
    this.limit = Math.max(1, limit);
  }

  getCurrent(): EditorWorkingCopy {
    return cloneWorkingCopy(this.present);
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Push a new present state. Skips no-ops. Clears redo stack.
   * Callers should coalesce rapid typing before calling push.
   */
  push(next: EditorWorkingCopy): void {
    if (workingCopiesEqual(this.present, next)) {
      return;
    }
    this.past.push(cloneWorkingCopy(this.present));
    if (this.past.length > this.limit) {
      this.past.shift();
    }
    this.present = cloneWorkingCopy(next);
    this.future = [];
  }

  /** Replace present without creating a history entry (e.g. after reload). */
  replace(next: EditorWorkingCopy): void {
    this.present = cloneWorkingCopy(next);
    this.past = [];
    this.future = [];
  }

  undo(): EditorWorkingCopy | null {
    const previous = this.past.pop();
    if (!previous) {
      return null;
    }
    this.future.push(cloneWorkingCopy(this.present));
    this.present = previous;
    return this.getCurrent();
  }

  redo(): EditorWorkingCopy | null {
    const next = this.future.pop();
    if (!next) {
      return null;
    }
    this.past.push(cloneWorkingCopy(this.present));
    this.present = next;
    return this.getCurrent();
  }
}

export type AutosaveStatus =
  | "clean"
  | "dirty"
  | "saving"
  | "saved"
  | "error"
  | "conflict";

export function autosaveStatusLabel(status: AutosaveStatus): string {
  switch (status) {
    case "clean":
      return "Saved";
    case "dirty":
      return "Unsaved changes";
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return "Save failed";
    case "conflict":
      return "Conflict";
    default:
      return "Saved";
  }
}
