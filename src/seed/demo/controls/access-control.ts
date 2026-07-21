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
import type { DemoNarrativeMap } from "./types";

const {
  garyMercer,
  margotChen,
  priyaSharma,
  rileyNguyen,
  caseyTremblay,
  nadiaFortin,
  brendanWalsh,
  jordanMacLeod,
} = DEMO_PEOPLE;

/**
 * Access Control family narratives, excluding ac-1, ac-2, ac-3, and ac-6,
 * which are authored in ./featured.
 */
export function accessControlNarratives(): DemoNarrativeMap {
  return {
    "ac-2.1": `${DEMO_COMPONENTS.featherAuth.name} automates account creation, modification, disabling, and removal for ${DEMO_TEAMS.sgoc} and ${DEMO_TEAMS.nhoc} staff, driven by the HR separations feed. ${priyaSharma.name} owns the workflow. Coconut Logistics Cell and Wing Integrity veterinary accounts are not yet fed by the HR system and are provisioned manually under ${DEMO_PROCEDURES.accountProvisioning}; the gap is tracked for closure once the veterinary HR platform is migrated.`,

    "ac-2.2": `Time-bound accounts are enforced automatically by ${DEMO_COMPONENTS.featherAuth.name}: Mobile Field Terminal accounts sponsored by ${nadiaFortin.name} for ${DEMO_TEAMS.borderSquadron} deployments expire after 30 days, and emergency responder accounts created during ${DEMO_TERMS.honkProtocol} expire 72 hours after activation regardless of whether the incident is still open. ${priyaSharma.name} approves any extension request before expiry.`,

    "ac-2.3": `Accounts are disabled automatically after 45 days of inactivity in ${DEMO_COMPONENTS.featherAuth.name} and immediately upon termination for staff covered by the HR separations feed. ${priyaSharma.name} reviews the disabled-account queue weekly. Coconut Logistics Cell and veterinary accounts, lacking HR integration per ac-2.1, are disabled manually within one business day of a reported departure.`,

    "ac-2.4": `${DEMO_COMPONENTS.featherAuth.name} streams every account lifecycle event — creation, modification, disabling, removal — to NestWatch for retention and review. ${DEMO_TEAMS.acu} audits the lifecycle stream during the daily watch-floor sweep described under au-6. Events are retained under the schedule in ${DEMO_POLICIES.audit}.`,

    "ac-2.5": `${DEMO_COMPONENTS.missionConsole.name} sessions in ${DEMO_LOCATIONS.missionControl.name} force an automatic logout, not merely a screen lock, after 15 minutes of inactivity; ${DEMO_COMPONENTS.operatorWorkstations.name} elsewhere in ${DEMO_LOCATIONS.honkwater.name} force logout after 20 minutes. The setting was tightened after ${DEMO_INCIDENTS.garyCleanDesk.name}.`,

    "ac-2.13": `${margotChen.name} and ${priyaSharma.name} may disable an individual's ${DEMO_COMPONENTS.featherAuth.name} accounts immediately upon identification as high risk — pending termination, contested access dispute, or an open ${DEMO_TERMS.honkProtocol} personnel finding — without waiting for the standard HR separations feed used in ac-2.3. Each use is logged and briefed to ${brendanWalsh.name} within one business day.`,

    "ac-4": `${caseyTremblay.name} enforces information flow control on ${DEMO_COMPONENTS.honkNet.name} between the ${DEMO_TEAMS.sgoc} and ${DEMO_TEAMS.nhoc} segment, the Coconut Logistics Cell and ${DEMO_COMPONENTS.cims.name} segment, and the ${DEMO_LOCATIONS.borderPost17.name} field segment. Boundary rules restrict ${DEMO_COMPONENTS.deploymentApi.name} traffic to defined ports and directions; the provincial migration-corridor weather feed is permitted inbound only, with no path back into any SGOP segment.`,

    "ac-5": `Duties are separated so that the Coconut Logistics Cell clerk who logs a coconut receipt in ${DEMO_COMPONENTS.cims.name} cannot also approve its release, preserving ${DEMO_TERMS.dualControlCoconutRelease}. ${rileyNguyen.name}'s configuration-management rights are held separately from any ${DEMO_TEAMS.acu} security-administration role, and ${nadiaFortin.name}'s deployment-authority function is separate from account administration held by ${priyaSharma.name}. The separation matrix is reviewed annually with ${DEMO_POLICIES.accessControl}.`,

    "ac-6.1": `Administrative consoles for ${DEMO_COMPONENTS.nestWatch.name} and ${DEMO_COMPONENTS.featherAuth.name} are restricted to named ${DEMO_TEAMS.acu} members. ${margotChen.name} approves each grant, access is logged, and membership is recertified quarterly alongside the review described under ${DEMO_PROCEDURES.privilegedReview}.`,

    "ac-6.2": `${rileyNguyen.name} and ${caseyTremblay.name} each hold a standard, non-privileged account for routine email and portal use, separate from the privileged account used for configuration or security-administration tasks. ${garyMercer.name} has twice requested that his standard account be granted convenience administrative rights; both requests were denied under ${DEMO_PROCEDURES.privilegedReview}.`,

    "ac-6.5": `Privileged ${DEMO_COMPONENTS.featherAuth.name} roles are limited to ${DEMO_TEAMS.acu} members, ${rileyNguyen.name} for configuration management, and the on-call watch supervisor. ${priyaSharma.name} maintains the authoritative privileged-account list and confirms it against ${DEMO_COMPONENTS.featherAuth.name} group membership each quarter.`,

    "ac-6.7": `${DEMO_PROCEDURES.privilegedReview} runs quarterly across ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.cims.name}, and ${DEMO_COMPONENTS.deploymentApi.name}. The most recent cycle reconfirmed that ${garyMercer.name}'s system-owner role does not require standing privileged access to any of the three systems; findings are reported to ${margotChen.name} and closed within 30 days.`,

    "ac-6.9": `Privileged command execution — ${DEMO_TERMS.dualControlCoconutRelease} approvals, ${DEMO_COMPONENTS.deploymentApi.name} tasking, and ${DEMO_COMPONENTS.nestWatch.name} configuration changes — is logged in full. ${DEMO_TEAMS.acu} reviews the privileged-command log during the daily sweep, feeding the same review described for au-6 and au-12.`,

    "ac-6.10": `${DEMO_COMPONENTS.featherAuth.name} role enforcement blocks non-privileged accounts from invoking ${DEMO_COMPONENTS.cims.name} release functions, ${DEMO_COMPONENTS.deploymentApi.name} tasking calls, or ${DEMO_COMPONENTS.nestWatch.name} configuration endpoints at the application layer, not merely by hiding the corresponding buttons in the user interface. ${rileyNguyen.name} verifies this control during each baseline review.`,

    "ac-7": `${DEMO_COMPONENTS.featherAuth.name} locks an account after five failed logon attempts within 15 minutes. The lockout lasts 30 minutes or until ${priyaSharma.name} clears it manually. Mobile Field Terminal lockouts recorded while offline synchronize to ${DEMO_COMPONENTS.featherAuth.name} once ${DEMO_TEAMS.borderSquadron} terminals regain ${DEMO_COMPONENTS.honkNet.name} connectivity.`,

    "ac-8": `${DEMO_COMPONENTS.sgopCore.name}, the Goose Operations Portal, and Mobile Field Terminals each display an approved use-notification banner before authentication, stating that the system is for official CGDS use only and that activity is monitored and subject to audit. ${margotChen.name} approves banner wording; the field-terminal version is cached for offline display at ${DEMO_LOCATIONS.stagingAlpha.name}.`,

    "ac-11": `${DEMO_COMPONENTS.missionConsole.name} terminals in ${DEMO_LOCATIONS.missionControl.name} lock the screen and require badge tap or re-authentication after 15 minutes of inactivity, distinct from the full session termination described under ac-2.5. General ${DEMO_COMPONENTS.operatorWorkstations.name} lock after 20 minutes. The requirement followed directly from findings in ${DEMO_INCIDENTS.garyCleanDesk.name}.`,

    "ac-11.1": `Locked ${DEMO_COMPONENTS.missionConsole.name} and ${DEMO_COMPONENTS.operatorWorkstations.name} screens display only the CGDS crest, obscuring any ${DEMO_TERMS.gooseReadinessLevels} dashboard, deployment map, or coconut custody figure that was on screen at lock time. ${rileyNguyen.name} verifies the obscuring behavior as part of each workstation baseline.`,

    "ac-12": `${DEMO_COMPONENTS.sgopCore.name} and ${DEMO_COMPONENTS.deploymentApi.name} sessions terminate after 30 minutes of idle time or 12 hours of total duration, whichever comes first, regardless of ongoing activity. Sessions supporting an active ${DEMO_TERMS.honkProtocol} response are force-terminated on stand-down rather than left to expire naturally, closing a gap identified after ${DEMO_INCIDENTS.nestingSurge.name}.`,

    "ac-14": `The only actions permitted without identification or authentication are the public CGDS awareness page and the posted emergency-contact placard at the ${DEMO_LOCATIONS.borderPost17.name} visitor gate. ${margotChen.name} maintains the exhaustive list; no ${DEMO_TERMS.strategicGooseReserve} tasking, telemetry, or coconut custody function is reachable without authentication.`,

    "ac-17": `Remote access is limited to VPN-authenticated sessions for named ${DEMO_TEAMS.acu} and configuration-management staff, plus escorted maintenance sessions for Northern Maple Systems maintainers. ${margotChen.name} approves each remote-access grant, documented in the remote-access annex to ${DEMO_POLICIES.accessControl}.`,

    "ac-17.1": `${DEMO_COMPONENTS.nestWatch.name} logs and monitors every remote session for duration, source, and commands issued. Sessions auto-terminate after eight hours. A remote logon originating outside the expected geographic range raises an immediate ${DEMO_TEAMS.acu} alert regardless of whether the credential is valid.`,

    "ac-17.2": `Remote sessions require TLS 1.2 or higher over the approved VPN cipher suite maintained by ${caseyTremblay.name}. ${DEMO_COMPONENTS.rfc1149Gateway.name} is explicitly excluded from the remote-access authorization boundary: it is a contingency communications path activated only when ${DEMO_COMPONENTS.honkNet.name} itself is unavailable, not a general remote-access channel.`,

    "ac-17.3": `All remote access is routed through a single managed VPN concentrator at ${DEMO_LOCATIONS.honkwater.name}; split tunneling is disabled at the client configuration level. ${caseyTremblay.name} manages the concentrator and reviews its connection log weekly for unmanaged access attempts.`,

    "ac-17.4": `Privileged remote commands against ${DEMO_COMPONENTS.cims.name} release functions or ${DEMO_COMPONENTS.deploymentApi.name} tasking are not permitted from remote sessions except during a declared ${DEMO_TERMS.honkProtocol} emergency, in which case ${margotChen.name} conducts a post-hoc review within 24 hours and documents the justification in the after-action record.`,

    "ac-18": `${DEMO_COMPONENTS.honkNet.name} wireless coverage at ${DEMO_LOCATIONS.honkwater.name} and the ${DEMO_LOCATIONS.borderPost17.name} field kit uses WPA3-Enterprise with certificate-based authentication issued through ${DEMO_COMPONENTS.featherAuth.name}. ${caseyTremblay.name} owns the wireless infrastructure and rotates certificates annually.`,

    "ac-18.1": `Wireless clients authenticate with mutual certificates and encrypt traffic with AES; the setting cannot be downgraded from an endpoint. Guest wireless at ${DEMO_LOCATIONS.honkwater.name} is logically and physically segmented from ${DEMO_COMPONENTS.honkNet.name} and has no route to any SGOP component.`,

    "ac-18.3": `Mobile Field Terminals ship with wireless networking disabled outside of approved ${DEMO_COMPONENTS.honkNet.name} SSIDs. Enabling any other wireless interface requires a documented baseline exception from ${rileyNguyen.name}; ${DEMO_TEAMS.borderSquadron} terminals are audited for unapproved wireless state during each field kit inspection.`,

    "ac-19": `Mobile Field Terminals are enrolled in mobile device management enforcing the ${rileyNguyen.name} baseline, remote wipe capability, and an application allowlist limited to ${DEMO_COMPONENTS.sgopCore.name} field modules and ${DEMO_COMPONENTS.honkCoordination.name} clients. ${nadiaFortin.name} issues terminals from ${DEMO_LOCATIONS.stagingAlpha.name} against the device inventory.`,

    "ac-19.5": `Every Mobile Field Terminal is full-disk encrypted before issuance; encryption state is verified at issuance and re-confirmed during each quarterly field kit inspection at ${DEMO_LOCATIONS.stagingAlpha.name}. A terminal found with encryption disabled is withdrawn from service pending ${rileyNguyen.name}'s re-imaging.`,

    "ac-20": `Personal devices are prohibited from connecting to ${DEMO_COMPONENTS.honkNet.name}. Northern Maple Systems maintainer laptops connect only through an escorted, logically isolated maintenance segment with no route to ${DEMO_COMPONENTS.deploymentApi.name}, ${DEMO_COMPONENTS.cims.name}, or the ${DEMO_TERMS.strategicGooseReserve} registry. Terms are set in the contracted-support agreement referenced in ${DEMO_POLICIES.personnel}.`,

    "ac-20.1": `Authorized external-system use is limited to the read-only provincial weather feed and the isolated Northern Maple Systems maintenance jump host. Neither path is permitted to reach ${DEMO_COMPONENTS.deploymentApi.name} or ${DEMO_COMPONENTS.cims.name} directly; ${caseyTremblay.name} confirms the restriction during each ${DEMO_COMPONENTS.honkNet.name} boundary review.`,

    "ac-20.2": `USB storage ports are disabled by default on ${DEMO_COMPONENTS.operatorWorkstations.name} and ${DEMO_COMPONENTS.missionConsole.name} terminals. Exceptions require ${rileyNguyen.name}'s written approval, are time-limited, and are logged; the control was reviewed following the ${DEMO_INCIDENTS.printerSpool.name} to confirm removable media was not the delivery path.`,

    "ac-21": `${DEMO_TERMS.gooseReadinessLevels} summaries are shared with partner agencies only under a signed information-sharing agreement approved by ${brendanWalsh.name}. ${margotChen.name} performs a classification review before release, and every disclosure is logged against the receiving agency and purpose.`,

    "ac-22": `${jordanMacLeod.name} drafts public CGDS awareness content; ${margotChen.name} approves it before posting to confirm it contains no controlled information, ${DEMO_TERMS.gooseReadinessLevels} detail, or ${DEMO_TERMS.emergencyCoconutReserve} custody figures. A quarterly review of the live public page confirms no sensitive content has been reintroduced through an unreviewed edit.`,
  };
}
