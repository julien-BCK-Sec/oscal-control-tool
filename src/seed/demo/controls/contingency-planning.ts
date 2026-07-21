import {
  DEMO_COMPONENTS,
  DEMO_LOCATIONS,
  DEMO_PEOPLE,
  DEMO_POLICIES,
  DEMO_PROCEDURES,
  DEMO_TERMS,
} from "../world";

const {
  morganEllis,
  garyMercer,
  rileyNguyen,
  averyPatel,
  dougBillings,
  caseyTremblay,
  priyaSharma,
} = DEMO_PEOPLE;

/**
 * Contingency Planning (CP) family narratives, excluding cp-2 and cp-9
 * which are authored elsewhere. Morgan Ellis owns CP end to end.
 */
export function contingencyPlanningNarratives(): Record<string, string> {
  return {
    "cp-1": `${DEMO_POLICIES.contingency} is approved by ${garyMercer.name} and maintained by ${morganEllis.name}. It establishes contingency planning responsibility for ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.cims.name}, and the Migratory Continuity Plan program, and requires review annually and after any Goose Readiness Exercise generates corrective actions.`,

    "cp-2.1": `${morganEllis.name} coordinates the Migratory Continuity Plan against the CM Plan (${rileyNguyen.name}), the Honk Protocol incident response plan (${averyPatel.name}), and Honkwater Barracks physical security continuity arrangements (${dougBillings.name}) at a quarterly cross-walk meeting. The most recent meeting identified an unreconciled gap between contingency recovery time objectives and the CM change-freeze calendar, now tracked as an open action.`,

    "cp-2.3": `The Migratory Continuity Plan defines resumption priority: Strategic Goose Reserve tasking and Emergency Coconut Reserve custody functions resume first, followed by standard NHOC watch-floor reporting and administrative functions. ${morganEllis.name} validates these priorities against current mission commitments before each annual plan revision.`,

    "cp-2.8": `Critical assets identified in the Migratory Continuity Plan are ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.deploymentApi.name}, ${DEMO_COMPONENTS.gooseRegistry.name}, and ${DEMO_COMPONENTS.cims.name}, cross-referenced against the CM component inventory maintained by ${rileyNguyen.name}. The Goose Deployment API's ownerless service account, tracked separately as a risk item, is flagged in the plan as a single point of contingency failure requiring manual intervention during recovery.`,

    "cp-3": `${morganEllis.name} delivers annual contingency training to the National Honk Operations Centre watch floor and Border Goose Squadron, covering Migratory Continuity Plan roles, alternate-site activation, and ${DEMO_TERMS.gooseRecallProcedure} coordination under degraded conditions. Training completion is tracked alongside awareness training records and reviewed before each Goose Readiness Exercise.`,

    "cp-4": `The Migratory Continuity Plan is tested through tabletop exercises twice yearly and a functional exercise once yearly, timed to align with ${DEMO_PROCEDURES.gCoopExercise}. ${morganEllis.name} documents after-action findings and tracks corrective actions to closure; ${garyMercer.name} signs the after-action report and is on record disputing recall-timeline assumptions during nearly every exercise, a recurring line item that has not yet changed the modeled timelines.`,

    "cp-4.1": `Contingency plan testing is coordinated with incident response testing (${averyPatel.name}) and CM change-freeze windows (${rileyNguyen.name}) so that exercises do not collide with active change implementation. A 2025 exercise scheduled during an unplanned emergency change was rescheduled after the conflict was identified during pre-exercise review.`,

    "cp-6": `Backup media for ${DEMO_COMPONENTS.sgopCore.name} and ${DEMO_COMPONENTS.cims.name} are stored at ${DEMO_LOCATIONS.disasterRecoveryPond.name}, geographically separated from ${DEMO_LOCATIONS.honkwater.name}. ${morganEllis.name} confirms environmental and access controls at the alternate storage site during each annual exercise.`,

    "cp-6.1": `${DEMO_LOCATIONS.disasterRecoveryPond.name} is located approximately 12 km from ${DEMO_LOCATIONS.honkwater.name}, a separation distance validated by the risk assessment as sufficient to avoid shared flood, power, and network hazards affecting both sites simultaneously.`,

    "cp-6.3": `Seasonal flooding on the lower Ottawa floodplain periodically restricts road access to ${DEMO_LOCATIONS.disasterRecoveryPond.name}. ${morganEllis.name} maintains an alternate access route and a standing arrangement for boat access during flood conditions, tested most recently during the spring 2025 exercise.`,

    "cp-7": `${DEMO_LOCATIONS.borderPost17.name} and ${DEMO_LOCATIONS.disasterRecoveryPond.name} serve as alternate processing sites for ${DEMO_COMPONENTS.sgopCore.name} functions when ${DEMO_LOCATIONS.missionControl.name} is unavailable, including activation of ${DEMO_COMPONENTS.rfc1149Gateway.name} for out-of-band coordination. Activation authority rests with ${garyMercer.name} on ${morganEllis.name}'s recommendation.`,

    "cp-7.1": `${DEMO_LOCATIONS.borderPost17.name} and ${DEMO_LOCATIONS.disasterRecoveryPond.name} are sufficiently separated from ${DEMO_LOCATIONS.missionControl.name} that a single facility, power, or regional network event is not expected to disable both primary and alternate processing capability, per the current risk assessment.`,

    "cp-7.2": `Access agreements for ${DEMO_LOCATIONS.borderPost17.name} and ${DEMO_LOCATIONS.disasterRecoveryPond.name} are documented and reviewed by ${morganEllis.name} annually to confirm CGDS personnel retain priority access ahead of other tenants during a declared contingency.`,

    "cp-7.3": `Priority-of-service arrangements for alternate processing at ${DEMO_LOCATIONS.disasterRecoveryPond.name} cover power restoration and network circuit priority; ${DEMO_COMPONENTS.rfc1149Gateway.name} serves as the fallback communications path when circuit restoration is delayed, subject to its documented RFC 2549 quality-of-service constraints.`,

    "cp-8": `${DEMO_COMPONENTS.honkNet.name} primary connectivity is supplemented by a secondary carrier circuit and, as a last resort, ${DEMO_COMPONENTS.rfc1149Gateway.name}. ${morganEllis.name} maintains current contact and escalation information for both carriers and validates the fallback path during annual exercises.`,

    "cp-8.1": `The secondary HonkNet carrier circuit is provisioned under a priority-restoration service agreement. ${morganEllis.name} confirmed with the carrier in 2025 that the CGDS account is correctly flagged for priority restoration after the designation lapsed unnoticed for one renewal cycle; renewal tracking is now a standing calendar item.`,

    "cp-8.2": `A single-points-of-failure review identified that ${DEMO_LOCATIONS.nhoc.name} depends on one physical ISP entry point despite having two logical carrier circuits. Remediation to route the secondary circuit through a physically diverse entry point is an open action tracked by ${morganEllis.name} and ${caseyTremblay.name}.`,

    "cp-9.1": `${morganEllis.name} runs quarterly restore-reliability tests against a sample of ${DEMO_COMPONENTS.backupRepo.name} volumes, verifying checksums and completing a test restore to an isolated environment. The volume informally known as Schrödinger's Backup is excluded from sampling by design and remains quarantined pending replacement media.`,

    "cp-9.8": `Backups in ${DEMO_COMPONENTS.backupRepo.name} are encrypted at rest. Key custody follows a split-knowledge arrangement between ${morganEllis.name} and ${priyaSharma.name}; a full key-recovery drill is performed alongside the annual functional contingency exercise.`,

    "cp-10": `Recovery and reconstitution procedures restore ${DEMO_COMPONENTS.sgopCore.name} and ${DEMO_COMPONENTS.cims.name} to a known-good operating state following a disruption, culminating in a signed reconstitution checklist reviewed by ${morganEllis.name} and ${garyMercer.name} before normal operations resume. The checklist requires an explicit CIMS custody reconciliation before the Emergency Coconut Reserve is declared operational again.`,

    "cp-10.2": `${DEMO_COMPONENTS.sgopCore.name} and ${DEMO_COMPONENTS.cims.name} maintain transaction logs sufficient to roll back to the last consistent state after an interrupted operation, which is of particular importance for coconut custody ledger entries where partial writes have previously produced reconciliation discrepancies.`,
  };
}
