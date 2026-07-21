import type { ImplementationStatus } from "@/data/implementation";
import type { OscalImplementationStatusState } from "./types";

/**
 * Maps internal implementation status to an OSCAL implementation-status state
 * only when the mapping is clear. Returns null when there is no safe mapping.
 *
 * Clear mappings:
 * - implemented → implemented
 * - not-applicable → not-applicable
 * - in-progress → partial (work underway, not fully implemented)
 *
 * Omitted:
 * - not-started (no matching OSCAL allowed value)
 */
export function mapImplementationStatusToOscal(
  status: ImplementationStatus,
): OscalImplementationStatusState | null {
  switch (status) {
    case "implemented":
      return "implemented";
    case "not-applicable":
      return "not-applicable";
    case "in-progress":
      return "partial";
    case "not-started":
      return null;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
