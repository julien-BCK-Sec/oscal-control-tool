/**
 * Supporting demo project content (not the Goose flagship).
 *
 * Maturity is intentional: CMMC is partial, Low is early-stage, Moderate
 * CIMS is evidence-gap, High is mid-maturity. Narratives reuse the Goose
 * world where control IDs overlap; CMMC uses requirement-specific copy.
 */

import type { ControlImplementation, ImplementationStatus } from "@/data/implementation";
import type { ProjectMetadata } from "@/data/project";
import { resolveFrameworkControls } from "@/data/framework";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import { CMMC_LEVEL_2_REQUIREMENT_COUNT } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/families";
import {
  DOD_CLOUD_IL4_FRAMEWORK_ID,
  IL4_TOTAL_COUNT,
} from "@/framework/dod-cloud-il4-rev5/identities";
import {
  NIST_HIGH_FRAMEWORK_ID,
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
} from "@/framework/nist-sp-800-53-rev5/identities";
import { CANONICAL_ORGS, CANONICAL_PROJECTS } from "./catalog";
import { collectDemoNarratives } from "./controls";
import {
  DEMO_LOCATIONS,
  DEMO_ORGANIZATION,
  DEMO_PEOPLE,
  DEMO_TEAMS,
  DEMO_TERMS,
} from "./world";

export { CMMC_LEVEL_2_REQUIREMENT_COUNT };

const CMMC_IMPLEMENTED_COUNT = 16;
const CMMC_IN_PROGRESS_COUNT = 20;
const CMMC_NOT_APPLICABLE_COUNT = 4;

const EARLY_CONTROL_IDS = ["ac-1", "ac-2", "ia-2", "pl-2"] as const;

function narrativeForNistControl(
  controlId: string,
  narratives: Record<string, string>,
): string | undefined {
  return narratives[controlId];
}

function implementation(
  status: ImplementationStatus,
  narrative: string,
): ControlImplementation {
  return { status, narrative };
}

export function buildSupportingMetadata(
  key: keyof typeof CANONICAL_PROJECTS,
  systemDescription: string,
): ProjectMetadata {
  const spec = CANONICAL_PROJECTS[key];
  return {
    organizationName: CANONICAL_ORGS[spec.organization].name,
    systemName: spec.systemName,
    systemDescription,
  };
}

export function buildCmmcProjectDescription(): string {
  return [
    `${CANONICAL_PROJECTS.cmmc.systemName} is a CMMC Level 2 / NIST SP 800-171 Rev. 2 project for ${DEMO_ORGANIZATION.name}.`,
    `It covers CUI handling for ${DEMO_TEAMS.borderSquadron} operations at ${DEMO_LOCATIONS.borderPost17.name}.`,
    `${DEMO_PEOPLE.priyaSharma.name} is the ISSO. Implementation is intentionally incomplete so the 110-requirement catalog still shows remaining work.`,
    `This project does not export OSCAL and is not a CMMC assessment, MET / NOT MET determination, or SPRS score.`,
  ].join(" ");
}

export function buildEarlyProjectDescription(): string {
  return [
    `${CANONICAL_PROJECTS.early.systemName} is a newly initiated NIST SP 800-53 Rev. 5 Low authorization for guest and visitor connectivity at ${DEMO_LOCATIONS.honkwater.name}.`,
    `${DEMO_PEOPLE.caseyTremblay.name} opened the package; most Low baseline controls remain unaddressed.`,
  ].join(" ");
}

export function buildEvidenceGapProjectDescription(): string {
  return [
    `${CANONICAL_PROJECTS.evidenceGap.systemName} (${DEMO_TERMS.emergencyCoconutReserve} custody) has substantial implementation narratives under ${DEMO_PEOPLE.samOkonkwo.name}.`,
    `Evidence Coverage is intentionally thin: authors documented how CIMS works without attaching enough active Evidence records.`,
  ].join(" ");
}

