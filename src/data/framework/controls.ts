import type { FrameworkControl } from "./types";

const PLACEHOLDER_STATEMENT =
  "[PLACEHOLDER — not official NIST SP 800-53 control text. Replace with authoritative catalog statement before production use.]";

/**
 * Small application-facing MVP control subset.
 *
 * This is not an OSCAL catalog, not an OSCAL profile, and not the complete
 * NIST SP 800-53 Rev. 5 Moderate baseline. Identifiers/titles align with the
 * Moderate profile; statement bodies are non-authoritative placeholders.
 * Authoritative baseline content is pinned under vendor/oscal/v1.2.2/.
 */
export const FRAMEWORK_CONTROLS: readonly FrameworkControl[] = [
  {
    id: "ac-1",
    title: "Policy and Procedures",
    family: "Access Control",
    statement: PLACEHOLDER_STATEMENT,
    source: "NIST SP 800-53 Rev. 5 Moderate",
    sourceVersion: "5.2.0-mvp-subset",
  },
  {
    id: "ac-2",
    title: "Account Management",
    family: "Access Control",
    statement: PLACEHOLDER_STATEMENT,
    source: "NIST SP 800-53 Rev. 5 Moderate",
    sourceVersion: "5.2.0-mvp-subset",
  },
  {
    id: "au-2",
    title: "Event Logging",
    family: "Audit and Accountability",
    statement: PLACEHOLDER_STATEMENT,
    source: "NIST SP 800-53 Rev. 5 Moderate",
    sourceVersion: "5.2.0-mvp-subset",
  },
  {
    id: "cm-6",
    title: "Configuration Settings",
    family: "Configuration Management",
    statement: PLACEHOLDER_STATEMENT,
    source: "NIST SP 800-53 Rev. 5 Moderate",
    sourceVersion: "5.2.0-mvp-subset",
  },
  {
    id: "ia-2",
    title: "Identification and Authentication (Organizational Users)",
    family: "Identification and Authentication",
    statement: PLACEHOLDER_STATEMENT,
    source: "NIST SP 800-53 Rev. 5 Moderate",
    sourceVersion: "5.2.0-mvp-subset",
  },
] as const;
