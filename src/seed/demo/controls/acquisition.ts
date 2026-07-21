import {
  DEMO_LEVERAGED_SERVICES,
  DEMO_LOCATIONS,
  DEMO_PEOPLE,
  DEMO_PROCEDURES,
} from "../world";

const {
  garyMercer,
  margotChen,
  priyaSharma,
  dougBillings,
  samOkonkwo,
  rileyNguyen,
  caseyTremblay,
  nadiaFortin,
  steveKowalski,
} = DEMO_PEOPLE;

const CGDS_POL_SA = "CGDS-POL-SA System and Services Acquisition Policy";

/**
 * SA — System and Services Acquisition narratives (all controls in scope).
 */
export function acquisitionNarratives(): Record<string, string> {
  return {
    "sa-1": `${CGDS_POL_SA} is jointly owned by ${margotChen.name} and ${priyaSharma.name}, establishing acquisition security and privacy requirements for SGOP components and services. It requires that every contract or purchase order for a system component identify applicable security and privacy requirements before funds are committed, and is reviewed annually alongside the risk assessment policy.`,

    "sa-2": `${garyMercer.name} allocates a discrete budget line for SGOP Core and CIMS security functions as part of annual capital planning, determined jointly with ${margotChen.name} during mission and business process planning. The Goose Deployment API's real-time tasking requirements were used to justify the current line item, since Goose Readiness Level reporting depends on that funding remaining intact through the fiscal year.`,

    "sa-3": `${steveKowalski.name} manages the SGOP Core and Goose Operations Portal development lifecycle, incorporating security and privacy considerations from requirements through retirement. ${rileyNguyen.name} holds a configuration-management role at each lifecycle gate that is distinct from ${steveKowalski.name}'s development role, and individuals holding security or privacy responsibilities in the lifecycle are identified in the CGDS-STD-CM baseline register.`,

    "sa-4": `Acquisition contracts for SGOP components — including the Northern Maple Systems maintenance agreement and Emergency Coconut Reserve procurement through the Approved Coconut Suppliers registry — include explicit security and privacy functional requirements, assurance requirements, and documentation obligations, cited by reference where the underlying requirement is lengthy. ${samOkonkwo.name} maintains the Approved Coconut Suppliers registry and confirms supplier contract language against the acquisition checklist before renewal. ${margotChen.name} reviews security requirements language before any acquisition contract is signed.`,

    "sa-4.1": `Northern Maple Systems is contractually required to provide a description of the functional properties of the security controls it implements in the SGOP Core components it maintains, sufficient for ${priyaSharma.name} to map delivered functionality against the control baseline without needing source access.`,

    "sa-4.2": `Design and implementation information for SGOP Core controls — including interface specifications and high-level design for the FeatherAuth integration — is delivered by Northern Maple Systems at each major release and retained by ${rileyNguyen.name} alongside the configuration baseline it documents.`,

    "sa-4.9": `Northern Maple Systems discloses the functions, ports, protocols, and services used by each SGOP component it delivers; ${caseyTremblay.name} validates the disclosure against observed HonkNet traffic before a release is accepted into production.`,

    "sa-4.10": `Badge printers at ${DEMO_LOCATIONS.honkwater.name} and PIV-compatible readers used for Mission Control SC-3 access are purchased only from the FIPS 201-approved products list. ${dougBillings.name} verifies current listing status before any replacement purchase is approved.`,

    "sa-5": `Administrator documentation for SGOP Core, CIMS, and FeatherAuth — covering secure configuration, operation, and known configuration-related vulnerabilities — is obtained from Northern Maple Systems and supplemented by internal runbooks. Where a runbook has no confirmed owner, staff are directed to ${DEMO_PROCEDURES.seeSteve}, which is treated as a running joke among SGOC staff and, somewhat inconveniently, also as the fastest way to resolve a documentation gap.`,

    "sa-8": `SGOP Core applies least-privilege and defense-in-depth principles at the component boundary: the Goose Deployment API cannot write directly to the Strategic Goose Registry without passing through FeatherAuth authorization checks, and CIMS custody writes require the same dual-control pattern used throughout coconut operations. ${margotChen.name} reviews new component designs against these principles before implementation begins.`,

    "sa-9": `External system services in use include ${DEMO_LEVERAGED_SERVICES.sharedServicesIdentity}, ${DEMO_LEVERAGED_SERVICES.weatherFeed}, and ${DEMO_LEVERAGED_SERVICES.northernMaple}. ${margotChen.name} defines oversight responsibilities and required security controls for each leveraged service as a condition of the relationship continuing. Northern Maple Systems personnel are escorted at all times while on ${DEMO_LOCATIONS.honkwater.name} premises and hold no standing credentials in FeatherAuth.`,

    "sa-9.2": `Providers of leveraged external services identify the functions, ports, and protocols required for their service before onboarding; the migration-corridor weather feed, for example, is documented as outbound-only HTTPS polling with no inbound connection accepted into the SGOP boundary. ${caseyTremblay.name} maintains the current list.`,

    "sa-10": `Northern Maple Systems performs configuration management during SGOP Core development and change activity, documenting and controlling the integrity of changes under its own process, which is reconciled against ${rileyNguyen.name}'s baseline register at every release. Only organization-approved changes are implemented into the production authorization boundary; changes discovered during reconciliation that were not pre-approved are rolled back.`,

    "sa-11": `Northern Maple Systems maintains a plan for ongoing security and privacy assessment of SGOP Core and performs testing at each release gate, with results reviewed by ${priyaSharma.name} before deployment. A developer assertion that a fix "works on my machine" is not accepted in place of documented test evidence.`,

    "sa-15": `Northern Maple Systems follows a documented development process for SGOP Core that addresses security and privacy requirements and identifies the standards and tools used, including static analysis tooling run before each release candidate is delivered to ${steveKowalski.name} for acceptance.`,

    "sa-15.3": `Northern Maple Systems performs a criticality analysis of SGOP Core components at each major design decision point, aligned with the analysis ${margotChen.name} and ${nadiaFortin.name} perform internally, so that developer-side and CGDS-side critical-function findings are reconciled rather than tracked as two unrelated lists.`,

    "sa-22": `${rileyNguyen.name} tracks vendor support end-of-life dates for SGOP components and Mobile Field Terminals and schedules replacement before support lapses. A batch of Mobile Field Terminal handsets reached end-of-support in 2025 and was replaced ahead of schedule; the retired units were disposed of under the component disposal process rather than returned to operational stock.`,
  };
}
