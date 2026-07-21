import {
  DEMO_COMPONENTS,
  DEMO_LOCATIONS,
  DEMO_PEOPLE,
  DEMO_POLICIES,
  DEMO_TERMS,
} from "../world";

const { margotChen, priyaSharma, jordanMacLeod, caseyTremblay } = DEMO_PEOPLE;

/**
 * PL (Planning) family narratives, excluding PL-2 (featured elsewhere).
 */
export function planningNarratives(): Record<string, string> {
  return {
    "pl-1": `${DEMO_POLICIES.planning} is approved by ${margotChen.name} and maintained by ${priyaSharma.name}. It defines the security planning process for SGOP, including when the system security plan, rules of behavior, and baseline tailoring records must be updated and reviewed.`,

    "pl-4": `All SGOP users sign rules of behavior before their ${DEMO_COMPONENTS.featherAuth.name} account is activated. The rules cover acceptable use of ${DEMO_COMPONENTS.mobileTerminals.name}, the boundary between authorized tasking and ${DEMO_TERMS.unauthorizedGooseDeployment}, and the limits of ${DEMO_TERMS.controlledBreadException}. ${jordanMacLeod.name} tracks signature completion alongside annual awareness training and reports outstanding signatures monthly.`,

    "pl-4.1": `Rules of behavior explicitly prohibit posting ${DEMO_TERMS.gooseReadinessLevels} status, deployment schedules, or images taken inside ${DEMO_TERMS.nestPerimeter} areas to personal social media. The prohibition was added after an operator posted a ${DEMO_LOCATIONS.missionControl.name} selfie with a caption referencing operational status; account access was suspended pending review and the rule, previously implied under general operational security guidance, was made explicit.`,

    "pl-8": `${caseyTremblay.name} maintains the security architecture description with ${priyaSharma.name}, describing segmentation between the mission-control zone, the HonkNet wide-area segment, and the ${DEMO_LOCATIONS.coconutVault.name} operations room, consistent with the authorization boundary in the system security plan. Privacy review confirms SGOP does not process consumer personal information; the review does cover personnel screening records and ${DEMO_COMPONENTS.cims.name} custody records tied to named individuals.`,

    "pl-10": `The NIST SP 800-53 Rev. 5 Moderate baseline was selected based on the Moderate confidentiality, integrity, and availability categorization recorded in the system security plan. The baseline is derived at build time from the pinned OSCAL profile and catalog and is not fetched at runtime.`,

    "pl-11": `Baseline tailoring decisions require joint sign-off from ${priyaSharma.name} (ISSO) and ${margotChen.name} (CISO) before any control is added, removed, or has its parameters adjusted from the selected baseline. The current tailoring rationale log lives in a shared spreadsheet pending migration into the planning workflow; that gap is tracked as technical debt and does not itself constitute an undocumented tailoring decision.`,
  };
}
