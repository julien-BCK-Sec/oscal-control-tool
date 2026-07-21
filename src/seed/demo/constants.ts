/** Stable display name used to locate the canonical demo project. */
export const DEMO_PROJECT_NAME =
  "Strategic Goose Operations Platform (Demo)" as const;

/** Named version milestones created by the demo seed (in order). */
export const DEMO_SNAPSHOT_NAMES = [
  "Initial Authorization Package",
  "Management Review",
  "Goose Readiness Exercise 2026",
  "Emergency Coconut Reconciliation",
  "Gary's Annual Performance Review",
] as const;

export type DemoSnapshotName = (typeof DEMO_SNAPSHOT_NAMES)[number];

/**
 * Control IDs authored for the demo, spanning multiple 800-53 families.
 * All must exist in the NIST Moderate framework.
 */
export const DEMO_CONTROL_IDS = [
  "ac-1",
  "ac-2",
  "ac-3",
  "ac-6",
  "at-1",
  "at-2",
  "au-2",
  "au-6",
  "cm-2",
  "cm-6",
  "cp-2",
  "cp-9",
  "ia-2",
  "ia-5",
  "ir-4",
  "ir-6",
  "pe-3",
  "pl-2",
  "ra-3",
  "si-4",
] as const;

export type DemoControlId = (typeof DEMO_CONTROL_IDS)[number];