export function buildHighProjectDescription(): string {
  return [
    `${CANONICAL_PROJECTS.high.systemName} tracks a High baseline overlay for ${DEMO_LOCATIONS.nhoc.name}.`,
    `Overlapping Moderate controls reuse SGOP narratives; High-only enhancements remain largely unaddressed.`,
    `${DEMO_PEOPLE.margotChen.name} requested the High profile after the Goose Readiness Exercise increased availability expectations.`,
  ].join(" ");
}

export function buildIl4ProjectDescription(): string {
  return [
    `${CANONICAL_PROJECTS.il4.systemName} is a DoD Cloud Impact Level 4 documentation project for ${DEMO_ORGANIZATION.name}.`,
    `It demonstrates FedRAMP Rev. 5 Moderate plus the DoD IL4 overlay for a fictional Goose cloud offering associated with ${DEMO_LOCATIONS.nhoc.name}.`,
    `${DEMO_PEOPLE.priyaSharma.name} is the ISSO. Representative items show overlay layers, General Readiness Requirements, unresolved DSPAV, the IA-5(1) source conflict, and SC-46 CDS conditionality.`,
    `This project is not FedRAMP authorization, DoD authorization, Provisional Authorization, an Authority to Operate, or a compliance determination. OSCAL SSP export is not available.`,
  ].join(" ");
}

export function buildContosoCloudDescription(): string {
  return "Contoso Cloud Platform is Contoso's Moderate baseline demonstration used for tenant-isolation testing. It is not a Canadian Goose Defence System project.";
}

export function buildFirstDoorCloudDescription(): string {
  return [
    `${CANONICAL_PROJECTS.firstdoorCloud.systemName} is FirstDoor's NIST SP 800-53 Rev. 5 Moderate (FedRAMP Moderate baseline) sample authorization package.`,
    "It is placeholder demo content for operator walkthroughs, not a real FedRAMP authorization, ATO, or production system description.",
  ].join(" ");
}

function cmmcNarrative(controlId: string, title: string): string {
  return [
    `${controlId} (${title}) is addressed for ${CANONICAL_PROJECTS.cmmc.systemName} at ${DEMO_LOCATIONS.borderPost17.name}.`,
    `${DEMO_PEOPLE.priyaSharma.name} maintains the requirement with ${DEMO_TEAMS.borderSquadron} operators.`,
    `CUI handling follows CGDS procedures. This statement is implementation documentation only — not a CMMC assessment result.`,
  ].join(" ");
}

/**
 * Partial CMMC Level 2 implementations: mixed statuses, many requirements
 * left unaddressed. Count of addressed rows is stable (40 of 110).
 */
export function buildCmmcImplementations(): Record<string, ControlImplementation> {
  const controls = resolveFrameworkControls(CMMC_LEVEL_2_FRAMEWORK_ID);
  const implementedEnd = CMMC_IMPLEMENTED_COUNT;
  const inProgressEnd = implementedEnd + CMMC_IN_PROGRESS_COUNT;
  const naEnd = inProgressEnd + CMMC_NOT_APPLICABLE_COUNT;

  const out: Record<string, ControlImplementation> = {};
  for (const [index, control] of controls.entries()) {
    const narrative = cmmcNarrative(control.id, control.title);
    if (index < implementedEnd) {
      out[control.id] = implementation("implemented", narrative);
    } else if (index < inProgressEnd) {
      out[control.id] = implementation("in-progress", narrative);
    } else if (index < naEnd) {
      out[control.id] = implementation(
        "not-applicable",
        `${narrative} Marked not applicable: this requirement is outside the current CUI enclave boundary pending a later scope decision.`,
      );
    }
  }
  return out;
}

export function cmmcAddressedCount(): number {
  return (
    CMMC_IMPLEMENTED_COUNT + CMMC_IN_PROGRESS_COUNT + CMMC_NOT_APPLICABLE_COUNT
  );
}

