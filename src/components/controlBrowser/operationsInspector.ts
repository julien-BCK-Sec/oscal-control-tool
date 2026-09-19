/**
 * Presentation-only operations inspector open/closed flag.
 * Not canonical project or workflow state.
 */

export const OPERATIONS_INSPECTOR_STORAGE_KEY =
  "control-freak:operations-inspector-expanded";

export function parseOperationsInspectorExpanded(
  raw: string | null | undefined,
  fallback = false,
): boolean {
  if (raw == null || raw.trim() === "") {
    return fallback;
  }
  return raw === "1" || raw.toLowerCase() === "true";
}

export function operationsInspectorSummary(input: {
  ownerLabel: string;
  implementationLabel: string;
  reviewLabel: string;
}): string {
  return `${input.ownerLabel} · ${input.implementationLabel} · ${input.reviewLabel}`;
}
