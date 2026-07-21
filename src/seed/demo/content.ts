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
  DEMO_COMPONENTS,
  DEMO_INCIDENTS,
  DEMO_INVENTORY,
  DEMO_LEVERAGED_SERVICES,
  DEMO_LOCATIONS,
  DEMO_ORGANIZATION,
  DEMO_PEOPLE,
  DEMO_POLICIES,
  DEMO_PROCEDURES,
  DEMO_SECURITY_CATEGORIZATION,
  DEMO_SYSTEM,
  DEMO_TEAMS,
  DEMO_TERMS,
  DEMO_USERS,
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
 * Seed stages grow the demo document so each named snapshot captures progress.
 * Stage index aligns with DEMO_SNAPSHOT_NAMES (0..4). Final stage is complete.
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
  [...DEMO_CONTROL_IDS],
] as const;

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

/**
 * Control narratives. Gary appears as a normal employee until the final-stage
 * PL-2 refinement (Gary's Annual Performance Review milestone).
 */
const NARRATIVES: Record<DemoControlId, string> = {
  "ac-1": `${DEMO_POLICIES.accessControl} is approved by ${margotChen.name} and maintained by ${priyaSharma.name}. It establishes account management for ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.goosePortal.name}, and ${DEMO_COMPONENTS.featherAuth.name}; privileged access for ${DEMO_TEAMS.acu}; escorted contractor access for Northern Maple Systems; and dual approval for Emergency Coconut Reserve custody roles in ${DEMO_COMPONENTS.cims.name}. Day-to-day provisioning follows ${DEMO_PROCEDURES.accountProvisioning} under ${garyMercer.name}'s system-owner authority. The policy is reviewed annually before ${DEMO_TERMS.garyReview} and after significant incidents such as ${DEMO_INCIDENTS.coconut2024.name}.`,

  "ac-2": `Accounts are created, modified, disabled, and removed in ${DEMO_COMPONENTS.featherAuth.name}. ${priyaSharma.name} approves standard SGOC and NHOC accounts; ${margotChen.name} approves privileged ACU roles; ${nadiaFortin.name} sponsors time-bound Mobile Field Terminal accounts for ${DEMO_TEAMS.borderSquadron} and ${DEMO_TEAMS.rhrt}. Disabled accounts are reviewed weekly. One service account used by the Goose Deployment API has no recorded owner and cannot be disabled without breaking production tasking; it is tracked as an accepted risk pending replacement. After ${DEMO_INCIDENTS.garyCleanDesk.name}, unattended Mission Planning Console sessions in SC-3 lock after five minutes and notify the ISSO.`,

  "ac-3": `${DEMO_COMPONENTS.featherAuth.name} groups enforce authorizations in ${DEMO_COMPONENTS.sgopCore.name} and ${DEMO_COMPONENTS.goosePortal.name}. Coconut Logistics Cell clerks may adjust ${DEMO_COMPONENTS.cims.name} inventory records but cannot issue Goose Deployment API tasking. ${DEMO_USERS.contractors} receive read-only maintenance roles only while escorted at ${DEMO_LOCATIONS.honkwater.name}. ${garyMercer.name} may approve temporary physical-access exceptions for SC-3 visitors; those exceptions are logged and expire within 24 hours. ${priyaSharma.name} reviews access exceptions monthly.`,

  "ac-6": `Least privilege separates SGOC operators, ACU analysts, CLC custody clerks, and Wing Integrity veterinary staff. Privileged FeatherAuth roles require dual approval by ${priyaSharma.name} and ${margotChen.name}. ${rileyNguyen.name} holds configuration rights distinct from operational tasking. Emergency elevation during ${DEMO_TERMS.honkProtocol} is logged and revoked within 24 hours. Quarterly reviews follow ${DEMO_PROCEDURES.privilegedReview}; the last review noted that ${garyMercer.name} continues to request broader Mission Planning Console rights than required for system-owner duties, and those requests were denied.`,

  "at-1": `${DEMO_POLICIES.awareness} is owned by ${jordanMacLeod.name}. Required topics include ${DEMO_TERMS.honkProtocol}, ${DEMO_TERMS.quarterlyCoconutReconciliation}, Nest Perimeter rules at Border Post 17, and the standing reminder that personnel must not feed ${garyMercer.name} during active operations. ${garyMercer.name} sponsors completion targets for the annual cycle. A TODO comment in the training LMS export script is cited by ${DEMO_PROCEDURES.accountProvisioning} as the interim method for removing terminated users from the roster until FeatherAuth automation is finished.`,

  "at-2": `All SGOP users complete role-based awareness training before receiving Operator Workstation or Mobile Field Terminal access. Field operators receive modules on ${DEMO_TERMS.tacticalHonkingProcedures}, ${DEMO_TERMS.controlledBreadException}, and lessons from ${DEMO_INCIDENTS.breadPerimeter.name}. ${jordanMacLeod.name} records completion in the CGDS training spreadsheet, which remains the de facto system of record for awareness evidence. ${helenCrowe.name} delivers the Wing Integrity medical module to veterinary staff at the Secure Molting Facility.`,

  "au-2": `${DEMO_POLICIES.audit} defines auditable events for ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.featherAuth.name}, ${DEMO_COMPONENTS.nestWatch.name}, ${DEMO_COMPONENTS.deploymentApi.name}, and ${DEMO_COMPONENTS.cims.name}. Required events include privileged login, Goose Deployment API calls, dual-control coconut release authorizations, and Honk Protocol activations. ${caseyTremblay.name} maintains the event catalog with ${priyaSharma.name}. Retention is 365 days online and seven years in the Backup Repository for coconut custody and deployment records.`,

  "au-6": `${DEMO_TEAMS.acu} reviews NestWatch, FeatherAuth, and CIMS audit streams daily on the NHOC watch floor. ${averyPatel.name} escalates confirmed anomalies under ${DEMO_TERMS.honkProtocol}. After ${DEMO_INCIDENTS.nestingSurge.name}, playbooks distinguish seasonal Nest Perimeter noise from hostile activity. Findings are briefed to ${margotChen.name} weekly. The badge-printer spool incident (${DEMO_INCIDENTS.printerSpool.name}) is retained as a worked example of media-path monitoring.`,

  "cm-2": `${rileyNguyen.name} maintains secure baselines for SGOP Core, Goose Operations Portal, Mobile Field Terminals, and NestWatch sensors under ${DEMO_POLICIES.configuration}. The current production SGOP Core package is labeled prod-final-final-v2 in the change register; the prior label remains on a sticky note affixed to the Mission Planning Console rack as a local identifier. Baselines were re-verified after ${DEMO_INCIDENTS.coconut2024.name} when CIMS configuration drift coincided with the custody recount. A temporary firewall exception opened in 2014 for the coffee machine on VLAN 12 remains open and is inventoried as technical debt.`,

  "cm-6": `HonkNet gateway and NestWatch sensor settings are applied from approved baselines. Changes require ${rileyNguyen.name} approval and ISSO acknowledgment. During ${DEMO_TERMS.nestingSeasonSurge}, expedited changes may be implemented first and documented within two business days; several NestWatch threshold adjustments from 2025 were change-approved after implementation and later regularized. Developers occasionally assert that a change “works on my machine”; such claims are not accepted as production evidence. Test environment HOST-SGOP-T01 is functionally relied upon for live Goose Readiness Level queries and is therefore treated as production for change control.`,

  "cp-2": `${DEMO_POLICIES.contingency} is owned by ${morganEllis.name} and approved by ${garyMercer.name}. The plan addresses loss of Mission Control SC-3, HonkNet partition, Coconut Storage Vault systems, and degraded Goose Readiness Levels. Alternate processing shifts coordination to Border Post 17 and, if required, ${DEMO_LOCATIONS.disasterRecoveryPond.name}, including activation of ${DEMO_COMPONENTS.rfc1149Gateway.name}. ${garyMercer.name} is consistently difficult during tabletop exercises and routinely challenges assumed recall timelines under ${DEMO_PROCEDURES.gooseRecall}. Lessons from Goose Readiness Exercise events are incorporated into the Migratory Continuity Plan annually.`,

  "cp-9": `SGOP and CIMS backups run nightly to ${DEMO_COMPONENTS.backupRepo.name}, with weekly offline copies tracked by ${morganEllis.name}. CIMS backup verification is mandatory after any ${DEMO_TERMS.quarterlyCoconutReconciliation} or Lost Coconut Incident response. Restore tests are executed during ${DEMO_PROCEDURES.gCoopExercise}. The Backup Repository includes a volume historically referred to as Schrödinger’s Backup: restore success cannot be confirmed without running the restore, and running the restore risks overwriting the only known-good copy; the volume is quarantined pending replacement media.`,

  "ia-2": `Unique identification is provided by ${DEMO_COMPONENTS.featherAuth.name} under ${DEMO_POLICIES.identification}. Shared console accounts are prohibited in Mission Control SC-3. Contractors authenticate with sponsored identities federated through ${DEMO_LEVERAGED_SERVICES.sharedServicesIdentity}. ${steveKowalski.name}'s internal troubleshooting notes still instruct junior administrators to “try 127.0.0.1” before opening a ticket; that guidance is not an approved authentication procedure.`,

  "ia-5": `Authenticators include PIV-compatible badges printed at Honkwater Barracks and phishing-resistant MFA for remote HonkNet access. ${priyaSharma.name} oversees issuance; lost Mobile Field Terminal credentials are revoked within one hour. Password and authenticator resets follow ${DEMO_PROCEDURES.accountProvisioning}. ${garyMercer.name} participates in annual authentication penetration testing as a designated insider-threat exercise participant and has repeatedly bypassed clean-desk expectations despite MFA success.`,

  "ir-4": `Incident handling follows ${DEMO_POLICIES.incidentResponse}. ${averyPatel.name} activates ${DEMO_TERMS.honkProtocol} for cyber and operational events affecting ${DEMO_TERMS.strategicGooseReserve} tasking, Nest Perimeter integrity, or Emergency Coconut Reserve custody. Severity tiers and notifications to ${margotChen.name} and ${brendanWalsh.name} are defined in ${DEMO_PROCEDURES.honkProtocolActivation}. ${DEMO_PROCEDURES.unauthorizedDeployment} covers Unauthorized Goose Deployment. Recent exercises used scenarios drawn from ${DEMO_INCIDENTS.nestingSurge.name}, ${DEMO_INCIDENTS.coconut2024.name}, and ${DEMO_INCIDENTS.printerSpool.name}. When HonkNet is unavailable, IR coordination may fall back to ${DEMO_COMPONENTS.rfc1149Gateway.name} with RFC 2549 quality-of-service settings.`,

  "ir-6": `Confirmed incidents are reported to the CGDS security operations channel within one hour. ${averyPatel.name} files formal reports to ${priyaSharma.name} and ${margotChen.name}; mission-impacting events are briefed to ${garyMercer.name}, who signs exercise and after-action reports. External notifications for leveraged-service issues involve Northern Maple Systems under contract. Watch-floor folklore that “DNS sacrifices” restore HonkNet resolution is not an approved recovery step and is excluded from formal IR-6 reporting pathways.`,

  "pe-3": `Physical access to ${DEMO_LOCATIONS.honkwater.name} and ${DEMO_LOCATIONS.nhoc.name} is controlled by ${dougBillings.name}; ${DEMO_LOCATIONS.borderPost17.name} Nest Perimeter access is controlled by ${taylorReid.name}. Visitor escort follows ${DEMO_PROCEDURES.visitorEscort}. ${garyMercer.name} escorts distinguished visitors through SC-3 and has detected unauthorized personnel near Goose Staging Area Alpha on two recorded occasions. After ${DEMO_INCIDENTS.breadPerimeter.name}, bread screening was added unless a Controlled Bread Exception is pre-approved under ${DEMO_PROCEDURES.breadException}. Coconut Storage Vault entry requires ${DEMO_TERMS.dualControlCoconutRelease} two-person integrity under ${DEMO_POLICIES.coconutCustody}.`,

  "pl-2": `The SGOP System Security Plan is maintained by ${priyaSharma.name} under ${DEMO_POLICIES.planning}. ${garyMercer.name} is system owner; ${brendanWalsh.name} is authorizing official. The plan describes the authorization boundary, Moderate confidentiality/integrity/availability categorization, responsible roles, leveraged services, and relationships among SGOP Core, Goose Deployment API, Strategic Goose Registry, NestWatch, FeatherAuth, and CIMS. Updates are required after significant events and before ${DEMO_TERMS.garyReview}. Where procedure ownership is unclear, staff are directed to ${DEMO_PROCEDURES.seeSteve}. A legacy coordination spreadsheet with no confirmed owner continues to influence Goose Readiness Level reporting and is listed for retirement.`,

  "ra-3": `Risk assessments are led by ${margotChen.name} with ${priyaSharma.name} and ${DEMO_TEAMS.acu}. Current risk register entries include HonkNet availability during Nesting Season Surge, Emergency Coconut Reserve custody integrity, Nest Perimeter intrusion at Border Post 17, reliance on the ownerless Goose Deployment API service account, and the coffee-machine VLAN 12 exception retained since 2014. ${DEMO_POLICIES.risk} requires reassessment after coconut discrepancy investigations and before authorization package updates. ${nadiaFortin.name} contributes Aggression Readiness Assessment inputs for Strategic Goose Registry assets.`,

  "si-4": `${DEMO_COMPONENTS.nestWatch.name} and the Telemetry Platform provide continuous monitoring under ${DEMO_POLICIES.integrity}, operated by ${caseyTremblay.name} and ${DEMO_TEAMS.acu}. Alerts cover anomalous FeatherAuth authentication, unexpected CIMS custody writes, Goose Deployment API calls outside approved windows, and HonkNet beacon loss to Border Post 17. Thresholds were retuned after ${DEMO_INCIDENTS.nestingSurge.name}. Malware protection and integrity checking on Operator Workstations and Mobile Field Terminals are baseline-enforced by ${rileyNguyen.name}. Monitoring coverage is reviewed in Goose Readiness Exercise after-action reports signed by ${garyMercer.name}.`,
};

