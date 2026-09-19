/**
 * Presentation-only disclosure helpers. Not project/canonical state.
 */

export type AuthoringDisclosureState = {
  expanded: boolean;
  headingId: string;
  panelId: string;
};

export function authoringDisclosurePanelId(headingId: string): string {
  return `${headingId}-panel`;
}

export function nextAuthoringDisclosureExpanded(
  current: boolean,
  key: string,
): boolean {
  if (key === "Enter" || key === " " || key === "Spacebar") {
    return !current;
  }
  return current;
}

export function authoringDisclosureToggleLabel(
  expanded: boolean,
  expandHint: string,
  collapseHint: string,
): string {
  return expanded ? collapseHint : expandHint;
}
