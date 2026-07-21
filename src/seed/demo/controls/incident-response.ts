import {
  DEMO_COMPONENTS,
  DEMO_INCIDENTS,
  DEMO_LEVERAGED_SERVICES,
  DEMO_PEOPLE,
  DEMO_POLICIES,
  DEMO_TEAMS,
  DEMO_TERMS,
} from "../world";

const {
  averyPatel,
  margotChen,
  priyaSharma,
  garyMercer,
  rileyNguyen,
  morganEllis,
} = DEMO_PEOPLE;

/**
 * Incident Response (IR) family narratives, excluding ir-4 and ir-6 which
 * are authored elsewhere. Avery Patel owns IR end to end.
 */
export function incidentResponseNarratives(): Record<string, string> {
  return {
    "ir-1": `${DEMO_POLICIES.incidentResponse} is approved by ${margotChen.name} and maintained by ${averyPatel.name}. It defines Honk Protocol severity tiers, roles, and reporting obligations for events affecting ${DEMO_TERMS.strategicGooseReserve} tasking, Nest Perimeter integrity, and Emergency Coconut Reserve custody, and is reviewed annually and after each activation of Honk Protocol.`,

    "ir-2": `${averyPatel.name} delivers annual incident-response training to the National Honk Operations Centre watch floor, the Avian Cybersecurity Unit, and Border Goose Squadron, covering Honk Protocol activation criteria and evidence handling. Refresher training is mandatory within 30 days of any confirmed incident for staff who were directly involved.`,

    "ir-3": `Honk Protocol is tested through tabletop exercises twice yearly and a functional exercise once yearly, aligned with the Goose Readiness Exercise cycle. ${averyPatel.name} documents findings and tracks corrective actions; recent exercises drew scenarios from ${DEMO_INCIDENTS.printerSpool.name} and ${DEMO_INCIDENTS.breadPerimeter.name}.`,

    "ir-3.2": `Incident response testing is coordinated with the Migratory Continuity Plan exercise cycle (${morganEllis.name}) and CM change-freeze windows (${rileyNguyen.name}) so that IR exercises do not overlap with contingency testing or active change implementation on the same systems.`,

    "ir-4.1": `${DEMO_COMPONENTS.nestWatch.name} automatically correlates alerts and opens a tracking ticket before a human analyst confirms an incident, reducing the time to Honk Protocol activation for high-confidence detections. ${DEMO_TEAMS.acu} tunes correlation rules after each exercise; a rule tuned too aggressively after ${DEMO_INCIDENTS.nestingSurge.name} produced a week of duplicate tickets before being corrected.`,

    "ir-5": `${averyPatel.name} maintains the incident log recording every Honk Protocol activation, current status, and closure evidence, reviewed weekly by ${margotChen.name}. The log includes activations later downgraded to non-incidents, retained for trend analysis rather than deleted.`,

    "ir-6.1": `Confirmed Honk Protocol activations above the defined severity threshold trigger automated paging to ${margotChen.name}, ${priyaSharma.name}, and, for mission-impacting events, ${garyMercer.name}. The paging integration was itself the subject of a badge-printer-adjacent ticket in 2025 after a misconfigured routing rule paged the wrong on-call rotation for one weekend; the rule has since been corrected and is covered by a monitoring check.`,

    "ir-6.3": `When an incident involves a supply-chain element — a compromised Northern Maple Systems maintenance credential or an irregular Emergency Coconut Reserve shipment — ${averyPatel.name} coordinates notification and evidence-sharing with the affected party under the applicable contract terms. ${DEMO_LEVERAGED_SERVICES.northernMaple} is the only current contracted party subject to this coordination requirement.`,

    "ir-7": `${averyPatel.name}'s team provides on-call incident-response assistance to SGOC, NHOC, and Border Goose Squadron staff who suspect but cannot confirm an incident, reachable through the same channel used for confirmed Honk Protocol reports. Requests for assistance are logged regardless of whether they result in a confirmed incident.`,

    "ir-7.1": `A self-service knowledge base gives NHOC watch-floor and field staff triage guidance for common suspected-incident scenarios before escalating to ${averyPatel.name}'s team. The knowledge base explicitly does not attempt to automate a decision on whether an event involving live avian assets constitutes a security incident; that determination remains a human judgment call.`,

    "ir-8": `The Honk Protocol Incident Response Plan, distinct from the policy in ${DEMO_POLICIES.incidentResponse}, documents the incident-response program structure: mission, resources, roles for ${averyPatel.name}'s team and supporting units, and the communication plan to ${margotChen.name}, ${priyaSharma.name}, and ${garyMercer.name}. ${garyMercer.name} approves the plan annually and signs each after-action report distributed to CGDS leadership.`,
  };
}
