import {
  DEMO_COMPONENTS,
  DEMO_INCIDENTS,
  DEMO_LOCATIONS,
  DEMO_PEOPLE,
  DEMO_PROCEDURES,
  DEMO_TERMS,
} from "../world";

const {
  garyMercer,
  margotChen,
  priyaSharma,
  dougBillings,
  taylorReid,
  samOkonkwo,
  caseyTremblay,
  helenCrowe,
  steveKowalski,
} = DEMO_PEOPLE;

/**
 * PE (Physical and Environmental Protection) family narratives, excluding
 * PE-3 (featured elsewhere). Doug Billings owns Honkwater Barracks / NHOC
 * physical security; Taylor Reid owns Border Post 17. Coconut Storage Vault
 * environmental monitoring is treated as unusually serious throughout, and
 * that seriousness is never explained.
 */
export function physicalEnvironmentalNarratives(): Record<string, string> {
  return {
    "pe-1": `CGDS-POL-PE Physical and Environmental Protection Policy is approved by ${margotChen.name} and maintained by ${dougBillings.name}. It covers ${DEMO_LOCATIONS.honkwater.name}, ${DEMO_LOCATIONS.nhoc.name}, ${DEMO_LOCATIONS.borderPost17.name}, the ${DEMO_LOCATIONS.coconutVault.name}, and the ${DEMO_LOCATIONS.moltingFacility.name}, and is reviewed annually and after any physical-access finding.`,

    "pe-2": `${dougBillings.name} authorizes badge access lists for ${DEMO_LOCATIONS.honkwater.name}, ${DEMO_LOCATIONS.nhoc.name}, and ${DEMO_LOCATIONS.missionControl.name}; ${taylorReid.name} authorizes badge access for ${DEMO_LOCATIONS.borderPost17.name}. ${priyaSharma.name} reviews both lists quarterly. ${garyMercer.name} may approve time-bound exception access for distinguished visitors to ${DEMO_LOCATIONS.missionControl.name}; those exceptions expire within 24 hours and are logged the same as any other authorization.`,

    "pe-4": `HonkNet cabling, patch panels, and distribution frames are secured in locked telecom closets at ${DEMO_LOCATIONS.honkwater.name} and ${DEMO_LOCATIONS.borderPost17.name}. The conduit run feeding the ${DEMO_LOCATIONS.coconutVault.name} is physically inspected quarterly by facilities staff, a requirement added after an unrelated pest-control contractor was found with unsupervised access to the conduit trench in 2023.`,

    "pe-5": `Badge printers and ${DEMO_COMPONENTS.cims.name} report printers are located within controlled areas, not open floor space. Output left uncollected for more than 15 minutes at a shared printer triggers a clean-desk-style finding under ${DEMO_PROCEDURES.cleanDesk}. The badge-printer spool incident (${DEMO_INCIDENTS.printerSpool.name}) is the standing reference case for output-device misrouting.`,

    "pe-6": `${dougBillings.name}'s facilities group monitors access logs and CCTV for ${DEMO_LOCATIONS.honkwater.name} and ${DEMO_LOCATIONS.nhoc.name}; ${taylorReid.name} monitors ${DEMO_TERMS.nestPerimeter} sensors at ${DEMO_LOCATIONS.borderPost17.name}. Physical monitoring alerts are correlated against ${DEMO_COMPONENTS.nestWatch.name} intrusion telemetry by ${caseyTremblay.name}'s team so that a single event does not generate two disconnected tickets.`,

    "pe-6.1": `Intrusion alarms and CCTV cover the ${DEMO_LOCATIONS.honkwater.name} perimeter, ${DEMO_LOCATIONS.nhoc.name}, ${DEMO_LOCATIONS.missionControl.name}, and the ${DEMO_LOCATIONS.coconutVault.name}, with a two-hour response SLA. The vault entrance camera has logged recurring motion alarms attributed to loose coconut debris disturbed by the annex HVAC intake; the alarms are real, the debris source is not, and the finding remains open on the facilities log.`,

    "pe-8": `Visitor logs are maintained at ${DEMO_LOCATIONS.honkwater.name} by ${dougBillings.name} and at ${DEMO_LOCATIONS.borderPost17.name} by ${taylorReid.name}, retained under the audit and accountability retention schedule. Escorted visits by distinguished guests under ${garyMercer.name}'s sponsorship are recorded in the same log with the same fields as any other visitor entry; no separate or abbreviated record is kept.`,

    "pe-9": `Power distribution panels and the ${DEMO_LOCATIONS.nhoc.name} UPS are located in locked electrical rooms at ${DEMO_LOCATIONS.honkwater.name}. The ${DEMO_LOCATIONS.coconutVault.name} runs on a dedicated redundant circuit separate from general facility load, sized for its refrigeration and continuous environmental-monitoring equipment.`,

    "pe-10": `Emergency power shutoff switches for ${DEMO_LOCATIONS.missionControl.name} and the ${DEMO_LOCATIONS.coconutVault.name} are clearly marked, located near primary egress points, and protected by a hinged cover to prevent accidental activation. ${dougBillings.name}'s team tests both switches annually as part of the facilities exercise cycle.`,

    "pe-11": `${DEMO_LOCATIONS.nhoc.name} and ${DEMO_LOCATIONS.missionControl.name} draw UPS power sized for orderly shutdown of ${DEMO_COMPONENTS.sgopCore.name} and operator consoles. The ${DEMO_LOCATIONS.coconutVault.name} has its own backup generator dedicated solely to refrigeration and monitoring loads, and it sits ahead of general facility power in the load-shed priority sequence — a placement the current facilities design record does not explain, only documents.`,

    "pe-12": `Emergency lighting covers ${DEMO_LOCATIONS.honkwater.name} corridors, ${DEMO_LOCATIONS.nhoc.name}, ${DEMO_LOCATIONS.missionControl.name}, and egress routes at ${DEMO_LOCATIONS.borderPost17.name}. Lighting in the ${DEMO_LOCATIONS.coconutVault.name} is specified to remain bright enough during an outage to complete a visual chain-of-custody count without a hand torch, a requirement ${samOkonkwo.name}'s team insisted on during design.`,

    "pe-13": `Fire suppression is wet-pipe in general ${DEMO_LOCATIONS.honkwater.name} office space and clean-agent in ${DEMO_LOCATIONS.nhoc.name} and ${DEMO_LOCATIONS.missionControl.name} to protect electronics. The ${DEMO_LOCATIONS.coconutVault.name} uses clean-agent suppression exclusively; water is excluded by design given the reserve's sensitivity to moisture. The ${DEMO_LOCATIONS.moltingFacility.name} uses a suppression profile reviewed and approved by ${helenCrowe.name} to avoid agents unsafe for the birds housed there during recovery.`,

    "pe-13.1": `Fire detection in ${DEMO_LOCATIONS.honkwater.name} and ${DEMO_LOCATIONS.nhoc.name} automatically notifies the on-site fire brigade and pages the NHOC watch floor. Detection in the ${DEMO_LOCATIONS.coconutVault.name} additionally pages ${samOkonkwo.name} directly regardless of hour, reflecting how the Emergency Coconut Reserve is treated in every contingency document that mentions it. Detection in the ${DEMO_LOCATIONS.moltingFacility.name} pages ${helenCrowe.name}'s on-call veterinary line.`,

    "pe-14": `Temperature and humidity are monitored in the ${DEMO_LOCATIONS.nhoc.name} server room, the ${DEMO_LOCATIONS.coconutVault.name}, and the ${DEMO_LOCATIONS.moltingFacility.name}. Vault thresholds are tighter than standard cold-storage practice and any deviation raises an alarm directly in the ${DEMO_COMPONENTS.cims.name}; the specific band was set by the Coconut Logistics Cell and has outlived at least two facilities managers who tried to have it relaxed. Molting facility climate parameters are set by ${helenCrowe.name} under ${DEMO_TERMS.wingIntegrityProgram} medical requirements.`,

    "pe-15": `Water sensors are installed under the raised floor at ${DEMO_LOCATIONS.missionControl.name}, with roof and plumbing inspections scheduled quarterly at ${DEMO_LOCATIONS.honkwater.name} and ${DEMO_LOCATIONS.borderPost17.name}. The ${DEMO_LOCATIONS.coconutVault.name} sits below grade in Cold Storage Annex B and has sump pumps wired to alarm directly into the ${DEMO_COMPONENTS.cims.name}; even a brief water intrusion risk to the reserve is treated as a reportable event rather than a routine facilities ticket.`,

    "pe-16": `Deliveries to ${DEMO_LOCATIONS.honkwater.name} are received and inspected at the loading dock by facilities staff before anything enters a secure area. Deliveries to the ${DEMO_LOCATIONS.coconutVault.name} require ${samOkonkwo.name}'s sign-off against a matching ${DEMO_COMPONENTS.cims.name} purchase order and follow ${DEMO_TERMS.dualControlCoconutRelease} on receipt as well as release. Unscheduled deliveries to any secure area are refused at the dock.`,

    "pe-17": `Authorized remote administrators, including ${steveKowalski.name} and escorted Northern Maple Systems support staff, connect only through VPN with FeatherAuth multi-factor authentication. A physical security checklist covers home-office handling of ${DEMO_COMPONENTS.mobileTerminals.name} being reprovisioned remotely; the checklist is self-attested and has not yet been spot-audited, which ${priyaSharma.name} has flagged as a gap for the next assessment cycle.`,
  };
}
