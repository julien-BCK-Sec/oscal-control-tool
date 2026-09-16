/**
 * User-entered project / system metadata.
 * Stored separately from framework controls and control implementations.
 *
 * Schema v2 adds canonical SSP system characteristics. Missing values stay
 * empty/null and must never be inferred from framework, tenant, workflow,
 * narratives, or Evidence.
 */

export const FIPS_IMPACT_LEVELS = ["low", "moderate", "high"] as const;
export type FipsImpactLevel = (typeof FIPS_IMPACT_LEVELS)[number];

export const SYSTEM_OPERATIONAL_STATUSES = [
  "under-development",
  "operational",
  "under-major-modification",
  "disposition",
  "other",
] as const;
export type SystemOperationalStatus =
  (typeof SYSTEM_OPERATIONAL_STATUSES)[number];

export const SYSTEM_ROLE_TYPES = [
  "system-owner",
  "authorizing-official",
  "system-security-officer",
  "other",
] as const;
export type SystemRoleType = (typeof SYSTEM_ROLE_TYPES)[number];

export const INTERCONNECTION_DIRECTIONS = [
  "inbound",
  "outbound",
  "bidirectional",
] as const;
export type InterconnectionDirection =
  (typeof INTERCONNECTION_DIRECTIONS)[number];

export const DOD_CLOUD_IMPACT_LEVELS = ["il2", "il4", "il5", "il6"] as const;
export type DodCloudImpactLevel = (typeof DOD_CLOUD_IMPACT_LEVELS)[number];

export type SystemRole = {
  id: string;
  role: SystemRoleType;
  /** Required when role is `other`. */
  otherRoleLabel?: string;
  name: string;
  title?: string;
  organization?: string;
  email?: string;
  phone?: string;
};

export type InformationType = {
  id: string;
  title: string;
  description?: string;
  confidentialityImpact?: FipsImpactLevel;
  integrityImpact?: FipsImpactLevel;
  availabilityImpact?: FipsImpactLevel;
};

export type SystemInterconnection = {
  id: string;
  name: string;
  description?: string;
  organization?: string;
  informationExchanged?: string;
  direction?: InterconnectionDirection;
  securityNotes?: string;
};

/**
 * User-asserted FIPS 199 CIA values. Overall impact is not stored; a future
 * document generator may derive the high-water mark when all three exist.
 */
export type SecurityCategorization = {
  confidentiality?: FipsImpactLevel;
  integrity?: FipsImpactLevel;
  availability?: FipsImpactLevel;
  rationale?: string;
};

/**
 * User-asserted DoD cloud impact level. Distinct from `frameworkId` and not
 * an authorization, Provisional Authorization, or ATO.
 */
export type DodCloudImpactLevelAssertion = {
  level: DodCloudImpactLevel;
  notes?: string;
};

export type ProjectMetadata = {
  systemName: string;
  organizationName: string;
  /** System overview, including mission/purpose. Not the authorization boundary. */
  systemDescription: string;
  systemNameShort: string;
  systemIdentifier: string;
  authorizationBoundary: string;
  environmentOfOperation: string;
  operationalStatus: SystemOperationalStatus | "";
  operationalStatusRemarks: string;
  securityCategorization: SecurityCategorization | null;
  dodCloudImpactLevel: DodCloudImpactLevelAssertion | null;
  systemRoles: SystemRole[];
  informationTypes: InformationType[];
  interconnections: SystemInterconnection[];
};

/** v1-shaped or partial input; persist and domain code normalize to ProjectMetadata. */
export type ProjectMetadataInput = Pick<
  ProjectMetadata,
  "systemName" | "organizationName" | "systemDescription"
> &
  Partial<ProjectMetadata>;
