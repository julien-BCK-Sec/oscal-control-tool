import { DEFAULT_PROJECT_METADATA } from "./defaults";
import {
  DOD_CLOUD_IMPACT_LEVELS,
  FIPS_IMPACT_LEVELS,
  INTERCONNECTION_DIRECTIONS,
  SYSTEM_OPERATIONAL_STATUSES,
  SYSTEM_ROLE_TYPES,
  type DodCloudImpactLevel,
  type DodCloudImpactLevelAssertion,
  type FipsImpactLevel,
  type InformationType,
  type InterconnectionDirection,
  type ProjectMetadata,
  type SecurityCategorization,
  type SystemInterconnection,
  type SystemOperationalStatus,
  type SystemRole,
  type SystemRoleType,
} from "./types";

const FIPS_IMPACT_LEVEL_SET = new Set<string>(FIPS_IMPACT_LEVELS);
const OPERATIONAL_STATUS_SET = new Set<string>(SYSTEM_OPERATIONAL_STATUSES);
const SYSTEM_ROLE_TYPE_SET = new Set<string>(SYSTEM_ROLE_TYPES);
const INTERCONNECTION_DIRECTION_SET = new Set<string>(
  INTERCONNECTION_DIRECTIONS,
);
const DOD_CLOUD_IMPACT_LEVEL_SET = new Set<string>(DOD_CLOUD_IMPACT_LEVELS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFipsImpactLevel(value: unknown): value is FipsImpactLevel {
  return typeof value === "string" && FIPS_IMPACT_LEVEL_SET.has(value);
}

function isSystemRoleType(value: unknown): value is SystemRoleType {
  return typeof value === "string" && SYSTEM_ROLE_TYPE_SET.has(value);
}

function isOperationalStatus(value: unknown): value is SystemOperationalStatus {
  return typeof value === "string" && OPERATIONAL_STATUS_SET.has(value);
}

function isInterconnectionDirection(
  value: unknown,
): value is InterconnectionDirection {
  return (
    typeof value === "string" && INTERCONNECTION_DIRECTION_SET.has(value)
  );
}

function isDodCloudImpactLevel(value: unknown): value is DodCloudImpactLevel {
  return typeof value === "string" && DOD_CLOUD_IMPACT_LEVEL_SET.has(value);
}

function optionalTrimmedString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function parseOptionalStringField(value: unknown): string | null {
  if (value === undefined) {
    return "";
  }
  if (typeof value !== "string") {
    return null;
  }
  return value;
}

function parseFipsImpactField(value: unknown): FipsImpactLevel | undefined | null {
  if (value === undefined || value === "") {
    return undefined;
  }
  if (!isFipsImpactLevel(value)) {
    return null;
  }
  return value;
}

function parseSystemRole(value: unknown): SystemRole | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.id !== "string" || value.id.trim() === "") {
    return null;
  }
  if (!isSystemRoleType(value.role)) {
    return null;
  }
  if (typeof value.name !== "string") {
    return null;
  }
  const otherRoleLabel =
    value.role === "other"
      ? optionalTrimmedString(value.otherRoleLabel)
      : undefined;

  const title = optionalTrimmedString(value.title);
  const organization = optionalTrimmedString(value.organization);
  const email = optionalTrimmedString(value.email);
  const phone = optionalTrimmedString(value.phone);

  for (const field of [value.title, value.organization, value.email, value.phone]) {
    if (field !== undefined && typeof field !== "string") {
      return null;
    }
  }

  return {
    id: value.id.trim(),
    role: value.role,
    name: value.name.trim(),
    ...(otherRoleLabel ? { otherRoleLabel } : {}),
    ...(title ? { title } : {}),
    ...(organization ? { organization } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  };
}

function parseInformationType(value: unknown): InformationType | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.id !== "string" || value.id.trim() === "") {
    return null;
  }
  if (typeof value.title !== "string") {
    return null;
  }
  if (value.description !== undefined && typeof value.description !== "string") {
    return null;
  }
  const confidentialityImpact = parseFipsImpactField(value.confidentialityImpact);
  const integrityImpact = parseFipsImpactField(value.integrityImpact);
  const availabilityImpact = parseFipsImpactField(value.availabilityImpact);
  if (
    confidentialityImpact === null ||
    integrityImpact === null ||
    availabilityImpact === null
  ) {
    return null;
  }
  const description = optionalTrimmedString(value.description);
  return {
    id: value.id.trim(),
    title: value.title,
    ...(description ? { description } : {}),
    ...(confidentialityImpact ? { confidentialityImpact } : {}),
    ...(integrityImpact ? { integrityImpact } : {}),
    ...(availabilityImpact ? { availabilityImpact } : {}),
  };
}

function parseInterconnection(value: unknown): SystemInterconnection | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.id !== "string" || value.id.trim() === "") {
    return null;
  }
  if (typeof value.name !== "string") {
    return null;
  }
  for (const field of [
    value.description,
    value.organization,
    value.informationExchanged,
    value.securityNotes,
  ]) {
    if (field !== undefined && typeof field !== "string") {
      return null;
    }
  }
  let direction: InterconnectionDirection | undefined;
  if (value.direction !== undefined && value.direction !== "") {
    if (!isInterconnectionDirection(value.direction)) {
      return null;
    }
    direction = value.direction;
  }
  const description = optionalTrimmedString(value.description);
  const organization = optionalTrimmedString(value.organization);
  const informationExchanged = optionalTrimmedString(value.informationExchanged);
  const securityNotes = optionalTrimmedString(value.securityNotes);
  return {
    id: value.id.trim(),
    name: value.name.trim(),
    ...(description ? { description } : {}),
    ...(organization ? { organization } : {}),
    ...(informationExchanged ? { informationExchanged } : {}),
    ...(direction ? { direction } : {}),
    ...(securityNotes ? { securityNotes } : {}),
  };
}

