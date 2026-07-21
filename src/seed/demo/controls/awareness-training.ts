import {
  DEMO_INCIDENTS,
  DEMO_PEOPLE,
  DEMO_TEAMS,
  DEMO_TERMS,
} from "../world";
import type { DemoNarrativeMap } from "./types";

const { jordanMacLeod, margotChen, priyaSharma, helenCrowe, garyMercer } =
  DEMO_PEOPLE;

/**
 * Awareness and Training family narratives, excluding at-1 and at-2, which
 * are authored in ./featured.
 */
export function awarenessTrainingNarratives(): DemoNarrativeMap {
  return {
    "at-2.2": `Role-based training for the Coconut Logistics Cell and ${DEMO_TEAMS.acu} includes an insider-threat module covering indicators relevant to ${DEMO_TERMS.emergencyCoconutReserve} custody and ${DEMO_TERMS.gooseDeploymentAuthority} tasking authority. ${jordanMacLeod.name} coordinates content with ${margotChen.name}; the annual refresh incorporates de-identified process lessons from ${DEMO_INCIDENTS.coconut2024.name} without naming individuals involved in the original discrepancy.`,

    "at-2.3": `Training covers social engineering attempts against CGDS staff, including impersonation of ${garyMercer.name}'s authority to request an expedited coconut release outside ${DEMO_TERMS.dualControlCoconutRelease} and phishing messages framed as urgent ${DEMO_TERMS.honkProtocol} activations. ${DEMO_TEAMS.acu} runs a simulated phishing campaign twice yearly; ${jordanMacLeod.name} tracks click-through rates and assigns remedial training to repeat responders.`,

    "at-3": `${jordanMacLeod.name} maintains a role-to-module training matrix: ${DEMO_TEAMS.acu} completes security-operations modules, Coconut Logistics Cell clerks complete dual-control handling training tied to ${DEMO_TERMS.coconutChainOfCustody}, field responders complete ${DEMO_TERMS.tacticalHonkingProcedures} and ${DEMO_TERMS.controlledBreadException} modules, and Wing Integrity veterinary staff complete the medical-handling module delivered by ${helenCrowe.name}. Each role's assigned modules are reconfirmed whenever duties change.`,

    "at-4": `Training completion is recorded in the CGDS training spreadsheet described under at-1 and at-2; ${jordanMacLeod.name} is the custodian of record and retains completion history for the current appointment plus the two prior cycles. ${priyaSharma.name} spot-checks a sample of records each quarter against ${DEMO_TEAMS.acu} and Coconut Logistics Cell rosters to confirm the spreadsheet has not silently fallen out of date.`,
  };
}
