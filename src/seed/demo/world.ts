/**
 * Canonical fictional organization for the development/demo seed project.
 * Encoded into ProjectMetadata and control narratives — the domain model does
 * not yet persist users, locations, or components as first-class fields.
 */

export const DEMO_ORGANIZATION = {
  shortName: "CGDS",
  name: "Canadian Goose Defence System",
  mission:
    "The Canadian Goose Defence System develops, coordinates, maintains, deploys, monitors, and recalls Canada's Strategic Goose Reserve in support of national sovereignty, border defence, critical infrastructure protection, rapid avian response, territorial denial, and public-sector deterrence operations.",
} as const;

export const DEMO_SYSTEM = {
  shortName: "SGOP",
  name: "Strategic Goose Operations Platform",
} as const;

/** Recurring official terminology. Use selectively across narratives. */
export const DEMO_TERMS = {
  strategicGooseReserve: "Strategic Goose Reserve",
  strategicGooseCapability: "Strategic Goose Capability",
  gooseReadinessLevels: "Goose Readiness Levels",
  nationalHonkOperationsCentre: "National Honk Operations Centre",
  borderGooseSquadron: "Border Goose Squadron",
  rapidHonkResponseTeam: "Rapid Honk Response Team",
  gooseDeploymentAuthority: "Goose Deployment Authority",
  tacticalHonkingProcedures: "Tactical Honking Procedures",
  aggressionReadinessAssessments: "Aggression Readiness Assessments",
  wingIntegrityProgram: "Wing Integrity Program",
  annualHonkCertification: "Annual Honk Certification",
  nestPerimeter: "Nest Perimeter",
  unauthorizedGooseDeployment: "Unauthorized Goose Deployment",
  gooseRecallProcedure: "Goose Recall Procedure",
  avianAssetCustodian: "Avian Asset Custodian",
  migratoryContinuityPlan: "Migratory Continuity Plan",
  controlledBreadException: "Controlled Bread Exception Process",
  emergencyCoconutReserve: "Emergency Coconut Reserve",
  coconutChainOfCustody: "Coconut Chain of Custody",
  quarterlyCoconutReconciliation: "Quarterly Coconut Reconciliation",
  dualControlCoconutRelease: "dual-control coconut release",
  honkProtocol: "Honk Protocol",
  nestingSeasonSurge: "Nesting Season Surge",
  garyReview: "Gary's Annual Performance Review",
} as const;

/**
 * Recurring people. Ordinary staff use normal Canadian surnames; institutional
 * goose terminology lives in team/facility/procedure names, not punchline surnames.
 */
export const DEMO_PEOPLE = {
  garyMercer: {
    name: "Gary Mercer",
    title: "Director of Goose Operations",
    role: "System Owner",
  },
  margotChen: {
    name: "Dr. Margot Chen",
    title: "Chief Information Security Officer",
    role: "CISO",
  },
  brendanWalsh: {
    name: "Lt. Col. Brendan Walsh",
    title: "Authorization Official",
    role: "Authorizing Official",
  },
  priyaSharma: {
    name: "Priya Sharma",
    title: "Information System Security Officer",
    role: "ISSO",
  },
  dougBillings: {
    name: "Doug Billings",
    title: "Facility Security Officer",
    role: "Physical Security Lead, Honkwater Barracks",
  },
  samOkonkwo: {
    name: "Sam Okonkwo",
    title: "Supply Chain and Inventory Lead",
    role: "Coconut Logistics Cell Lead",
  },
  rileyNguyen: {
    name: "Riley Nguyen",
    title: "Configuration Manager",
    role: "CM Lead",
  },
  averyPatel: {
    name: "Avery Patel",
    title: "Incident Response Lead",
    role: "IR Lead",
  },
  jordanMacLeod: {
    name: "Jordan MacLeod",
    title: "Awareness and Training Coordinator",
    role: "AT Lead",
  },
  caseyTremblay: {
    name: "Casey Tremblay",
    title: "Network Security Engineer",
    role: "HonkNet / NestWatch Lead",
  },
  morganEllis: {
    name: "Morgan Ellis",
    title: "Continuity Planner",
    role: "Contingency Planning Lead",
  },
  taylorReid: {
    name: "Taylor Reid",
    title: "Border Post Security Supervisor",
    role: "Physical Security, Border Post 17",
  },
  nadiaFortin: {
    name: "Nadia Fortin",
    title: "Goose Deployment Coordinator",
    role: "Goose Deployment Authority / Avian Asset Custodian",
  },
  helenCrowe: {
    name: "Dr. Helen Crowe",
    title: "Veterinary Support Officer",
    role: "Wing Integrity Program Lead",
  },
  steveKowalski: {
    name: "Steve Kowalski",
    title: "Senior Systems Administrator",
    role: "SGOP platform operations",
  },
} as const;

