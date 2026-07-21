import { DEMO_INCIDENTS, DEMO_PEOPLE, DEMO_POLICIES, DEMO_TEAMS } from "../world";

const {
  margotChen,
  priyaSharma,
  rileyNguyen,
  caseyTremblay,
  averyPatel,
  steveKowalski,
} = DEMO_PEOPLE;

/**
 * SI — System and Information Integrity narratives, excluding SI-4
 * (featured elsewhere). SI-4 enhancements are covered here as complements
 * to the base SI-4 narrative, not restatements of it.
 */
export function systemIntegrityNarratives(): Record<string, string> {
  return {
    "si-1": `${DEMO_POLICIES.integrity} is owned by ${priyaSharma.name} and reviewed annually alongside the configuration and audit policies. It assigns flaw remediation, malicious code protection, and monitoring responsibilities across ${rileyNguyen.name}, ${caseyTremblay.name}, and ${DEMO_TEAMS.acu}.`,

    "si-2": `${rileyNguyen.name} tracks security-relevant software and firmware updates for SGOP Core, CIMS, FeatherAuth, and NestWatch sensors, testing each update in a non-production environment before installation. Updates classified critical are installed within 72 hours of release; all others follow the standard monthly maintenance window. Flaw remediation activity is folded into the configuration management baseline so ${rileyNguyen.name}'s CM register reflects patch state, not just version labels.`,

    "si-2.2": `An automated inventory tool checks whether each SGOP-managed host has applicable security updates installed and reports gaps to ${rileyNguyen.name} weekly. Mobile Field Terminals, which are not always connected to HonkNet, are checked at next check-in rather than continuously.`,

    "si-3": `Endpoint malicious-code protection runs on Operator Workstations, Mission Planning Consoles, and Mobile Field Terminals, configured for automatic signature updates and scanning of removable media before mount. ${rileyNguyen.name} owns the baseline configuration; ${caseyTremblay.name}'s NestWatch platform independently flags network indicators consistent with malware behavior that endpoint tooling alone might miss. Detected malicious code triggers automatic quarantine and an alert to ${DEMO_TEAMS.acu}; no confirmed malicious code execution has occurred on a production SGOP host to date.`,

    "si-4.2": `${caseyTremblay.name} operates automated correlation tooling within NestWatch and the Telemetry Platform to support near real-time analysis of HonkNet and Nest Perimeter events, reducing the manual triage load on the NHOC watch floor.`,

    "si-4.4": `Criteria for unusual inbound and outbound HonkNet traffic — including Goose Deployment API calls outside approved tasking windows and unexpected outbound connections from the CIMS data tier — are defined by ${caseyTremblay.name} and monitored continuously at the boundary devices.`,

    "si-4.5": `NestWatch generates automated alerts on indications of compromise, including repeated FeatherAuth authentication failures and unauthorized Coconut Inventory Management System custody writes, routed to ${averyPatel.name} for immediate triage under Honk Protocol.`,

    "si-5": `${margotChen.name}'s office receives security advisories from national cyber-authority channels on an ongoing basis and disseminates applicable directives to ${rileyNguyen.name}, ${caseyTremblay.name}, and system administrators within one business day. Internal advisories are issued when CGDS-specific conditions warrant, such as the sensor retuning that followed ${DEMO_INCIDENTS.nestingSurge.name}.`,

    "si-7": `Integrity verification tools detect unauthorized changes to SGOP Core binaries, FeatherAuth configuration, and Strategic Goose Registry data. A detected unauthorized change triggers an automatic rollback attempt and a mandatory ${priyaSharma.name} review before the affected component is returned to service.`,

    "si-7.1": `Automated integrity checks against SGOP Core and CIMS binaries run at every service restart and on a nightly schedule; results are retained for 90 days in support of risk-response review.`,

    "si-7.7": `Unauthorized-change detections are routed directly into ${averyPatel.name}'s incident-response queue rather than a separate integrity-only mailbox, so a detected change and a security incident are never tracked as unrelated events.`,

    "si-8": `Email gateway spam protection is applied at CGDS entry and exit points, filtering messages before delivery to Operator Workstations. Updates are applied under the same configuration management policy governing other CGDS security tooling.`,

    "si-8.2": `Spam protection signatures update automatically on a daily schedule; manual intervention is required only when an update fails validation, which is logged and escalated to ${rileyNguyen.name}.`,

    "si-10": `Goose Deployment API and CIMS custody-entry forms validate input format, range, and type before accepting a submission. Malformed input is rejected with a generic error rather than processed, and rejected submissions are logged for ${DEMO_TEAMS.acu} review if the rejection rate spikes.`,

    "si-11": `SGOP Core and the Goose Operations Portal return generic error messages to operators — sufficient to guide the next corrective action, without stack traces, internal hostnames, or query details that could aid an attacker. Detailed diagnostic information is available only to ${steveKowalski.name} and ${rileyNguyen.name} through an internal logging interface outside the operator-facing application.`,

    "si-12": `SGOP tasking records, CIMS custody records, and audit logs are retained under the schedule described in the audit and accountability control set: 365 days online, seven years in the Backup Repository for coconut custody and deployment records, with disposal handled under organizational records-management requirements rather than ad hoc deletion.`,

    "si-16": `SGOP Core hosts run with standard operating-system memory protections — address space layout randomization and data execution prevention — enabled by default in the baseline ${rileyNguyen.name} maintains. No exception is currently authorized for any production host.`,
  };
}
