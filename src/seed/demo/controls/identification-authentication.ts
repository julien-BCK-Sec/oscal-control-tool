import {
  DEMO_COMPONENTS,
  DEMO_LOCATIONS,
  DEMO_PEOPLE,
  DEMO_POLICIES,
  DEMO_PROCEDURES,
  DEMO_LEVERAGED_SERVICES,
  DEMO_USERS,
} from "../world";

const { priyaSharma, margotChen, caseyTremblay, dougBillings, garyMercer } =
  DEMO_PEOPLE;

/**
 * Identification and Authentication (IA) family narratives, excluding ia-2
 * and ia-5 which are authored elsewhere. Priya Sharma and FeatherAuth own IA.
 */
export function identificationAuthenticationNarratives(): Record<
  string,
  string
> {
  return {
    "ia-1": `${DEMO_POLICIES.identification} is approved by ${margotChen.name} and maintained by ${priyaSharma.name}. It governs identity lifecycle, authenticator issuance, and device authentication for ${DEMO_COMPONENTS.featherAuth.name} across ${DEMO_COMPONENTS.sgopCore.name}, ${DEMO_COMPONENTS.goosePortal.name}, and ${DEMO_COMPONENTS.honkNet.name}, and is reviewed annually and after any authenticator-compromise finding.`,

    "ia-2.1": `Privileged FeatherAuth accounts, including Avian Cybersecurity Unit analyst and CM deployment roles, require hardware-token multi-factor authentication for every network-based logon. ${priyaSharma.name} reviews token registration against the privileged access list quarterly alongside the access-control team.`,

    "ia-2.2": `Standard SGOC and NHOC watch-floor accounts require multi-factor authentication using a registered mobile authenticator or PIV-compatible badge plus PIN. Accounts observed authenticating with a single factor trigger an automatic FeatherAuth lockout pending ${priyaSharma.name}'s review.`,

    "ia-2.8": `FeatherAuth network authentication uses time-based one-time codes and certificate-bound sessions that are not vulnerable to simple replay. ${caseyTremblay.name}'s team confirmed during a 2025 NestWatch review that no replay-style authentication attempts against HonkNet had succeeded in the prior twelve months.`,

    "ia-2.12": `${DEMO_COMPONENTS.featherAuth.name} accepts PIV-compatible badges printed at ${DEMO_LOCATIONS.honkwater.name} for logical access to Operator Workstations and the Goose Operations Portal. Badge issuance is coordinated with ${dougBillings.name} so that physical and logical credentials are provisioned and revoked together.`,

    "ia-3": `Mobile Field Terminals and Operator Workstations authenticate to ${DEMO_COMPONENTS.honkNet.name} using device certificates issued and revoked by ${caseyTremblay.name}'s team before a FeatherAuth user session may be established. A terminal reporting an expired or unrecognized certificate is denied network access and flagged for reissue rather than granted a temporary exception.`,

    "ia-4": `${priyaSharma.name} manages the identifier lifecycle in ${DEMO_COMPONENTS.featherAuth.name}: issuance at onboarding, no reuse of a retired identifier for at least two years, and deactivation coordinated with the account-provisioning procedure ${DEMO_PROCEDURES.accountProvisioning}. A handful of identifiers created before FeatherAuth's deployment still use a legacy naming pattern and are scheduled for migration.`,

    "ia-4.4": `FeatherAuth tags each identifier with a status attribute — employee, escorted contractor, field responder, or veterinary staff — that downstream systems including ${DEMO_COMPONENTS.cims.name} and the Goose Deployment API use to apply appropriate access restrictions automatically. ${priyaSharma.name} audits status tags against HR and contract records twice yearly.`,

    "ia-5.1": `Password-based authenticators, used only as a secondary factor within FeatherAuth, must meet minimum length and complexity rules and are checked against a breach-corpus list at creation and reset. Shared passwords are prohibited; a shared watch-floor login discovered during a 2025 access review was disabled and replaced with individual accounts the same week.`,

    "ia-5.2": `Public-key authentication secures service-to-service calls between ${DEMO_COMPONENTS.sgopCore.name} and the Goose Deployment API, and management access to ${DEMO_COMPONENTS.rfc1149Gateway.name}. ${priyaSharma.name} maintains the certificate issuance record; expired certificates are rotated automatically with a 30-day advance alert.`,

    "ia-5.6": `Physical authenticators — PIV-compatible badges and hardware MFA tokens — are subject to custody rules requiring personnel to keep them on their person or in a locked drawer when not in use. Loss must be reported to ${priyaSharma.name} immediately regardless of duty hours; the reporting requirement is a distinct obligation from the one-hour revocation timeline it triggers.`,

    "ia-6": `Login interfaces on the Goose Operations Portal and Mission Planning Console mask password entry and return a generic authentication-failure message that does not indicate whether the entered identifier exists. This was tightened after a 2025 review found the previous Mission Planning Console error text distinguished "unknown user" from "wrong password."`,

    "ia-7": `${DEMO_COMPONENTS.featherAuth.name} and ${DEMO_COMPONENTS.rfc1149Gateway.name} use FIPS-validated cryptographic modules for authentication operations. ${priyaSharma.name} maintains the module validation-certificate inventory and reviews it annually to confirm no module has lapsed to an unvalidated version.`,

    "ia-8": `Northern Maple Systems contractors and the provincial weather-feed integration authenticate through federated, sponsored identities rather than local FeatherAuth accounts, consistent with ${DEMO_LEVERAGED_SERVICES.sharedServicesIdentity}. ${DEMO_USERS.contractors} identities expire automatically at contract end date without requiring a manual deactivation step.`,

    "ia-8.1": `${DEMO_COMPONENTS.featherAuth.name} recognizes PIV credentials issued by other federal departments for visiting liaison officials at ${DEMO_LOCATIONS.borderPost17.name}, subject to the same escort and logging requirements as other visitor access. ${dougBillings.name} verifies reciprocal-credential validity against the issuing department's published status service before granting access.`,

    "ia-8.2": `External authenticators accepted by FeatherAuth are limited to those meeting the identity-assurance level defined in ${DEMO_POLICIES.identification}, currently satisfied only by ${DEMO_LEVERAGED_SERVICES.sharedServicesIdentity}. No other external identity provider is currently integrated.`,

    "ia-8.4": `FeatherAuth's federation with ${DEMO_LEVERAGED_SERVICES.sharedServicesIdentity} conforms to the identity-assurance profile specified in ${DEMO_POLICIES.identification}. ${priyaSharma.name} confirms conformance during the annual federation review and documents any deviation as a finding rather than a silent exception.`,

    "ia-11": `FeatherAuth requires re-authentication after session idle timeout, after privilege elevation during an active Honk Protocol response, and on any role change affecting Goose Deployment API or CIMS custody permissions. ${garyMercer.name}'s Mission Planning Console session is subject to the same idle-timeout re-authentication as any other user, a point occasionally raised and consistently upheld.`,

    "ia-12": `New CGDS personnel complete in-person identity proofing at the ${DEMO_LOCATIONS.honkwater.name} security desk before a FeatherAuth identifier is created. ${priyaSharma.name} owns the proofing procedure; proofing records are retained separately from operational identifiers.`,

    "ia-12.2": `Identity proofing requires one government-issued photo identification document and confirmation of current employment or contract status against HR or contract records before ${priyaSharma.name}'s team approves identifier creation.`,

    "ia-12.3": `Identity evidence collected during proofing is validated against the presenting document's issuing authority where practicable and against internal HR or contract records in all cases. A discrepancy discovered in 2025 between a contractor's presented identification and the contract record delayed account creation until Northern Maple Systems confirmed the correct record.`,

    "ia-12.5": `${priyaSharma.name}'s team confirms a new employee's or contractor's mailing address before dispatching a physical PIV-compatible badge, and requires in-person pickup at the ${DEMO_LOCATIONS.honkwater.name} security desk rather than mailing badges to field locations such as ${DEMO_LOCATIONS.borderPost17.name}.`,
  };
}
