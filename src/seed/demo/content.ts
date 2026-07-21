import { FRAMEWORK, FRAMEWORK_CONTROLS } from "@/data/framework";
import type { ControlImplementation } from "@/data/implementation";
import { isControlImplementation } from "@/data/implementation";
import type { ProjectMetadata } from "@/data/project";
import { isProjectMetadata } from "@/data/project";
import {
  DEMO_CONTROL_IDS,
  DEMO_SNAPSHOT_NAMES,
  type DemoControlId,
} from "./constants";
import {
  analyzeDemoNarrativeCoverage,
  buildCompleteDemoImplementations,
  featuredNarratives,
} from "./controls";
import {
  DEMO_COMPONENTS,
  DEMO_LEVERAGED_SERVICES,
  DEMO_LOCATIONS,
  DEMO_ORGANIZATION,
  DEMO_PEOPLE,
  DEMO_PROCEDURES,
  DEMO_SECURITY_CATEGORIZATION,
  DEMO_SYSTEM,
  DEMO_TEAMS,
  DEMO_TERMS,
  DEMO_USERS,
  DEMO_INVENTORY,
} from "./world";

const {
  garyMercer,
  margotChen,
  brendanWalsh,
  priyaSharma,
  dougBillings,
  samOkonkwo,
  rileyNguyen,
  averyPatel,
  jordanMacLeod,
  caseyTremblay,
  morganEllis,
  taylorReid,
  nadiaFortin,
  helenCrowe,
  steveKowalski,
} = DEMO_PEOPLE;

/**
 * Early seed stages grow featured controls so named snapshots capture progress.
 * The final stage loads the complete FrameworkProvider baseline.
 */
export const DEMO_STAGE_CONTROL_IDS: readonly (readonly DemoControlId[])[] = [
  ["ac-1", "pl-2", "ra-3"],
  ["ac-1", "pl-2", "ra-3", "at-1", "at-2", "pe-3", "ia-2", "ia-5"],
  [
    "ac-1",
    "pl-2",
    "ra-3",
    "at-1",
    "at-2",
    "pe-3",
    "ia-2",
    "ia-5",
    "cp-2",
    "cp-9",
    "ir-4",
    "ir-6",
  ],
  [
    "ac-1",
    "pl-2",
    "ra-3",
    "at-1",
    "at-2",
    "pe-3",
    "ia-2",
    "ia-5",
    "cp-2",
    "cp-9",
    "ir-4",
    "ir-6",
    "cm-2",
    "cm-6",
    "au-2",
    "au-6",
    "si-4",
  ],
] as const;

const FINAL_STAGE_INDEX = DEMO_SNAPSHOT_NAMES.length - 1;

