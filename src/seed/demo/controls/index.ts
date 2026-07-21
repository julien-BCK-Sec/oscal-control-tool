import { FRAMEWORK, FRAMEWORK_CONTROLS } from "@/data/framework";
import type { ControlImplementation } from "@/data/implementation";
import { accessControlNarratives } from "./access-control";
import { acquisitionNarratives } from "./acquisition";
import { assessmentAuthorizationNarratives } from "./assessment-authorization";
import { auditAccountabilityNarratives } from "./audit-accountability";
import { awarenessTrainingNarratives } from "./awareness-training";
import { communicationsProtectionNarratives } from "./communications-protection";
import { configurationManagementNarratives } from "./configuration-management";
import { contingencyPlanningNarratives } from "./contingency-planning";
import { featuredNarratives } from "./featured";
import { identificationAuthenticationNarratives } from "./identification-authentication";
import { incidentResponseNarratives } from "./incident-response";
import { maintenanceNarratives } from "./maintenance";
import { mediaProtectionNarratives } from "./media-protection";
import { personnelSecurityNarratives } from "./personnel-security";
import { physicalEnvironmentalNarratives } from "./physical-environmental";
import { planningNarratives } from "./planning";
import { riskAssessmentNarratives } from "./risk-assessment";
import { supplyChainNarratives } from "./supply-chain";
import { systemIntegrityNarratives } from "./system-integrity";
import type { DemoNarrativeMap } from "./types";

export type { DemoNarrativeMap } from "./types";
export { featuredNarratives } from "./featured";

function mergeNarrativeMaps(
  maps: readonly DemoNarrativeMap[],
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const map of maps) {
    for (const [controlId, narrative] of Object.entries(map)) {
      if (Object.prototype.hasOwnProperty.call(merged, controlId)) {
        throw new Error(
          `Duplicate demo narrative for control "${controlId}".`,
        );
      }
      if (!narrative.trim()) {
        throw new Error(`Empty demo narrative for control "${controlId}".`);
      }
      merged[controlId] = narrative;
    }
  }
  return merged;
}

/** All curated narratives (featured + family modules), unordered. */
export function collectDemoNarratives(): Record<string, string> {
  return mergeNarrativeMaps([
    featuredNarratives(),
    accessControlNarratives(),
    awarenessTrainingNarratives(),
    auditAccountabilityNarratives(),
    assessmentAuthorizationNarratives(),
    configurationManagementNarratives(),
    contingencyPlanningNarratives(),
    identificationAuthenticationNarratives(),
    incidentResponseNarratives(),
    maintenanceNarratives(),
    mediaProtectionNarratives(),
    physicalEnvironmentalNarratives(),
    planningNarratives(),
    personnelSecurityNarratives(),
    riskAssessmentNarratives(),
    acquisitionNarratives(),
    communicationsProtectionNarratives(),
    systemIntegrityNarratives(),
    supplyChainNarratives(),
  ]);
}

export type BaselineNarrativeCoverage = {
  frameworkId: string;
  baselineCount: number;
  narrativeCount: number;
  missingIds: string[];
  unknownIds: string[];
  duplicateIds: string[];
};

/**
 * Compare curated narratives against FrameworkProvider controls.
 * Count is never hardcoded — it comes from the configured baseline.
 */
export function analyzeDemoNarrativeCoverage(
  narratives: Readonly<Record<string, string>> = collectDemoNarratives(),
): BaselineNarrativeCoverage {
  const baselineIds = FRAMEWORK_CONTROLS.map((control) => control.id);
  const baselineSet = new Set(baselineIds);
  const narrativeIds = Object.keys(narratives);
  const seen = new Set<string>();
  const duplicateIds: string[] = [];

  for (const id of narrativeIds) {
    if (seen.has(id)) {
      duplicateIds.push(id);
    }
    seen.add(id);
  }

  const missingIds = baselineIds.filter((id) => !seen.has(id));
  const unknownIds = narrativeIds.filter((id) => !baselineSet.has(id));

  return {
    frameworkId: FRAMEWORK.id,
    baselineCount: baselineIds.length,
    narrativeCount: seen.size,
    missingIds,
    unknownIds,
    duplicateIds,
  };
}

/**
 * Full baseline implementations in FrameworkProvider order.
 */
export function buildCompleteDemoImplementations(): Record<
  string,
  ControlImplementation
> {
  const narratives = collectDemoNarratives();
  const coverage = analyzeDemoNarrativeCoverage(narratives);
  if (
    coverage.missingIds.length > 0 ||
    coverage.unknownIds.length > 0 ||
    coverage.duplicateIds.length > 0 ||
    coverage.narrativeCount !== coverage.baselineCount
  ) {
    throw new Error(
      [
        "Demo narratives do not exactly match the configured baseline.",
        `baseline=${coverage.baselineCount}`,
        `narratives=${coverage.narrativeCount}`,
        `missing=${coverage.missingIds.join(",") || "(none)"}`,
        `unknown=${coverage.unknownIds.join(",") || "(none)"}`,
        `duplicates=${coverage.duplicateIds.join(",") || "(none)"}`,
      ].join(" "),
    );
  }

  const implementations: Record<string, ControlImplementation> = {};
  for (const control of FRAMEWORK_CONTROLS) {
    implementations[control.id] = {
      status: "implemented",
      narrative: narratives[control.id],
    };
  }
  return implementations;
}

export function familyImplementationCounts(
  implementations: Readonly<Record<string, ControlImplementation>>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const control of FRAMEWORK_CONTROLS) {
    if (!implementations[control.id]) {
      continue;
    }
    counts[control.family] = (counts[control.family] ?? 0) + 1;
  }
  return counts;
}