/** Formal statement appended only at the final named-version stage. */
const GARY_VETERINARY_CLEARANCE =
  `${garyMercer.name} successfully completed his annual veterinary examination and remains cleared for operational deployment.`;

export function buildDemoImplementationsForStage(
  stageIndex: number,
): Record<string, ControlImplementation> {
  const ids = DEMO_STAGE_CONTROL_IDS[stageIndex];
  if (!ids) {
    throw new Error(`Invalid demo seed stage index: ${stageIndex}`);
  }

  const implementations: Record<string, ControlImplementation> = {};
  for (const id of ids) {
    implementations[id] = {
      status: "implemented",
      narrative: NARRATIVES[id],
    };
  }

  if (stageIndex >= 2 && implementations["cp-2"]) {
    implementations["cp-2"] = {
      status: "implemented",
      narrative: `${NARRATIVES["cp-2"]} This revision incorporates after-action items from ${DEMO_SNAPSHOT_NAMES[2]}.`,
    };
  }
  if (stageIndex >= 3 && implementations["cm-2"]) {
    implementations["cm-2"] = {
      status: "implemented",
      narrative: `${NARRATIVES["cm-2"]} Configuration evidence was refreshed under milestone ${DEMO_SNAPSHOT_NAMES[3]} using ${DEMO_PROCEDURES.coconutReconciliation}, led by ${samOkonkwo.name}, with Approved Coconut Suppliers revalidated and ${DEMO_PROCEDURES.coconutDisposal} confirmed for damaged stock.`,
    };
  }
  if (stageIndex >= 4 && implementations["pl-2"]) {
    implementations["pl-2"] = {
      status: "implemented",
      narrative: `${NARRATIVES["pl-2"]} Package finalized for ${DEMO_SNAPSHOT_NAMES[4]} (${DEMO_PROCEDURES.garyReview}). ${GARY_VETERINARY_CLEARANCE}`,
    };
  }

  return implementations;
}

export function buildFinalDemoImplementations(): Record<
  string,
  ControlImplementation
> {
  return buildDemoImplementationsForStage(DEMO_STAGE_CONTROL_IDS.length - 1);
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

  for (const [controlId, implementation] of entries) {
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

  return { ok: true };
}