function buildSystemDescription(): string {
  const boundary = [
    `Authorization boundary: ${DEMO_SYSTEM.name} (${DEMO_SYSTEM.shortName}) includes ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.goosePortal.name}, ${DEMO_COMPONENTS.deploymentApi.name}, ${DEMO_COMPONENTS.gooseRegistry.name}, ${DEMO_COMPONENTS.honkCoordination.name}, ${DEMO_COMPONENTS.nestWatch.name}, ${DEMO_COMPONENTS.featherAuth.name}, ${DEMO_COMPONENTS.cims.name}, ${DEMO_COMPONENTS.missionConsole.name}, ${DEMO_COMPONENTS.operatorWorkstations.name}, ${DEMO_COMPONENTS.telemetry.name}, and ${DEMO_COMPONENTS.backupRepo.name}.`,
    `These components operate primarily within ${DEMO_LOCATIONS.missionControl.name} at ${DEMO_LOCATIONS.nhoc.name} (${DEMO_LOCATIONS.honkwater.name}, ${DEMO_LOCATIONS.honkwater.region}), with ${DEMO_COMPONENTS.honkNet.name} extending connectivity to ${DEMO_LOCATIONS.borderPost17.name}, ${DEMO_LOCATIONS.stagingAlpha.name}, ${DEMO_LOCATIONS.coconutVault.name}, and approved ${DEMO_COMPONENTS.mobileTerminals.name}.`,
    `${DEMO_COMPONENTS.rfc1149Gateway.name} at ${DEMO_LOCATIONS.disasterRecoveryPond.name} is inside the contingency boundary only when HonkNet is declared unavailable.`,
    `Outside the boundary: ${DEMO_LEVERAGED_SERVICES.sharedServicesIdentity}; ${DEMO_LEVERAGED_SERVICES.weatherFeed}; ${DEMO_LEVERAGED_SERVICES.northernMaple}.`,
  ].join(" ");

  const categorization = [
    `Security categorization: Confidentiality ${DEMO_SECURITY_CATEGORIZATION.confidentiality}; Integrity ${DEMO_SECURITY_CATEGORIZATION.integrity}; Availability ${DEMO_SECURITY_CATEGORIZATION.availability}.`,
    DEMO_SECURITY_CATEGORIZATION.rationale,
  ].join(" ");

  const roles = [
    `Responsible roles: ${garyMercer.name} (${garyMercer.role}); ${brendanWalsh.name} (${brendanWalsh.role}); ${margotChen.name} (${margotChen.role}); ${priyaSharma.name} (${priyaSharma.role}); ${nadiaFortin.name} (${nadiaFortin.role}); ${dougBillings.name} (${dougBillings.role}); ${averyPatel.name} (${averyPatel.role}); ${rileyNguyen.name} (${rileyNguyen.role}); ${samOkonkwo.name} (${samOkonkwo.role}); ${morganEllis.name} (${morganEllis.role}); ${caseyTremblay.name} (${caseyTremblay.role}); ${jordanMacLeod.name} (${jordanMacLeod.role}); ${helenCrowe.name} (${helenCrowe.role}); ${taylorReid.name} (${taylorReid.role}); ${steveKowalski.name} (${steveKowalski.role}).`,
  ].join(" ");

  const users = [
    `System users: ${DEMO_USERS.operators}; ${DEMO_USERS.watchFloor}; ${DEMO_USERS.securityAnalysts}; ${DEMO_USERS.fieldResponders}; ${DEMO_USERS.logistics}; ${DEMO_USERS.veterinary}; ${DEMO_USERS.facilities}; ${DEMO_USERS.contractors}.`,
  ].join(" ");

  const inventory = [
    `Inventory highlights: ${DEMO_INVENTORY.fieldTablets}; ${DEMO_INVENTORY.radios}; ${DEMO_INVENTORY.coconutReserve}; ${DEMO_INVENTORY.badgePrinters}; ${DEMO_INVENTORY.stagingKits}.`,
  ].join(" ");

  const facilities = [
    `Facilities: ${DEMO_LOCATIONS.honkwater.name}; ${DEMO_LOCATIONS.nhoc.name}; ${DEMO_LOCATIONS.missionControl.name}; ${DEMO_LOCATIONS.borderPost17.name}; ${DEMO_LOCATIONS.coconutVault.name}; ${DEMO_LOCATIONS.stagingAlpha.name}; ${DEMO_LOCATIONS.secondaryNest.name}; ${DEMO_LOCATIONS.disasterRecoveryPond.name}; ${DEMO_LOCATIONS.moltingFacility.name}.`,
  ].join(" ");

  const diagrams = [
    `Diagrams: HonkNet topology and SGOP data-flow diagrams are maintained by ${caseyTremblay.name} (${DEMO_TEAMS.acu}) and reviewed at ${DEMO_TERMS.garyReview}. Facility and Nest Perimeter diagrams for ${DEMO_LOCATIONS.honkwater.name} and ${DEMO_LOCATIONS.borderPost17.name} are held by ${dougBillings.name}. Operational runbooks that lack a current owner are filed under ${DEMO_PROCEDURES.seeSteve}.`,
  ].join(" ");

  return [
    DEMO_ORGANIZATION.mission,
    `${DEMO_SYSTEM.name} (${DEMO_SYSTEM.shortName}) is the primary information system supporting ${DEMO_TERMS.strategicGooseCapability} for ${DEMO_ORGANIZATION.name} (${DEMO_ORGANIZATION.shortName}).`,
    boundary,
    categorization,
    roles,
    users,
    facilities,
    inventory,
    diagrams,
  ].join("\n\n");
}

export function buildDemoMetadata(): ProjectMetadata {
  return {
    organizationName: DEMO_ORGANIZATION.name,
    systemName: DEMO_SYSTEM.name,
    systemDescription: buildSystemDescription(),
  };
}

/** Formal statement appended only at the final named-version stage. */
const GARY_VETERINARY_CLEARANCE =
  `${garyMercer.name} successfully completed his annual veterinary examination and remains cleared for operational deployment.`;

function buildFeaturedImplementationsForStage(
  stageIndex: number,
): Record<string, ControlImplementation> {
  const ids = DEMO_STAGE_CONTROL_IDS[stageIndex];
  if (!ids) {
    throw new Error(`Invalid demo seed stage index: ${stageIndex}`);
  }

  const featured = featuredNarratives();
  const implementations: Record<string, ControlImplementation> = {};
  for (const id of ids) {
    const narrative = featured[id];
    if (!narrative) {
      throw new Error(`Missing featured narrative for "${id}".`);
    }
    implementations[id] = {
      status: "implemented",
      narrative,
    };
  }

  if (stageIndex >= 2 && implementations["cp-2"]) {
    implementations["cp-2"] = {
      status: "implemented",
      narrative: `${featured["cp-2"]} This revision incorporates after-action items from ${DEMO_SNAPSHOT_NAMES[2]}.`,
    };
  }
  if (stageIndex >= 3 && implementations["cm-2"]) {
    implementations["cm-2"] = {
      status: "implemented",
      narrative: `${featured["cm-2"]} Configuration evidence was refreshed under milestone ${DEMO_SNAPSHOT_NAMES[3]} using ${DEMO_PROCEDURES.coconutReconciliation}, led by ${samOkonkwo.name}, with Approved Coconut Suppliers revalidated and ${DEMO_PROCEDURES.coconutDisposal} confirmed for damaged stock.`,
    };
  }

  return implementations;
}