function parseTypedList<T>(
  value: unknown,
  parseItem: (item: unknown) => T | null,
): T[] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    return null;
  }
  const items: T[] = [];
  const ids = new Set<string>();
  for (const entry of value) {
    const parsed = parseItem(entry);
    if (parsed === null) {
      return null;
    }
    const id = (parsed as { id: string }).id;
    if (ids.has(id)) {
      return null;
    }
    ids.add(id);
    items.push(parsed);
  }
  return items;
}

function parseSecurityCategorization(
  value: unknown,
): SecurityCategorization | null | false {
  if (value === undefined || value === null) {
    return null;
  }
  if (!isRecord(value)) {
    return false;
  }
  const confidentiality = parseFipsImpactField(value.confidentiality);
  const integrity = parseFipsImpactField(value.integrity);
  const availability = parseFipsImpactField(value.availability);
  if (
    confidentiality === null ||
    integrity === null ||
    availability === null
  ) {
    return false;
  }
  if (value.rationale !== undefined && typeof value.rationale !== "string") {
    return false;
  }
  const rationale = optionalTrimmedString(value.rationale);
  if (!confidentiality && !integrity && !availability && !rationale) {
    return null;
  }
  return {
    ...(confidentiality ? { confidentiality } : {}),
    ...(integrity ? { integrity } : {}),
    ...(availability ? { availability } : {}),
    ...(rationale ? { rationale } : {}),
  };
}

function parseDodCloudImpactLevel(
  value: unknown,
): DodCloudImpactLevelAssertion | null | false {
  if (value === undefined || value === null) {
    return null;
  }
  if (!isRecord(value)) {
    return false;
  }
  if (!isDodCloudImpactLevel(value.level)) {
    return false;
  }
  if (value.notes !== undefined && typeof value.notes !== "string") {
    return false;
  }
  const notes = optionalTrimmedString(value.notes);
  return {
    level: value.level,
    ...(notes ? { notes } : {}),
  };
}

/**
 * Parse v1 (three core strings) or v2 metadata into the canonical v2 shape.
 * Unknown extra keys are ignored. Invalid enums and shapes fail closed.
 */
export function parseProjectMetadata(value: unknown): ProjectMetadata | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.systemName !== "string" ||
    typeof value.organizationName !== "string" ||
    typeof value.systemDescription !== "string"
  ) {
    return null;
  }

  const systemNameShort = parseOptionalStringField(value.systemNameShort);
  const systemIdentifier = parseOptionalStringField(value.systemIdentifier);
  const authorizationBoundary = parseOptionalStringField(
    value.authorizationBoundary,
  );
  const environmentOfOperation = parseOptionalStringField(
    value.environmentOfOperation,
  );
  const operationalStatusRemarks = parseOptionalStringField(
    value.operationalStatusRemarks,
  );
  if (
    systemNameShort === null ||
    systemIdentifier === null ||
    authorizationBoundary === null ||
    environmentOfOperation === null ||
    operationalStatusRemarks === null
  ) {
    return null;
  }

  let operationalStatus: SystemOperationalStatus | "" = "";
  if (value.operationalStatus !== undefined && value.operationalStatus !== "") {
    if (!isOperationalStatus(value.operationalStatus)) {
      return null;
    }
    operationalStatus = value.operationalStatus;
  }

  const securityCategorization = parseSecurityCategorization(
    value.securityCategorization,
  );
  if (securityCategorization === false) {
    return null;
  }

  const dodCloudImpactLevel = parseDodCloudImpactLevel(
    value.dodCloudImpactLevel,
  );
  if (dodCloudImpactLevel === false) {
    return null;
  }

  const systemRoles = parseTypedList(value.systemRoles, parseSystemRole);
  const informationTypes = parseTypedList(
    value.informationTypes,
    parseInformationType,
  );
  const interconnections = parseTypedList(
    value.interconnections,
    parseInterconnection,
  );
  if (
    systemRoles === null ||
    informationTypes === null ||
    interconnections === null
  ) {
    return null;
  }

  return {
    systemName: value.systemName,
    organizationName: value.organizationName,
    systemDescription: value.systemDescription,
    systemNameShort,
    systemIdentifier,
    authorizationBoundary,
    environmentOfOperation,
    operationalStatus,
    operationalStatusRemarks,
    securityCategorization,
    dodCloudImpactLevel,
    systemRoles,
    informationTypes,
    interconnections,
  };
}

export function isProjectMetadata(value: unknown): value is ProjectMetadata {
  return parseProjectMetadata(value) !== null;
}

/** Return a validated v2 copy, or defaults when the value is not usable. */
export function normalizeProjectMetadata(value: unknown): ProjectMetadata {
  return parseProjectMetadata(value) ?? { ...DEFAULT_PROJECT_METADATA };
}

export function createProjectMetadata(
  input: Partial<ProjectMetadata> = {},
): ProjectMetadata {
  return normalizeProjectMetadata({
    ...DEFAULT_PROJECT_METADATA,
    ...input,
  });
}