export const DEMO_TEAMS = {
  sgoc: "Strategic Goose Operations Command (SGOC)",
  acu: "Avian Cybersecurity Unit (ACU)",
  borderSquadron: "Border Goose Squadron",
  rhrt: "Rapid Honk Response Team",
  clc: "Coconut Logistics Cell (CLC)",
  nhoc: "National Honk Operations Centre watch floor",
  facilities: "Honkwater Barracks Facilities Group",
  veterinary: "Wing Integrity veterinary detachment",
} as const;

export const DEMO_LOCATIONS = {
  honkwater: {
    name: "Honkwater Barracks",
    region: "Ottawa River Valley, Ontario",
    purpose: "CGDS headquarters campus",
  },
  nhoc: {
    name: "National Honk Operations Centre",
    region: "Honkwater Barracks, Building A",
    purpose: "24/7 coordination of Goose Readiness Levels and deployments",
  },
  borderPost17: {
    name: "Border Post 17",
    region: "Niagara Flats, Ontario",
    purpose: "Forward Nest Perimeter for Border Goose Squadron operations",
  },
  missionControl: {
    name: "Mission Control SC-3",
    region: "National Honk Operations Centre, Secure Compartment SC-3",
    purpose: "Primary SGOP operator space and authorization-boundary core",
  },
  coconutVault: {
    name: "Coconut Storage Vault",
    region: "Honkwater Barracks, Cold Storage Annex B",
    purpose: "Emergency Coconut Reserve custody and reconciliation",
  },
  stagingAlpha: {
    name: "Goose Staging Area Alpha",
    region: "Honkwater Barracks airside apron",
    purpose: "Pre-deployment staging under Goose Deployment Authority",
  },
  secondaryNest: {
    name: "Secondary Nesting Site",
    region: "Lower Ottawa floodplain (controlled access)",
    purpose: "Alternate nesting and surge capacity",
  },
  disasterRecoveryPond: {
    name: "Disaster Recovery Pond",
    region: "12 km west of Honkwater Barracks",
    purpose: "Alternate processing and Migratory Continuity Plan site",
  },
  moltingFacility: {
    name: "Secure Molting Facility",
    region: "Honkwater Barracks veterinary wing",
    purpose: "Wing Integrity Program medical and recovery operations",
  },
} as const;

export const DEMO_POLICIES = {
  accessControl: "CGDS-POL-001 Access Control Policy",
  incidentResponse: "CGDS-POL-IR Honk Protocol Incident Response Plan",
  contingency: "CGDS-POL-CP Migratory Continuity Plan (G-COOP)",
  configuration: "CGDS-STD-CM Configuration Baseline Standard",
  personnel: "CGDS-POL-PS Personnel Security Screening Directive",
  awareness: "CGDS-POL-AT Security Awareness and Training Policy",
  audit: "CGDS-POL-AU Audit and Accountability Policy",
  identification: "CGDS-POL-IA Identification and Authentication Policy",
  planning: "CGDS-POL-PL System Security Planning Policy",
  risk: "CGDS-POL-RA Risk Assessment Policy",
  integrity: "CGDS-POL-SI System and Information Integrity Policy",
  coconutCustody: "CGDS-POL-CLC Coconut Chain of Custody Directive",
  breadException: "CGDS-POL-PE Controlled Bread Exception Process",
} as const;

