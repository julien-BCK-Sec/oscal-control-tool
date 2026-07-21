import { DEMO_COMPONENTS, DEMO_LOCATIONS, DEMO_PEOPLE } from "../world";

const { margotChen, caseyTremblay, morganEllis } = DEMO_PEOPLE;

const CGDS_POL_SC =
  "CGDS-POL-SC System and Communications Protection Policy";

/**
 * SC — System and Communications Protection narratives (all controls in scope).
 */
export function communicationsProtectionNarratives(): Record<string, string> {
  return {
    "sc-1": `${CGDS_POL_SC} is owned by ${margotChen.name} and operationalized by ${caseyTremblay.name} for HonkNet and all SGOP network-facing components. It is reviewed annually and after any boundary change, including activation of ${DEMO_COMPONENTS.rfc1149Gateway.name}.`,

    "sc-2": `SGOP Core administrative functions are served from a management interface distinct from the operator-facing Goose Operations Portal; neither the Goose Deployment API nor the Coconut Inventory Management System exposes an administrative endpoint on the general operator network segment. ${caseyTremblay.name} enforces this separation at the HonkNet VLAN boundary.`,

    "sc-4": `Mission Planning Console sessions are cleared of prior-session memory contents before reassignment to a new operator; SGOP Core does not retain deployment-tasking data in shared buffers accessible across sessions.`,

    "sc-5": `HonkNet uplinks at ${DEMO_LOCATIONS.honkwater.name} and ${DEMO_LOCATIONS.borderPost17.name} are protected by upstream rate limiting and a traffic-scrubbing agreement negotiated with the carrier. ${caseyTremblay.name} monitors for volumetric anomalies against Nest Perimeter sensor feeds and can shed non-essential Goose Operations Portal traffic to preserve Goose Deployment API availability during a sustained event.`,

    "sc-7": `${caseyTremblay.name} monitors and controls HonkNet's external managed interfaces and the internal interfaces separating Mission Control SC-3 from the general campus network. The only publicly reachable component, the Goose Operations Portal's authentication front end, sits in a subnetwork physically and logically separated from SGOP Core and CIMS. All external connectivity terminates through managed boundary devices; there is no direct route from the internet to the data tier. ${DEMO_COMPONENTS.rfc1149Gateway.name} at ${DEMO_LOCATIONS.disasterRecoveryPond.name} is excluded from the standing boundary and is admitted only when HonkNet is formally declared unavailable, at which point it becomes the sole external interface under contingency procedures.`,

    "sc-7.3": `HonkNet maintains a documented, minimal set of external network connections. ${caseyTremblay.name} reviews the access-point count quarterly and requires ${margotChen.name}'s approval before adding a new external connection.`,

    "sc-7.4": `Each external telecommunications service — including the carrier uplinks at ${DEMO_LOCATIONS.honkwater.name} and ${DEMO_LOCATIONS.borderPost17.name} — has a managed interface with a documented traffic flow policy. Confidentiality and integrity of transiting information are protected as described under SC-8. Exceptions to the traffic flow policy require a documented mission justification and an expiry date; none are currently open.`,

    "sc-7.5": `HonkNet boundary devices deny all traffic by default. ${caseyTremblay.name} maintains the exception list permitting only named services, including FeatherAuth federation traffic and the migration-corridor weather feed, and reviews it monthly to remove stale entries.`,

    "sc-7.7": `Mobile Field Terminals connecting to HonkNet from ${DEMO_LOCATIONS.borderPost17.name} or a field deployment site are prohibited from split tunneling. All traffic routes through the managed VPN concentrator; no exception is currently authorized for field use.`,

    "sc-7.8": `Operator Workstation and Mobile Field Terminal web-bound traffic routes through an authenticated proxy at the HonkNet boundary, letting ${caseyTremblay.name} apply content filtering and log outbound connections before they leave the authorization boundary.`,

    "sc-8": `Transmission confidentiality and integrity across HonkNet are protected by TLS on all SGOP Core, Goose Portal, and CIMS network paths. When ${DEMO_COMPONENTS.rfc1149Gateway.name} is activated as a contingency carrier, confidentiality is instead provided by sealed, tamper-evident physical custody rather than in-transit encryption; ${morganEllis.name} treats this as a documented compensating control rather than a gap, since the RFC 2549 quality-of-service profile does not define a cryptographic transport layer.`,

    "sc-8.1": `TLS 1.2 or higher with an approved cipher suite list is required for all in-scope network transmission. ${caseyTremblay.name} disables deprecated protocol versions at the HonkNet load balancers and reviews the approved cipher list annually against current guidance.`,

    "sc-10": `Mission Planning Console and Operator Workstation sessions disconnect automatically after 15 minutes of network inactivity. Mobile Field Terminal sessions disconnect after 30 minutes to account for intermittent connectivity at ${DEMO_LOCATIONS.borderPost17.name}.`,

    "sc-12": `Cryptographic keys for FeatherAuth, CIMS, and SGOP Core transport encryption are established, distributed, and rotated under a key management procedure maintained by ${caseyTremblay.name} and reviewed by ${margotChen.name}. Rotation is scheduled annually or immediately upon suspected compromise; no compromise has been recorded to date.`,

    "sc-13": `SGOP components use FIPS-validated cryptographic modules for data protection, key establishment, and transport security. ${margotChen.name} approves the specific cryptographic uses and required algorithm strength for each use case during design review.`,

    "sc-15": `Remote activation of NHOC watch-floor video conferencing devices is prohibited by default. Any exception requires ${caseyTremblay.name}'s written approval and an explicit indicator light showing active use to personnel physically present.`,

    "sc-17": `CGDS operates an internal certificate authority for HonkNet service certificates; only its trust anchor and one external provider's trust anchor for federated identity are included in managed trust stores. ${caseyTremblay.name} rejects certificate requests that reference an unapproved certificate authority.`,

    "sc-18": `Browser scripting and document macros are restricted on Operator Workstations to an approved list; unsigned mobile code is blocked at the HonkNet proxy. ${caseyTremblay.name} authorizes exceptions for specific Goose Operations Portal features that require client-side scripting and monitors their use.`,

    "sc-20": `CGDS-authoritative DNS zones are signed, providing origin authentication and integrity verification for name resolution responses returned to external requesters. ${caseyTremblay.name} maintains signing-key rollover on the published rotation schedule.`,

    "sc-21": `HonkNet's recursive resolvers perform DNSSEC validation on responses received from authoritative sources and reject responses that fail validation, reducing exposure to spoofed resolution results affecting SGOP Core lookups.`,

    "sc-22": `Name resolution service for HonkNet is provided by role-separated authoritative and recursive resolvers, with redundant instances at ${DEMO_LOCATIONS.honkwater.name} and ${DEMO_LOCATIONS.borderPost17.name}, so that loss of either site does not remove resolution service for the other.`,

    "sc-23": `Goose Deployment API and Goose Operations Portal sessions use bound, non-guessable session tokens with replay protection; a session cannot be reused after an IP address change without re-authenticating through FeatherAuth.`,

    "sc-28": `Strategic Goose Registry and CIMS custody records at rest in the SGOP data tier are encrypted. ${caseyTremblay.name} confirms encryption status as part of the change-acceptance process for any new data-tier storage.`,

    "sc-28.1": `At-rest encryption for the SGOP data tier and Backup Repository uses FIPS-validated modules with keys managed under SC-12, distinct from the transport keys used for SC-8.1. ${margotChen.name} reviews the at-rest key management procedure annually.`,

    "sc-39": `SGOP Core's executing processes on Mission Control SC-3 hosts run in separate execution domains; a fault or compromise in the Goose Portal rendering process does not share memory space with SGOP Core's tasking engine process.`,
  };
}
