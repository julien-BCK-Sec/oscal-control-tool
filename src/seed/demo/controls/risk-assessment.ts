import {
  DEMO_INCIDENTS,
  DEMO_PEOPLE,
  DEMO_POLICIES,
  DEMO_PROCEDURES,
  DEMO_SYSTEM,
  DEMO_TEAMS,
  DEMO_TERMS,
} from "../world";

const {
  garyMercer,
  margotChen,
  brendanWalsh,
  priyaSharma,
  samOkonkwo,
  rileyNguyen,
  caseyTremblay,
  nadiaFortin,
} = DEMO_PEOPLE;

/**
 * RA — Risk Assessment narratives, excluding RA-3 (featured elsewhere).
 */
export function riskAssessmentNarratives(): Record<string, string> {
  return {
    "ra-1": `${DEMO_POLICIES.risk} is owned by ${margotChen.name} and maintained by ${priyaSharma.name}. It assigns risk-assessment responsibilities across ${DEMO_TEAMS.acu}, the Coconut Logistics Cell, and Border Goose Squadron operations, and is consistent with applicable departmental risk-management direction. The policy is reviewed annually ahead of ${DEMO_TERMS.garyReview} and after any Honk Protocol activation, and is distributed to SGOC and NHOC supervisory staff at onboarding.`,

    "ra-2": `${DEMO_SYSTEM.name} is categorized Confidentiality Moderate, Integrity Moderate, Availability Moderate. The categorization rationale — loss of Strategic Goose Reserve tasking integrity, Emergency Coconut Reserve custody records, or border-defence coordination availability — is documented in the SGOP System Security Plan and reviewed by ${margotChen.name} before submission. ${brendanWalsh.name}, as authorizing official, reviews and approves the categorization decision at each major package update; the most recent approval accompanied the Goose Readiness Exercise 2026 milestone.`,

    "ra-3.1": `${margotChen.name} and ${samOkonkwo.name} jointly assess supply chain risk for SGOP Core hardware sourced through Northern Maple Systems and for Emergency Coconut Reserve provisioning through the Approved Coconut Suppliers registry. The assessment is updated annually and after significant changes to the relevant supply chain, including the supplier substitution that followed ${DEMO_INCIDENTS.coconut2024.name}. Current findings note single-sourcing risk on Mobile Field Terminal replacement parts and recommend a second qualified coconut supplier be onboarded before the next reconciliation cycle.`,

    "ra-5": `${rileyNguyen.name} runs authenticated vulnerability scans against SGOP Core, the Goose Operations Portal, FeatherAuth, and CIMS on a monthly cycle, with ad hoc scans triggered whenever a new vulnerability affecting in-use software is publicly reported. ${caseyTremblay.name} scans HonkNet-attached network devices and NestWatch sensors on the same cadence, using tooling selected for interoperability so results can be correlated without manual reconciliation between tool outputs. Findings are logged to the risk register and tracked to remediation by severity; unresolved critical findings block the next named-version snapshot.`,

    "ra-5.2": `${rileyNguyen.name} updates the scanned-vulnerability set weekly as new definitions are published by the scanning vendor, and immediately upon release of an advisory affecting a component inside the SGOP authorization boundary. Ad hoc updates are logged in the same change register used for configuration baselines.`,

    "ra-5.5": `Vulnerability scanning of SGOP Core and CIMS requires a privileged, time-bound credential issued by ${priyaSharma.name} for the duration of the scan window only. Scan credentials are distinct from operator and administrator accounts, are never shared with Northern Maple Systems personnel, and are disabled automatically at the close of each scheduled window.`,

    "ra-5.11": `CGDS maintains a public vulnerability reporting channel monitored by ${margotChen.name}'s office. Most submissions concern the public-facing Goose Operations Portal login page; a smaller number arrive asking, without any explanation being offered in return, why the organization's contingency communications plan involves birds. ${DEMO_TEAMS.acu} triages all reports within five business days and acknowledges receipt regardless of validity.`,

    "ra-7": `Risk register entries — including the long-standing coffee-machine VLAN 12 exception, the ownerless Goose Deployment API service account, and Nest Perimeter intrusion risk at Border Post 17 — are dispositioned by ${margotChen.name} as accepted, mitigated, or transferred in line with CGDS risk tolerance. ${garyMercer.name}, as system owner, formally accepts residual risk for findings that cannot be remediated before the next authorization milestone. Risk response decisions are revisited on the same cadence as ${DEMO_PROCEDURES.privilegedReview} and whenever a finding's underlying condition changes materially.`,

    "ra-9": `${margotChen.name} and ${nadiaFortin.name} perform criticality analysis identifying SGOP Core, the Goose Deployment API, and the Strategic Goose Registry as critical functions whose loss would directly impair Goose Readiness Level reporting. The analysis runs at each major architecture change and feeds the Migratory Continuity Plan's alternate-processing priorities. ${DEMO_INCIDENTS.printerSpool.name} prompted a supplementary review confirming that badge issuance, while operationally important, is not a critical function for continuity purposes.`,
  };
}
