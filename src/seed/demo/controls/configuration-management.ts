import {
  DEMO_COMPONENTS,
  DEMO_LOCATIONS,
  DEMO_PEOPLE,
  DEMO_POLICIES,
  DEMO_PROCEDURES,
  DEMO_TEAMS,
} from "../world";

const {
  rileyNguyen,
  margotChen,
  priyaSharma,
  caseyTremblay,
  nadiaFortin,
  steveKowalski,
} = DEMO_PEOPLE;

/**
 * Configuration Management (CM) family narratives, excluding cm-2 and cm-6
 * which are authored elsewhere. Riley Nguyen owns CM end to end.
 */
export function configurationManagementNarratives(): Record<string, string> {
  return {
    "cm-1": `${DEMO_POLICIES.configuration} is approved by ${margotChen.name} and maintained by ${rileyNguyen.name}. It assigns configuration authority for ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.goosePortal.name}, ${DEMO_COMPONENTS.nestWatch.name}, and ${DEMO_COMPONENTS.cims.name} baselines, defines the change-control board membership, and requires review annually and after significant change-control failures. Underlying procedures are indexed with the rest of ${DEMO_PROCEDURES.seeSteve} pending migration to a dedicated CM procedure library, a backlog item Riley Nguyen has carried for three consecutive quarters.`,

    "cm-2.2": `Nightly automation compares running configuration on ${DEMO_COMPONENTS.sgopCore.name} and ${DEMO_COMPONENTS.nestWatch.name} sensors against the approved baseline and pages ${rileyNguyen.name} on drift. The job itself drifted from its own documented schedule in 2025 and was corrected during a routine baseline audit, an irony noted without further comment in the CM working file.`,

    "cm-2.3": `${rileyNguyen.name} retains the two most recent approved baseline generations for ${DEMO_COMPONENTS.sgopCore.name} and ${DEMO_COMPONENTS.goosePortal.name} in the Backup Repository to support rollback. Retention beyond two generations requires a documented exception; none is currently open.`,

    "cm-2.7": `Mobile Field Terminals issued for ${DEMO_LOCATIONS.borderPost17.name} and forward staging run a hardened profile distinct from standard Operator Workstations: reduced local storage, disabled peripheral ports, and mandatory remote wipe on loss. ${nadiaFortin.name} coordinates kit issuance and return against this profile at ${DEMO_LOCATIONS.stagingAlpha.name}.`,

    "cm-3": `Proposed changes to ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.goosePortal.name}, and ${DEMO_COMPONENTS.deploymentApi.name} are logged, reviewed, and approved by the CM change-control board chaired by ${rileyNguyen.name} with ISSO participation from ${priyaSharma.name} before implementation. Emergency changes during active operations may proceed under verbal approval and must be entered into the change register within one business day; the register shows several such entries still marked "pending Riley's signature" from prior quarters.`,

    "cm-3.2": `Changes above minor severity require test evidence and a documented rollback plan before the change-control board will approve implementation. Documentation quality varies: some change tickets carry detailed test logs, while others cite only "verified, looked fine" — the latter are returned to the requester rather than accepted as sufficient evidence.`,

    "cm-3.4": `The change-control board includes ${priyaSharma.name} as security representative. CGDS has no standalone privacy office; ${priyaSharma.name} also performs privacy-impact screening for changes touching CIMS custody records or Mobile Field Terminal telemetry, an interim arrangement pending a dedicated privacy role.`,

    "cm-4": `${rileyNguyen.name} performs impact analysis before the change-control board approves changes to ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.nestWatch.name}, or ${DEMO_COMPONENTS.cims.name}, documenting effects on dependent systems including the Goose Deployment API and Telemetry Platform. Analyses for changes touching the Emergency Coconut Reserve custody chain are reviewed jointly with the Coconut Logistics Cell before approval.`,

    "cm-4.2": `Following implementation, ${caseyTremblay.name}'s team verifies that ${DEMO_COMPONENTS.nestWatch.name} alerting and HonkNet segmentation continue to function as specified before a change is marked closed. A change closed without this verification step in 2025 was later reopened after an unrelated audit; verification is now a mandatory checklist item rather than an assumed step.`,

    "cm-5": `Deployment rights to ${DEMO_COMPONENTS.sgopCore.name} and ${DEMO_COMPONENTS.goosePortal.name} production environments are restricted to a named FeatherAuth group maintained by ${rileyNguyen.name}, separate from the operational tasking roles used by SGOC operators. Requests to add operational staff to the deployment group are declined as a matter of course; the standing exception list is empty.`,

    "cm-7": `Baseline configurations for ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.honkNet.name} gateways, and Operator Workstations disable unused services, ports, and protocols. Field terminal images additionally disable Bluetooth and USB mass storage. A legacy Telnet listener discovered on a NestWatch sensor during a 2025 audit was disabled the same day and is tracked as a closed finding.`,

    "cm-7.1": `${rileyNguyen.name} reviews enabled ports, protocols, functions, and services on ${DEMO_COMPONENTS.sgopCore.name} and Mobile Field Terminals quarterly, cross-referenced against the least-functionality baseline. The review has surfaced no unresolved findings for three consecutive quarters, a streak the CM team declines to describe as remarkable given how recently the Telnet listener was found.`,

    "cm-7.2": `Application allowlisting on Operator Workstations and Mission Planning Console endpoints blocks execution of unapproved binaries. ${steveKowalski.name} maintains the allowlist rule set; exceptions require a signed change ticket. A contractor troubleshooting utility flagged and blocked in 2025 was later confirmed unnecessary and was not added to the allowlist.`,

    "cm-7.5": `Only software on the approved allowlist executes on SGOP endpoints; exceptions follow a documented allow-by-exception request reviewed by ${rileyNguyen.name} and time-boxed to 90 days. Wing Integrity veterinary diagnostic software used at the Secure Molting Facility is the most frequently renewed exception on the register.`,

    "cm-8": `${rileyNguyen.name} maintains the authoritative SGOP component inventory covering hardware, firmware, and software for ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.nestWatch.name}, ${DEMO_COMPONENTS.cims.name}, and issued Mobile Field Terminals, distinct from the Strategic Goose Registry, which inventories avian assets rather than IT components. Reconciliation against ${DEMO_TEAMS.acu} discovery scans occurs quarterly.`,

    "cm-8.1": `Inventory records update automatically when endpoint agents report installation or removal on managed workstations. Mobile Field Terminal issuance and return at ${DEMO_LOCATIONS.stagingAlpha.name} is logged manually by ${nadiaFortin.name}'s team, since field kits are frequently offline during deployment and cannot report through the standard agent.`,

    "cm-8.3": `${DEMO_COMPONENTS.nestWatch.name} flags devices connecting to ${DEMO_COMPONENTS.honkNet.name} that do not match a registered inventory record. ${caseyTremblay.name}'s team investigates unregistered-device alerts within 24 hours; most resolve as visiting contractor laptops that were provisioned but never logged in the inventory, a gap tracked for correction rather than treated as a security event.`,

    "cm-9": `${rileyNguyen.name} authors and maintains the CM Plan, which defines baseline identifier conventions, roles on the change-control board, tooling, and the relationship between CM and the Migratory Continuity Plan. ${margotChen.name} approves the plan annually. The plan explicitly deprecates ad hoc baseline labels such as those historically applied to production releases, in favor of a dated version scheme now in force for new baselines.`,

    "cm-10": `Software license compliance is tracked by ${rileyNguyen.name} against vendor entitlements for ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.featherAuth.name}, and CIMS components, including open-source components and their license terms. Unlicensed or unentitled software discovered during inventory reconciliation is removed and reported; none is currently open on the exception register.`,

    "cm-11": `Users may not install software on Operator Workstations or Mobile Field Terminals outside the approved allowlist process described under least functionality. Requests for local installs are routed through ${rileyNguyen.name}; a recurring request to install a personal note-taking application on NHOC watch-floor terminals remains denied pending a business justification that has not yet been submitted.`,

    "cm-12": `${rileyNguyen.name} and ${priyaSharma.name} maintain a data-location register identifying where Strategic Goose Reserve tasking data, CIMS custody records, and Mobile Field Terminal telemetry are stored and processed, including the SGOP data tier, Backup Repository, and Coconut Storage Vault operations room. The register is reviewed whenever a new component is added to the authorization boundary.`,

    "cm-12.1": `Automated discovery scans run against ${DEMO_COMPONENTS.honkNet.name} data-tier segments to detect information stored outside registered locations identified under the data-location register. A scan in 2025 located a shadow export of CIMS custody records on an unregistered file share; the share was decommissioned and the finding closed by ${rileyNguyen.name}.`,
  };
}
