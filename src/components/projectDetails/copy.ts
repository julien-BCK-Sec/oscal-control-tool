import type {
  DodCloudImpactLevel,
  FipsImpactLevel,
  InterconnectionDirection,
  SystemOperationalStatus,
  SystemRoleType,
} from "@/data/project";

export const PROJECT_DETAILS_INTRO =
  "System characteristics for this documentation project. Empty fields stay empty; Control Freak does not infer them from the framework, tenant, assignments, or narratives.";

export const SSP_ORGANIZATION_HINT =
  "The organization named in the System Security Plan. This is not your Control Freak tenant and is not copied from team membership.";

export const SYSTEM_OVERVIEW_HINT =
  "Mission and purpose of the system. This is not the authorization boundary.";

export const AUTHORIZATION_BOUNDARY_HINT =
  "What is inside the system boundary, and what is outside it. Distinct from the system overview.";

export const ENVIRONMENT_HINT =
  "Where and how the system operates. Do not attach diagrams here; diagram handling is later work.";

export const SYSTEM_ROLES_HINT =
  "SSP documentation records only. These are not Control Freak user accounts, tenant roles, or control owner/reviewer assignments.";

export const CATEGORIZATION_HINT =
  "Optional user-authored FIPS 199 impact values. Selecting a framework does not set these fields, and they are not an authorization or certification result.";

export const DOD_IMPACT_HINT =
  "Optional DoD cloud impact-level assertion. Distinct from the project framework. Not a Provisional Authorization, ATO, or assessment result.";

export const OPERATIONAL_STATUS_HINT =
  "Optional operational status of the system. This is not authorization status, review status, or implementation completeness.";

export const INTERCONNECTIONS_HINT =
  "External connections and leveraged services you choose to document. An empty list means they are not documented, not that none exist.";

export const FIPS_IMPACT_LABELS: Record<FipsImpactLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

export const OPERATIONAL_STATUS_LABELS: Record<SystemOperationalStatus, string> =
  {
    "under-development": "Under development",
    operational: "Operational",
    "under-major-modification": "Under major modification",
    disposition: "Disposition",
    other: "Other",
  };

export const SYSTEM_ROLE_LABELS: Record<SystemRoleType, string> = {
  "system-owner": "System owner",
  "authorizing-official": "Authorizing official",
  "system-security-officer": "System security officer",
  other: "Other",
};

export const INTERCONNECTION_DIRECTION_LABELS: Record<
  InterconnectionDirection,
  string
> = {
  inbound: "Inbound",
  outbound: "Outbound",
  bidirectional: "Bidirectional",
};

export const DOD_CLOUD_IMPACT_LABELS: Record<DodCloudImpactLevel, string> = {
  il2: "IL2",
  il4: "IL4",
  il5: "IL5",
  il6: "IL6",
};

export function documentedAgainstCopy(frameworkLabel: string): string {
  return `Documented against ${frameworkLabel}. Framework selection is not a FIPS 199 categorization or a DoD impact-level assertion.`;
}
