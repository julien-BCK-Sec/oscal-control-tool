import type { FipsImpactLevel } from "@/data/project";
import { FIPS_IMPACT_LABELS } from "./labels";
import type { SspDerivedOverallImpact } from "./types";

const IMPACT_RANK: Record<FipsImpactLevel, number> = {
  low: 1,
  moderate: 2,
  high: 3,
};

/**
 * FIPS 200 high-water mark of authored system-level CIA values.
 * Callers must pass all three; this does not read information types.
 */
export function deriveOverallImpact(
  confidentiality: FipsImpactLevel,
  integrity: FipsImpactLevel,
  availability: FipsImpactLevel,
): SspDerivedOverallImpact {
  let level: FipsImpactLevel = "low";
  for (const value of [confidentiality, integrity, availability]) {
    if (IMPACT_RANK[value] > IMPACT_RANK[level]) {
      level = value;
    }
  }
  return {
    level,
    label: FIPS_IMPACT_LABELS[level],
    derivationNote:
      "Derived overall impact is the high-water mark of the authored system confidentiality, integrity, and availability values. It is not persisted and is not inferred from information types or framework selection.",
  };
}
