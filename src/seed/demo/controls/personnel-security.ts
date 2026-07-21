import {
  DEMO_COMPONENTS,
  DEMO_INCIDENTS,
  DEMO_LOCATIONS,
  DEMO_PEOPLE,
  DEMO_POLICIES,
  DEMO_PROCEDURES,
  DEMO_TEAMS,
  DEMO_TERMS,
} from "../world";

const {
  garyMercer,
  margotChen,
  priyaSharma,
  dougBillings,
  samOkonkwo,
  taylorReid,
  helenCrowe,
} = DEMO_PEOPLE;

/**
 * PS (Personnel Security) family narratives.
 */
export function personnelSecurityNarratives(): Record<string, string> {
  return {
    "ps-1": `${DEMO_POLICIES.personnel} is approved by ${margotChen.name} and maintained by ${priyaSharma.name}. It governs screening, termination, and transfer procedures for ${DEMO_TEAMS.sgoc}, ${DEMO_TEAMS.acu}, ${DEMO_TEAMS.clc}, the Wing Integrity veterinary detachment, and ${dougBillings.name}'s facilities staff, and cross-references External Personnel Security requirements for escorted contractors.`,

    "ps-2": `Position risk designations are assigned by role rather than by team. Emergency Coconut Reserve custody roles in the Coconut Logistics Cell carry a moderate-to-high designation reflecting custody and reconciliation authority; Wing Integrity veterinary roles are designated per ${helenCrowe.name}'s assessment of sensitive medical-record access; Border Post 17 field roles are designated on ${taylorReid.name}'s recommendation given ${DEMO_TERMS.nestPerimeter} access.`,

    "ps-3": `Background screening is completed and adjudicated before any ${DEMO_COMPONENTS.featherAuth.name} account is issued. Northern Maple Systems contractors are screened to an equivalent standard under the external personnel security agreement before escorted access begins. Rescreening is triggered when a position's risk designation increases, including transfer into a Coconut Logistics Cell custody role.`,

    "ps-4": `Termination processing disables the ${DEMO_COMPONENTS.featherAuth.name} account, physical badge, ${DEMO_COMPONENTS.mobileTerminals.name} assignment, and any ${DEMO_COMPONENTS.cims.name} custody role on the last working day, followed by an exit interview. A 2024 audit found one departed Coconut Logistics Cell clerk's badge remained technically valid for six hours past termination due to a manual step ${dougBillings.name}'s team had missed; the step is now an automated joint HR/IT ticket rather than a checklist item.`,

    "ps-5": `Role transfers trigger an access review distinct from a full re-provisioning. Transfer out of the Coconut Logistics Cell revokes ${DEMO_COMPONENTS.cims.name} custody rights immediately, even when other HonkNet access is retained pending the new role's provisioning. ${priyaSharma.name} actions transfer tickets within five business days.`,

    "ps-6": `Signed access agreements accompany every ${DEMO_COMPONENTS.featherAuth.name} account, covering non-disclosure of ${DEMO_TERMS.strategicGooseReserve} tasking data and ${DEMO_TERMS.emergencyCoconutReserve} custody procedures. Agreements are re-signed annually alongside rules of behavior; ${samOkonkwo.name}'s team additionally re-signs the coconut-specific custody addendum at each ${DEMO_TERMS.quarterlyCoconutReconciliation}.`,

    "ps-7": `The Northern Maple Systems maintenance contract requires screening equivalent to CGDS standards and mandatory escort under ${DEMO_PROCEDURES.visitorEscort} at ${DEMO_LOCATIONS.honkwater.name} or ${DEMO_LOCATIONS.borderPost17.name}. The contract requires notification within 24 hours of any change in assigned contractor personnel; a missed notification in 2024 was raised as a contract performance issue rather than a security incident, since escort controls held throughout.`,

    "ps-8": `Policy violations are referred through the HR sanctions process. Clean-desk and unattended-console findings escalate to formal sanction only after a repeat violation by the same individual. ${garyMercer.name}'s repeated clean-desk findings at ${DEMO_LOCATIONS.missionControl.name} — including ${DEMO_INCIDENTS.garyCleanDesk.name} — have to date been handled through coaching rather than formal sanction, a point the last compliance review flagged as inconsistent with how the same finding would be handled for other staff.`,

    "ps-9": `Security responsibilities are written into position descriptions for the ISSO, configuration management lead, facilities lead, and Coconut Logistics Cell custody roles, maintained jointly by HR and ${priyaSharma.name}. Positions found to be operating against an outdated description are flagged during the quarterly privileged access review rather than left to the next full HR cycle.`,
  };
}
