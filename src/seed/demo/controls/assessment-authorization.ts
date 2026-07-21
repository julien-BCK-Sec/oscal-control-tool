import {
  DEMO_COMPONENTS,
  DEMO_LEVERAGED_SERVICES,
  DEMO_PEOPLE,
  DEMO_TEAMS,
  DEMO_TERMS,
} from "../world";
import type { DemoNarrativeMap } from "./types";

const { brendanWalsh, priyaSharma, margotChen, garyMercer, rileyNguyen } =
  DEMO_PEOPLE;

/** Assessment, Authorization, and Monitoring family narratives (all new). */
export function assessmentAuthorizationNarratives(): DemoNarrativeMap {
  return {
    "ca-1": `The CGDS assessment, authorization, and continuous monitoring policy is owned by ${brendanWalsh.name} as authorizing official and maintained by ${priyaSharma.name}. It sets the cadence for control assessments, the format of the plan of action and milestones, and the conditions that trigger reauthorization. The policy is reviewed annually and after any significant change to the ${DEMO_TERMS.strategicGooseCapability} authorization boundary.`,

    "ca-2": `${priyaSharma.name} coordinates control assessments across the access control, audit, and configuration families ahead of each authorization decision, scheduling technical testing with ${DEMO_TEAMS.acu} and interviews with control owners such as ${rileyNguyen.name}. Findings are tracked to closure and summarized for ${brendanWalsh.name} before he signs the authorization decision described under ca-6.`,

    "ca-2.1": `Assessments touching privileged access and ${DEMO_TERMS.emergencyCoconutReserve} custody controls are performed by an assessor drawn from ${DEMO_TEAMS.acu} but outside the ${DEMO_TEAMS.sgoc} reporting chain, preserving independence from ${garyMercer.name}'s system-owner role. ${margotChen.name} arranges assessor assignments each cycle to avoid a control owner assessing their own control.`,

    "ca-3": `Information exchange agreements document the boundary and data terms for ${DEMO_LEVERAGED_SERVICES.sharedServicesIdentity}, the read-only weather feed described under ${DEMO_LEVERAGED_SERVICES.weatherFeed}, and the escorted maintenance access provided by ${DEMO_LEVERAGED_SERVICES.northernMaple}. ${margotChen.name} and ${brendanWalsh.name} review exchange terms whenever a leveraged service changes its scope of access.`,

    "ca-5": `${priyaSharma.name} maintains the plan of action and milestones, tracking open items including the ownerless ${DEMO_COMPONENTS.deploymentApi.name} service account, the coffee-machine VLAN 12 firewall exception retained since 2014, and the quarantined backup volume awaiting replacement media. Milestones are reviewed monthly and reported to ${brendanWalsh.name} before any authorization decision that depends on their status.`,

    "ca-6": `${brendanWalsh.name} signs the authorization decision based on the current system security plan, assessment results, and the open items in the plan of action and milestones. Reauthorization is required on a fixed interval or immediately upon a significant change to the authorization boundary, whichever occurs first; ${priyaSharma.name} tracks the reauthorization date and initiates the package refresh in advance.`,

    "ca-7": `The CGDS continuous monitoring strategy combines automated ${DEMO_COMPONENTS.nestWatch.name} feeds, the quarterly privileged access review, and the daily audit triage performed by ${DEMO_TEAMS.acu}. ${priyaSharma.name} compiles a monthly monitoring summary for ${brendanWalsh.name} and ${margotChen.name} covering control status changes and any new plan of action and milestones entries.`,

    "ca-7.1": `A subset of continuous monitoring controls is independently validated once a year by an assessor outside the ${DEMO_TEAMS.sgoc} reporting chain, using the same independence approach applied under ca-2.1. Discrepancies between self-reported monitoring status and the independent check are logged as findings rather than quietly corrected.`,

    "ca-7.4": `The risk register maintained under ra-3 is reviewed monthly as part of continuous monitoring, tracking whether accepted risks — including the ownerless service account and the long-standing VLAN 12 exception — are trending toward closure or simply persisting. ${margotChen.name} escalates any risk that shows no forward movement across two consecutive monthly reviews.`,

    "ca-9": `Internal connections among ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.deploymentApi.name}, ${DEMO_COMPONENTS.gooseRegistry.name}, ${DEMO_COMPONENTS.cims.name}, and ${DEMO_COMPONENTS.nestWatch.name} are documented in interconnection security notes maintained by ${rileyNguyen.name}. Each connection is reviewed for continued necessity and data sensitivity whenever the configuration baseline changes.`,
  };
}
