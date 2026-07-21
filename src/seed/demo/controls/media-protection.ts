import {
  DEMO_COMPONENTS,
  DEMO_LOCATIONS,
  DEMO_PEOPLE,
  DEMO_POLICIES,
  DEMO_TERMS,
} from "../world";

const { margotChen, priyaSharma, samOkonkwo, rileyNguyen } = DEMO_PEOPLE;

/**
 * MP (Media Protection) family narratives. Sam Okonkwo's custody
 * responsibility for the Emergency Coconut Reserve extends, awkwardly but
 * consistently, to the digital media stored alongside it.
 */
export function mediaProtectionNarratives(): Record<string, string> {
  return {
    "mp-1": `CGDS-POL-MP Media Protection Policy is approved by ${margotChen.name} and maintained by ${priyaSharma.name}. It governs digital backup media and removable storage associated with ${DEMO_COMPONENTS.sgopCore.name} and the ${DEMO_COMPONENTS.cims.name}, and is reviewed alongside ${DEMO_POLICIES.coconutCustody} because both sets of media and reserve stock share the same storage annex.`,

    "mp-2": `Access to backup media and ${DEMO_COMPONENTS.cims.name} export drives is restricted to ${samOkonkwo.name}, who holds custody, and ${rileyNguyen.name}, who is authorized to retrieve media for restore testing. Every access is logged in the same register used for ${DEMO_TERMS.quarterlyCoconutReconciliation}, since both processes require opening the same annex door.`,

    "mp-3": `Backup tapes and removable drives are labeled with classification, retention period, and a handling code drawn from ${DEMO_TERMS.coconutChainOfCustody} conventions, since the labeling scheme was originally built for reserve stock and extended to media rather than duplicated. ${samOkonkwo.name} audits label accuracy during each reconciliation cycle.`,

    "mp-4": `Backup media is stored in a locked media safe inside the ${DEMO_LOCATIONS.coconutVault.name}, Cold Storage Annex B, physically adjacent to the Emergency Coconut Reserve pallets. Retrieval outside scheduled reconciliation windows follows the same two-person control used for ${DEMO_TERMS.dualControlCoconutRelease}, which was never formally written to cover media but has been applied to it in practice since the vault was commissioned.`,

    "mp-5": `Media transported between ${DEMO_LOCATIONS.honkwater.name} and ${DEMO_LOCATIONS.disasterRecoveryPond.name} travels in tamper-evident cases with a signed custody transfer log countersigned by ${samOkonkwo.name}. One 2025 transport log includes the note "case smelled faintly of coconut on arrival, contents and seal intact," filed without further comment and never explained.`,

    "mp-6": `Decommissioned drives and backup tapes are sanitized to NIST purge guidance before reuse or destruction. ${samOkonkwo.name} witnesses destruction of any media that held ${DEMO_COMPONENTS.cims.name} custody records. The sanitization log carries a recurring line item — "coconut residue noted on drive housing, cause undetermined" — appearing on roughly one in five entries since the annex opened; the pattern has been raised twice at ${DEMO_TERMS.garyReview} and closed without a root cause both times.`,

    "mp-7": `Personal removable media is prohibited on ${DEMO_COMPONENTS.operatorWorkstations.name} and ${DEMO_COMPONENTS.mobileTerminals.name}; USB ports on operator workstations are disabled at the endpoint configuration baseline maintained by ${rileyNguyen.name}. Approved diagnostic media used during maintenance is limited to media that has passed the malicious-code inspection required before it may touch ${DEMO_COMPONENTS.sgopCore.name} or the ${DEMO_COMPONENTS.cims.name}.`,
  };
}