function applyFinalStageRefinements(
  implementations: Record<string, ControlImplementation>,
): Record<string, ControlImplementation> {
  const next = { ...implementations };
  const featured = featuredNarratives();

  if (next["cp-2"] && featured["cp-2"]) {
    next["cp-2"] = {
      status: "implemented",
      narrative: `${featured["cp-2"]} This revision incorporates after-action items from ${DEMO_SNAPSHOT_NAMES[2]}.`,
    };
  }
  if (next["cm-2"] && featured["cm-2"]) {
    next["cm-2"] = {
      status: "implemented",
      narrative: `${featured["cm-2"]} Configuration evidence was refreshed under milestone ${DEMO_SNAPSHOT_NAMES[3]} using ${DEMO_PROCEDURES.coconutReconciliation}, led by ${samOkonkwo.name}, with Approved Coconut Suppliers revalidated and ${DEMO_PROCEDURES.coconutDisposal} confirmed for damaged stock.`,
    };
  }
  if (next["pl-2"] && featured["pl-2"]) {
    next["pl-2"] = {
      status: "implemented",
      narrative: `${featured["pl-2"]} Package finalized for ${DEMO_SNAPSHOT_NAMES[4]} (${DEMO_PROCEDURES.garyReview}). ${GARY_VETERINARY_CLEARANCE}`,
    };
  }
  return next;
}

export function buildDemoImplementationsForStage(
  stageIndex: number,
): Record<string, ControlImplementation> {
  if (stageIndex < 0 || stageIndex > FINAL_STAGE_INDEX) {
    throw new Error(`Invalid demo seed stage index: ${stageIndex}`);
  }

  if (stageIndex < FINAL_STAGE_INDEX) {
    return buildFeaturedImplementationsForStage(stageIndex);
  }

  return applyFinalStageRefinements(buildCompleteDemoImplementations());
}

export function buildFinalDemoImplementations(): Record<
  string,
  ControlImplementation
> {
  return buildDemoImplementationsForStage(FINAL_STAGE_INDEX);
}

/** Baseline control count from FrameworkProvider (not hardcoded). */
export function demoBaselineControlCount(): number {
  return FRAMEWORK_CONTROLS.length;
}

export function demoFrameworkLabel(): string {
  return `${FRAMEWORK.title} (${FRAMEWORK.id})`;
}

export type DemoContentValidationResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Validate demo metadata and implementations against domain type guards and
 * known framework control IDs before persistence.
 */
export function validateDemoProjectContent(input: {
  metadata: ProjectMetadata;
  implementations: Record<string, ControlImplementation>;
  frameworkControlIds: ReadonlySet<string>;
  /** When true, require exact baseline coverage (final seed stage). */
  requireCompleteBaseline?: boolean;
}): DemoContentValidationResult {
  if (!isProjectMetadata(input.metadata)) {
    return { ok: false, message: "Demo metadata failed domain validation." };
  }

  if (!input.metadata.organizationName.trim()) {
    return { ok: false, message: "Demo organizationName is required." };
  }
  if (!input.metadata.systemName.trim()) {
    return { ok: false, message: "Demo systemName is required." };
  }
  if (!input.metadata.systemDescription.trim()) {
    return { ok: false, message: "Demo systemDescription is required." };
  }

  const entries = Object.entries(input.implementations);
  if (entries.length === 0) {
    return { ok: false, message: "Demo implementations must not be empty." };
  }

  const seen = new Set<string>();
  for (const [controlId, implementation] of entries) {
    if (seen.has(controlId)) {
      return {
        ok: false,
        message: `Duplicate demo implementation for "${controlId}".`,
      };
    }
    seen.add(controlId);

    if (!input.frameworkControlIds.has(controlId)) {
      return {
        ok: false,
        message: `Demo control "${controlId}" is not in the current framework.`,
      };
    }
    if (!isControlImplementation(implementation)) {
      return {
        ok: false,
        message: `Demo implementation for "${controlId}" failed domain validation.`,
      };
    }
    if (!implementation.narrative.trim()) {
      return {
        ok: false,
        message: `Demo implementation for "${controlId}" requires a narrative.`,
      };
    }
  }

  if (input.requireCompleteBaseline) {
    const coverage = analyzeDemoNarrativeCoverage(
      Object.fromEntries(
        entries.map(([id, implementation]) => [id, implementation.narrative]),
      ),
    );
    if (
      coverage.missingIds.length > 0 ||
      coverage.unknownIds.length > 0 ||
      coverage.narrativeCount !== coverage.baselineCount
    ) {
      return {
        ok: false,
        message: `Demo implementations incomplete for baseline ${coverage.frameworkId}: missing ${coverage.missingIds.length}, unknown ${coverage.unknownIds.length}, count ${coverage.narrativeCount}/${coverage.baselineCount}.`,
      };
    }
  }

  return { ok: true };
}

/** Featured control count (quality-standard subset), not the full baseline. */
export const FEATURED_DEMO_CONTROL_COUNT = DEMO_CONTROL_IDS.length;
