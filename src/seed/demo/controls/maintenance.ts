import {
  DEMO_COMPONENTS,
  DEMO_LOCATIONS,
  DEMO_PEOPLE,
  DEMO_TERMS,
} from "../world";

const { margotChen, steveKowalski, dougBillings, samOkonkwo, taylorReid } =
  DEMO_PEOPLE;

/**
 * MA (Maintenance) family narratives. Steve Kowalski owns maintenance
 * operations for SGOP platform hardware; Doug Billings controls the physical
 * tool crib at Honkwater Barracks that most of these controls hang off of.
 */
export function maintenanceNarratives(): Record<string, string> {
  return {
    "ma-1": `CGDS-POL-MA Maintenance and Tool Control Policy is approved by ${margotChen.name} and maintained by ${steveKowalski.name}. It covers scheduled and unscheduled maintenance for ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.missionConsole.name}, ${DEMO_COMPONENTS.nestWatch.name} sensor arrays, and ${DEMO_COMPONENTS.mobileTerminals.name}. The policy is reviewed annually and after any maintenance-related finding raised during ${DEMO_TERMS.garyReview}.`,

    "ma-2": `${steveKowalski.name} schedules and logs preventive and corrective maintenance for ${DEMO_COMPONENTS.sgopCore.name} and ${DEMO_COMPONENTS.nestWatch.name} sensor hardware in the maintenance register. Pre- and post-maintenance functional testing confirms Border Post 17 sensors report correctly to ${taylorReid.name} before the maintenance ticket is closed. Emergency maintenance performed mid-incident under ${DEMO_TERMS.honkProtocol} is logged retroactively within one business day; three such entries from the 2025 nesting surge were closed late and are noted as a recurring process gap.`,

    "ma-3": `Maintenance tools are limited to an approved diagnostic set — laptops, cable testers, and sensor calibration kits — inventoried by ${steveKowalski.name} and checked in and out of a locked tool crib at ${DEMO_LOCATIONS.honkwater.name}. ${dougBillings.name}'s facilities staff hold physical custody of the crib outside maintenance hours. Tools are barred from entering ${DEMO_LOCATIONS.missionControl.name} or the ${DEMO_LOCATIONS.coconutVault.name} unless checked out under an open ticket.`,

    "ma-3.1": `Facilities staff visually inspect maintenance tools for improper modification, unapproved components, or tampering before each entry into ${DEMO_LOCATIONS.missionControl.name} and before entry into the ${DEMO_LOCATIONS.coconutVault.name}. The inspection log for vault entries carries a standing, unexplained annotation: the diagnostic bag has contained loose coconut fibre on eleven separate occasions since 2023. The finding is recorded each time and has never been traced to a source.`,

    "ma-3.2": `Removable media brought in with maintenance equipment — diagnostic USB keys, calibration drives — is scanned for malicious code by ${steveKowalski.name} before connection to ${DEMO_COMPONENTS.sgopCore.name} or the ${DEMO_COMPONENTS.cims.name}. Media presented by escorted maintainers is scanned on a dedicated air-gapped scanning station; media that fails the scan is quarantined and does not re-enter service pending replacement.`,

    "ma-3.3": `Maintenance equipment and media are not removed from ${DEMO_LOCATIONS.honkwater.name} or the ${DEMO_LOCATIONS.coconutVault.name} without ${steveKowalski.name}'s sign-off confirming sanitization, or documented approval that sanitization is not required. Equipment that touched ${DEMO_COMPONENTS.cims.name} coconut-custody data requires an additional co-signature from ${samOkonkwo.name} before departure, mirroring the dual-control expectations already applied to reserve custody itself.`,

    "ma-4": `Nonlocal maintenance to ${DEMO_COMPONENTS.sgopCore.name} is permitted only over an encrypted, centrally managed channel requiring multi-factor authentication, with sessions recorded and auto-terminated after 30 minutes of inactivity. Northern Maple Systems maintainers receive time-bound remote access authorized per ticket. A legacy analog line supporting field diagnostics for the ${DEMO_COMPONENTS.rfc1149Gateway.name} at ${DEMO_LOCATIONS.disasterRecoveryPond.name} does not meet current encryption requirements; replacing it requires rebuilding the communications hut and is tracked as an accepted risk pending capital funding.`,

    "ma-5": `${steveKowalski.name} maintains the authorized maintenance personnel list. Northern Maple Systems maintainers are escorted by ${dougBillings.name}'s staff at ${DEMO_LOCATIONS.honkwater.name} or by ${taylorReid.name}'s staff at ${DEMO_LOCATIONS.borderPost17.name}, and are technically monitored for the duration of any session with system access. Personnel without a completed background screening under the personnel security process may observe but may not touch equipment.`,

    "ma-6": `Spare parts SLAs are maintained for ${DEMO_COMPONENTS.nestWatch.name} sensor arrays, ${DEMO_COMPONENTS.missionConsole.name} hardware, and badge printers. A replacement fuser assembly for one Honkwater badge printer has been on backorder from Northern Maple Systems for eleven weeks against a 30-day SLA; the second printer is carrying the load in the interim and the delay is tracked on the facilities risk register.`,
  };
}