export const DEMO_COMPONENTS = {
  sgopCore: {
    name: "SGOP Core",
    description:
      "Authoritative mission-planning and tasking engine for Strategic Goose Reserve operations",
    owner: "Steve Kowalski",
    host: "Mission Control SC-3",
  },
  goosePortal: {
    name: "Goose Operations Portal",
    description: "Operator-facing web interface to SGOP Core workflows",
    owner: "Steve Kowalski",
    host: "HonkNet application tier",
  },
  deploymentApi: {
    name: "Goose Deployment API",
    description:
      "Machine interface used by Goose Deployment Authority to issue and recall deployments",
    owner: "Nadia Fortin",
    host: "HonkNet application tier",
  },
  gooseRegistry: {
    name: "Strategic Goose Registry",
    description:
      "Authoritative inventory of avian assets, readiness state, and custodian assignments",
    owner: "Nadia Fortin",
    host: "SGOP data tier",
  },
  honkCoordination: {
    name: "National Honk Coordination Service",
    description:
      "Watch-floor service correlating Goose Readiness Levels across NHOC and Border Post 17",
    owner: "Casey Tremblay",
    host: "National Honk Operations Centre",
  },
  honkNet: {
    name: "HonkNet",
    description:
      "CGDS internal network connecting Honkwater Barracks, NHOC, Border Post 17, and field terminals",
    owner: "Casey Tremblay",
    host: "Campus and WAN segments",
  },
  nestWatch: {
    name: "NestWatch",
    description:
      "Intrusion detection, Nest Perimeter telemetry, and anomalous activity monitoring",
    owner: "Casey Tremblay",
    host: "HonkNet security tier",
  },
  featherAuth: {
    name: "FeatherAuth",
    description: "Enterprise identity provider for SGOP and HonkNet accounts",
    owner: "Priya Sharma",
    host: "Identity services VLAN",
  },
  cims: {
    name: "Coconut Inventory Management System (CIMS)",
    description:
      "System of record for Emergency Coconut Reserve counts, custody, and release authorizations",
    owner: "Sam Okonkwo",
    host: "Coconut Storage Vault operations room",
  },
  missionConsole: {
    name: "Mission Planning Console",
    description: "Hardened operator consoles in Mission Control SC-3",
    owner: "Steve Kowalski",
    host: "Mission Control SC-3",
  },
  operatorWorkstations: {
    name: "Operator Workstations",
    description: "Standard NHOC and SGOC desktop endpoints",
    owner: "Steve Kowalski",
    host: "Honkwater Barracks",
  },
  mobileTerminals: {
    name: "Mobile Field Terminals",
    description:
      "Ruggedized NestPad terminals issued to Border Goose Squadron and Rapid Honk Response Team",
    owner: "Nadia Fortin",
    host: "Field kits / Goose Staging Area Alpha",
  },
  telemetry: {
    name: "Telemetry Platform",
    description:
      "Aggregates avian asset health, Nest Perimeter sensors, and deployment status",
    owner: "Casey Tremblay",
    host: "HonkNet data tier",
  },
  backupRepo: {
    name: "Backup Repository",
    description: "Nightly and weekly backup target for SGOP and CIMS data sets",
    owner: "Morgan Ellis",
    host: "Honkwater Barracks backup vault",
  },
  rfc1149Gateway: {
    name: "Emergency RFC 1149 Communications Gateway",
    description:
      "Contingency carrier for out-of-band coordination when HonkNet is unavailable; RFC 2549 QoS profile applied",
    owner: "Casey Tremblay",
    host: "Disaster Recovery Pond communications hut",
  },
} as const;

export const DEMO_INVENTORY = {
  fieldTablets: "42 Mobile Field Terminals (NestPad)",
  radios: "6 goose-tracking radios assigned to Rapid Honk Response Team",
  coconutReserve: "Emergency Coconut Reserve (12 pallets, Coconut Storage Vault)",
  badgePrinters: "2 PIV-compatible badge printers at Honkwater Barracks",
  stagingKits: "8 field deployment kits at Goose Staging Area Alpha",
} as const;

