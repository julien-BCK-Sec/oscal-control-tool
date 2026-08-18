/**
 * Evidence Browser list selection when a deep-link focus is in play.
 */

export function resolveEvidenceListSelection(input: {
  preserveId?: string | null;
  currentId: string | null;
  visibleIds: readonly string[];
}): string | null {
  if (input.preserveId) {
    return input.preserveId;
  }
  if (input.currentId && input.visibleIds.includes(input.currentId)) {
    return input.currentId;
  }
  return input.visibleIds[0] ?? null;
}
