import { DEMO_INCIDENTS, DEMO_PEOPLE, DEMO_PROCEDURES } from "../world";

const { margotChen, priyaSharma, samOkonkwo, rileyNguyen } = DEMO_PEOPLE;

const CGDS_POL_SR = "CGDS-POL-SR Supply Chain Risk Management Policy";

/**
 * SR — Supply Chain Risk Management narratives (all controls in scope).
 */
export function supplyChainNarratives(): Record<string, string> {
  return {
    "sr-1": `${CGDS_POL_SR} is owned by ${margotChen.name} and administered day-to-day by ${samOkonkwo.name}, covering supply chain risk for both SGOP Core hardware and software supply and Emergency Coconut Reserve provisioning. It is reviewed annually and after any material supplier change.`,

    "sr-2": `The supply chain risk management plan covers research, design, manufacturing, acquisition, delivery, integration, operations, and disposal for SGOP Core components sourced through Northern Maple Systems and for coconut stock sourced through the Approved Coconut Suppliers registry. ${samOkonkwo.name} reviews and updates the plan annually and immediately following a significant supply chain event, including ${DEMO_INCIDENTS.coconut2024.name}.`,

    "sr-2.1": `The CGDS supply chain risk management team consists of ${samOkonkwo.name} (lead), ${margotChen.name}, and ${priyaSharma.name}, supporting supplier vetting, contract review, and incident coordination across both the IT and coconut logistics supply chains.`,

    "sr-3": `${samOkonkwo.name} identifies and addresses weaknesses in coconut supply elements in coordination with ${margotChen.name}'s risk function, including the single-supplier dependency and inconsistent chain-of-custody documentation surfaced during ${DEMO_INCIDENTS.coconut2024.name}. Controls applied include the Approved Coconut Suppliers registry, dual-control receipt at the Coconut Storage Vault, and mandatory notification of any subcontracted logistics provider.`,

    "sr-5": `Procurement for both SGOP Core replacement components and Emergency Coconut Reserve stock favors multi-supplier qualification over single-award contracts where feasible, reducing exposure to a single point of supply-chain failure. ${samOkonkwo.name} applies this strategy to coconut procurement; ${margotChen.name} applies it to IT hardware sourcing decisions.`,

    "sr-6": `${samOkonkwo.name} reviews each Approved Coconut Supplier annually against delivery reliability, chain-of-custody documentation, and prior discrepancy history; a supplier involved in an unresolved discrepancy is suspended pending investigation. Northern Maple Systems undergoes a separate annual review led by ${margotChen.name} covering security posture and contractual compliance.`,

    "sr-8": `Approved Coconut Suppliers and Northern Maple Systems are contractually required to notify CGDS of security incidents, counterfeit findings, or supply disruptions affecting delivered components within 24 hours of discovery. ${samOkonkwo.name} maintains the current notification contact list for coconut suppliers; ${margotChen.name} maintains it for IT suppliers.`,

    "sr-10": `Incoming coconut pallets are inspected at the Coconut Storage Vault receiving dock for seal integrity and manifest accuracy before acceptance into the Emergency Coconut Reserve. Incoming SGOP hardware from Northern Maple Systems is inspected for tamper evidence before installation in Mission Control SC-3. ${samOkonkwo.name} performs the former; ${rileyNguyen.name} performs the latter.`,

    "sr-11": `CGDS maintains an anti-counterfeit policy covering both IT hardware components and Emergency Coconut Reserve stock. A counterfeit or substituted component — whether a non-genuine network part or a shipment that fails supplier-of-record verification — is reported to ${samOkonkwo.name} for coconut-related findings or ${margotChen.name} for IT hardware findings, and rejected rather than placed into service.`,

    "sr-11.1": `Coconut Logistics Cell receiving staff and ${rileyNguyen.name}'s hardware-acceptance team complete anti-counterfeit detection training annually, covering physical inspection technique and supplier-of-record verification steps.`,

    "sr-11.2": `Mobile Field Terminals and NestWatch sensor hardware sent to Northern Maple Systems for repair are tracked under configuration control from removal through return to service. ${rileyNguyen.name} verifies configuration state on return before a repaired unit is reintroduced to the HonkNet inventory.`,

    "sr-12": `Decommissioned IT hardware is disposed of through certified media-sanitization and destruction services under ${rileyNguyen.name}'s oversight. Damaged or expired coconut stock is disposed of separately under ${DEMO_PROCEDURES.coconutDisposal}, which is not itself a security control but is referenced here so the two disposal processes are not confused during audit.`,
  };
}
