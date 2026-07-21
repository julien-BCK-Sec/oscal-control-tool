import type { FrameworkControl } from "@/data/framework";
import type { ControlImplementation } from "@/data/implementation";

/**
 * A control is "completed" when its implementation narrative is non-empty
 * after trim. Status alone does not count — empty implemented stubs are incomplete.
 * Centralized so Projects, Overview, and Controls stay consistent.
 */
export function isImplementationComplete(
  implementation: ControlImplementation | undefined | null,
): boolean {
  return Boolean(implementation?.narrative.trim());
}

export type CompletionProgress = {
  completed: number;
  total: number;
  /** 0–100, rounded to nearest integer. 0 when total is 0. */
  percent: number;
};

export function completionPercent(completed: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((completed / total) * 100);
}

export function computeOverallCompletion(
  frameworkControls: readonly FrameworkControl[],
  implementations: Readonly<Record<string, ControlImplementation>>,
): CompletionProgress {
  const total = frameworkControls.length;
  let completed = 0;
  for (const control of frameworkControls) {
    if (isImplementationComplete(implementations[control.id])) {
      completed += 1;
    }
  }
  return {
    completed,
    total,
    percent: completionPercent(completed, total),
  };
}

export type FamilyCompletion = {
  family: string;
  /** Two-letter (or short) family abbreviation derived from control IDs. */
  abbreviation: string;
  completed: number;
  total: number;
  percent: number;
  /** First incomplete control id in framework order, if any. */
  firstIncompleteControlId: string | null;
};

/**
 * Family progress in FrameworkProvider / framework control order.
 * Families appear when first encountered; counts include all controls in that family.
 */
export function computeFamilyCompletion(
  frameworkControls: readonly FrameworkControl[],
  implementations: Readonly<Record<string, ControlImplementation>>,
): FamilyCompletion[] {
  const order: string[] = [];
  const byFamily = new Map<
    string,
    {
      abbreviation: string;
      completed: number;
      total: number;
      firstIncompleteControlId: string | null;
    }
  >();

  for (const control of frameworkControls) {
    let entry = byFamily.get(control.family);
    if (!entry) {
      order.push(control.family);
      entry = {
        abbreviation: familyAbbreviationFromControlId(control.id),
        completed: 0,
        total: 0,
        firstIncompleteControlId: null,
      };
      byFamily.set(control.family, entry);
    }
    entry.total += 1;
    if (isImplementationComplete(implementations[control.id])) {
      entry.completed += 1;
    } else if (entry.firstIncompleteControlId === null) {
      entry.firstIncompleteControlId = control.id;
    }
  }

  return order.map((family) => {
    const entry = byFamily.get(family)!;
    return {
      family,
      abbreviation: entry.abbreviation,
      completed: entry.completed,
      total: entry.total,
      percent: completionPercent(entry.completed, entry.total),
      firstIncompleteControlId: entry.firstIncompleteControlId,
    };
  });
}

/** e.g. `ac-1` → `AC`, `cm-2.1` → `CM`. */
export function familyAbbreviationFromControlId(controlId: string): string {
  const match = /^([a-z]+)-/i.exec(controlId.trim());
  return match ? match[1].toUpperCase() : "";
}

/** First incomplete control in framework order, or null if all complete. */
export function firstIncompleteControlId(
  frameworkControls: readonly FrameworkControl[],
  implementations: Readonly<Record<string, ControlImplementation>>,
): string | null {
  for (const control of frameworkControls) {
    if (!isImplementationComplete(implementations[control.id])) {
      return control.id;
    }
  }
  return null;
}

/** Family with lowest completion percent (ties: first in framework order). */
export function lowestCompletionFamily(
  families: readonly FamilyCompletion[],
): FamilyCompletion | null {
  if (families.length === 0) {
    return null;
  }
  let lowest = families[0];
  for (let i = 1; i < families.length; i += 1) {
    const candidate = families[i];
    if (candidate.percent < lowest.percent) {
      lowest = candidate;
    }
  }
  return lowest;
}

export function formatCompletionCount(progress: CompletionProgress): string {
  return `${progress.completed} of ${progress.total}`;
}