export function buildEarlyImplementations(): Record<string, ControlImplementation> {
  const allowed = new Set(
    resolveFrameworkControls(NIST_LOW_FRAMEWORK_ID).map((control) => control.id),
  );
  const narratives = collectDemoNarratives();
  const out: Record<string, ControlImplementation> = {};
  for (const id of EARLY_CONTROL_IDS) {
    if (!allowed.has(id)) {
      continue;
    }
    const narrative = narrativeForNistControl(id, narratives);
    if (!narrative) {
      continue;
    }
    out[id] = implementation(
      id === "ac-1" ? "implemented" : "in-progress",
      `${narrative} (Honkwater Visitor Network kickoff — ${DEMO_PEOPLE.caseyTremblay.name}.)`,
    );
  }
  return out;
}

/**
 * Many Moderate implementations, used by the evidence-gap project.
 * Intentionally omits a tail of the baseline so dashboards still show work remaining.
 */
export function buildEvidenceGapImplementations(): Record<
  string,
  ControlImplementation
> {
  const controls = resolveFrameworkControls(NIST_MODERATE_FRAMEWORK_ID);
  const narratives = collectDemoNarratives();
  const keep = Math.floor(controls.length * 0.55);
  const out: Record<string, ControlImplementation> = {};
  for (const [index, control] of controls.entries()) {
    if (index >= keep) {
      break;
    }
    const narrative = narrativeForNistControl(control.id, narratives);
    if (!narrative) {
      continue;
    }
    out[control.id] = implementation(
      index % 5 === 0 ? "in-progress" : "implemented",
      narrative,
    );
  }
  return out;
}

export function buildHighImplementations(): Record<string, ControlImplementation> {
  const controls = resolveFrameworkControls(NIST_HIGH_FRAMEWORK_ID);
  const narratives = collectDemoNarratives();
  const out: Record<string, ControlImplementation> = {};
  let reused = 0;
  const reuseLimit = 80;
  for (const control of controls) {
    const narrative = narrativeForNistControl(control.id, narratives);
    if (!narrative) {
      continue;
    }
    if (reused >= reuseLimit) {
      break;
    }
    out[control.id] = implementation(
      reused < 45 ? "implemented" : "in-progress",
      narrative,
    );
    reused += 1;
  }
  return out;
}

const IL4_REPRESENTATIVE_IDS = [
  "ac-2",
  "ac-7",
  "ia-5.1",
  "sc-17",
  "sc-46",
  "grr-1",
] as const;

function il4Narrative(controlId: string): string {
  const system = CANONICAL_PROJECTS.il4.systemName;
  const isso = DEMO_PEOPLE.priyaSharma.name;
  const location = DEMO_LOCATIONS.nhoc.name;
  switch (controlId) {
    case "ac-2":
      return [
        `Account management for ${system} is documented against the FedRAMP Moderate assignment layer shown beside the NIST AC-2 statement.`,
        `${isso} reviews privileged and non-privileged Goose cloud accounts using FeatherAuth at ${location}.`,
        `FedRAMP assignment values remain overlay metadata. This statement is implementation documentation only.`,
      ].join(" ");
    case "ac-7":
      return [
        `Unsuccessful logon attempts for ${system} are documented using the DoD IL4 overlay assignment that is present in the public Addendum.`,
        `Control Freak also shows DoD assignment required for a DSPAV that is not available in the public source material.`,
        `${isso} has not invented a DSPAV value. This narrative does not supply one.`,
      ].join(" ");
    case "ia-5.1":
      return [
        `Authenticator management enhancement IA-5(1) for ${system} displays both the FedRAMP Moderate layer and the DoD IL4 layer.`,
        `The in-product notice is Source interpretation requires review. This demo does not choose a winner between those sources.`,
        `${isso} records that human review is required; Control Freak has no effective assignment.`,
      ].join(" ");
    case "sc-17":
      return [
        `Public key infrastructure certificates for ${system} are documented against the NIST SC-17 statement plus the separate DoD IL4 supplemental requirement.`,
        `${isso} treats the supplement as overlay material, not a rewrite of the NIST control text.`,
      ].join(" ");
    case "sc-46":
      return [
        `Cross Domain Policy Enforcement (SC-46) remains in the ${IL4_TOTAL_COUNT}-item IL4 population for ${system}.`,
        `It is identified as conditionally applicable when a Cross Domain Solution is used.`,
        `${isso} has not marked this item not applicable. Control Freak does not auto-N/A it.`,
      ].join(" ");
    case "grr-1":
      return [
        `GRR-1 (DoD PKI authentication) is documented as a General Readiness Requirement for ${system}, not as a NIST control.`,
        `${isso} describes CAC/Alt-token authentication for privileged and non-privileged Goose cloud operators at ${location}.`,
        `This is implementation documentation for a first-class framework item. It is not a DoD readiness determination.`,
      ].join(" ");
    default:
      return `${controlId} is documented for ${system} by ${isso}.`;
  }
}

