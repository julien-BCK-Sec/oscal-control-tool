import type { FrameworkControl } from "./types";

const PLACEHOLDER_STATEMENT =
  "[PLACEHOLDER — not official FedRAMP/NIST control text. Replace with authoritative source statement before production use.]";

/**
 * Static FedRAMP Moderate framework controls for the MVP.
 * Identifiers and titles mirror common NIST SP 800-53 / FedRAMP labels;
 * statement bodies are explicitly non-authoritative placeholders.
 */
export const FRAMEWORK_CONTROLS: readonly FrameworkControl[] = [
  {
    id: "ac-1",
    title: "Policy and Procedures",
    family: "Access Control",
    statement: PLACEHOLDER_STATEMENT,
    source: "FedRAMP Moderate",
    sourceVersion: "rev5-placeholder",
  },
  {
    id: "ac-2",
    title: "Account Management",
    family: "Access Control",
    statement: PLACEHOLDER_STATEMENT,
    source: "FedRAMP Moderate",
    sourceVersion: "rev5-placeholder",
  },
  {
    id: "au-2",
    title: "Event Logging",
    family: "Audit and Accountability",
    statement: PLACEHOLDER_STATEMENT,
    source: "FedRAMP Moderate",
    sourceVersion: "rev5-placeholder",
  },
  {
    id: "cm-6",
    title: "Configuration Settings",
    family: "Configuration Management",
    statement: PLACEHOLDER_STATEMENT,
    source: "FedRAMP Moderate",
    sourceVersion: "rev5-placeholder",
  },
  {
    id: "ia-2",
    title: "Identification and Authentication (Organizational Users)",
    family: "Identification and Authentication",
    statement: PLACEHOLDER_STATEMENT,
    source: "FedRAMP Moderate",
    sourceVersion: "rev5-placeholder",
  },
] as const;