export const DEMO_LEVERAGED_SERVICES = {
  sharedServicesIdentity:
    "Shared Services Canada identity federation feeding FeatherAuth",
  weatherFeed:
    "Provincial migration-corridor weather feed (read-only, leveraged)",
  northernMaple:
    "Northern Maple Systems — contracted maintenance and operations support",
} as const;

export const DEMO_PROCEDURES = {
  accountProvisioning: "SGOP-PROC-AC-02 Account Provisioning and Deprovisioning",
  privilegedReview: "SGOP-PROC-AC-06 Quarterly Privileged Access Review",
  coconutReconciliation: "SGOP-PROC-CLC-04 Quarterly Coconut Reconciliation",
  coconutRelease: "SGOP-PROC-CLC-07 Dual-Control Coconut Release",
  coconutDisposal: "SGOP-PROC-CLC-09 Coconut Disposal Procedure",
  coconutProcurement: "SGOP-PROC-CLC-11 Emergency Coconut Procurement Authority",
  honkProtocolActivation: "SGOP-PROC-IR-01 Honk Protocol Activation",
  gooseRecall: "SGOP-PROC-OPS-05 Goose Recall Procedure",
  unauthorizedDeployment: "SGOP-PROC-OPS-08 Unauthorized Goose Deployment Response",
  gCoopExercise: "SGOP-PROC-CP-03 Goose Readiness Exercise",
  visitorEscort: "SGOP-PROC-PE-03 Visitor Escort and Nest Perimeter Access",
  breadException: "SGOP-PROC-PE-12 Controlled Bread Exception Process",
  cleanDesk: "SGOP-PROC-PE-04 Clean Desk and Unattended Console",
  garyReview: "SGOP-PROC-PM-01 Gary's Annual Performance Review",
  seeSteve: "SGOP-PROC-CM-00 Operational Documentation (See Steve)",
} as const;

export const DEMO_INCIDENTS = {
  coconut2024: {
    name: "Lost Coconut Incident (2024)",
    summary:
      "CIMS reported a custody discrepancy against the Emergency Coconut Reserve; dual-control recount in the Coconut Storage Vault closed the ticket after chain-of-custody reconstruction.",
  },
  nestingSurge: {
    name: "Nesting Season Surge (2025)",
    summary:
      "NestWatch alert volume exceeded watch-floor capacity; thresholds and playbooks were retuned under Honk Protocol.",
  },
  breadPerimeter: {
    name: "Unauthorized bread introduction at Border Post 17",
    summary:
      "Visitor attempted Nest Perimeter approach carrying bread; Controlled Bread Exception Process was not in effect. Procedures updated.",
  },
  printerSpool: {
    name: "Badge-printer spool incident",
    summary:
      "A misrouted print job delivered PIV badge templates to the wrong queue; IR classified and contained the event within one hour.",
  },
  garyCleanDesk: {
    name: "Unattended Mission Planning Console finding",
    summary:
      "Gary Mercer left working materials on a Mission Planning Console in SC-3 during a clean-desk sweep; session lock and coaching applied.",
  },
} as const;

export const DEMO_USERS = {
  operators: "SGOC Mission Operators",
  watchFloor: "National Honk Operations Centre watch officers",
  securityAnalysts: "ACU security analysts",
  fieldResponders: "Border Goose Squadron and Rapid Honk Response Team operators",
  logistics: "Coconut Logistics Cell clerks",
  veterinary: "Wing Integrity veterinary staff",
  facilities: "Honkwater Facilities Group staff",
  contractors: "Northern Maple Systems maintainers (escorted)",
} as const;

export const DEMO_SECURITY_CATEGORIZATION = {
  confidentiality: "Moderate",
  integrity: "Moderate",
  availability: "Moderate",
  rationale:
    "SGOP directs Strategic Goose Reserve tasking and Emergency Coconut Reserve custody records. Compromise of confidentiality, integrity, or availability could impair border defence coordination, territorial denial planning, and rapid avian response.",
} as const;
