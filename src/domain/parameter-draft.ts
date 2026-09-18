/**
 * Assignment fields persist trimmed values. The editor must keep a draft so
 * Space and other in-progress characters are not dropped on each keystroke.
 */

export function persistAssignmentValues(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function assignmentTextFromValues(
  values: readonly string[] | undefined,
): string {
  return values?.join("\n") ?? "";
}

export function displayedAssignmentValue(
  draft: string | null,
  persistedValues: readonly string[] | undefined,
): string {
  if (draft !== null) {
    return draft;
  }
  return assignmentTextFromValues(persistedValues);
}