/**
 * Small representative IL4 overlay sample. Intentionally far short of 345.
 * Does not invent inaccessible DSPAV values.
 */
export function buildIl4Implementations(): Record<string, ControlImplementation> {
  const allowed = new Set(
    resolveFrameworkControls(DOD_CLOUD_IL4_FRAMEWORK_ID).map(
      (control) => control.id,
    ),
  );
  const out: Record<string, ControlImplementation> = {};
  for (const controlId of IL4_REPRESENTATIVE_IDS) {
    if (!allowed.has(controlId)) {
      continue;
    }
    const status: ImplementationStatus =
      controlId === "ac-2" || controlId === "sc-17" || controlId === "grr-1"
        ? "implemented"
        : "in-progress";
    out[controlId] = implementation(status, il4Narrative(controlId));
  }
  return out;
}

export function il4RepresentativeIds(): readonly string[] {
  return IL4_REPRESENTATIVE_IDS;
}

export function buildContosoImplementations(): Record<string, ControlImplementation> {
  const controls = resolveFrameworkControls(NIST_MODERATE_FRAMEWORK_ID);
  const narratives = collectDemoNarratives();
  const out: Record<string, ControlImplementation> = {};
  let picked = 0;
  for (let i = 0; i < controls.length && picked < 18; i += 12) {
    const control = controls[i];
    if (!control) {
      continue;
    }
    const narrative = narrativeForNistControl(control.id, narratives);
    if (!narrative) {
      continue;
    }
    out[control.id] = implementation("in-progress", narrative);
    picked += 1;
  }
  return out;
}

const FIRSTDOOR_SAMPLE_CONTROL_IDS = [
  "ac-1",
  "ac-2",
  "ac-3",
  "ia-2",
  "ia-5",
  "au-2",
  "au-6",
  "cm-2",
  "sc-7",
  "si-4",
  "pl-2",
  "ra-3",
  "ir-4",
  "cp-2",
  "sa-9",
] as const;

function firstDoorNarrative(controlId: string): string {
  return [
    `${controlId} for ${CANONICAL_PROJECTS.firstdoorCloud.systemName} is documented against the FirstDoor SaaS authorization boundary.`,
    "Customer traffic terminates at the FirstDoor edge; privileged administration uses separate jump hosts and the FirstDoor identity service.",
    "This statement is sample demo documentation only — not a FedRAMP authorization decision or production control assessment.",
  ].join(" ");
}

export function buildFirstDoorImplementations(): Record<string, ControlImplementation> {
  const allowed = new Set(
    resolveFrameworkControls(NIST_MODERATE_FRAMEWORK_ID).map((control) => control.id),
  );
  const out: Record<string, ControlImplementation> = {};
  for (const [index, controlId] of FIRSTDOOR_SAMPLE_CONTROL_IDS.entries()) {
    if (!allowed.has(controlId)) {
      continue;
    }
    out[controlId] = implementation(
      index % 4 === 0 ? "in-progress" : "implemented",
      firstDoorNarrative(controlId),
    );
  }
  return out;
}
