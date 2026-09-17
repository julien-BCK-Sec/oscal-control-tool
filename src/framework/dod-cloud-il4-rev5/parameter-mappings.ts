import type {
  FrameworkAuthoritativeValueStatus,
  FrameworkOrganizationDefinedParameter,
} from "@/data/framework/types";
import {
  ADDENDUM_WORKBOOK_SHA256,
  CSP_SRG_V1R7_PDF_SHA256,
  FEDRAMP_BASELINE_SHA256,
  IL4_PARAMETER_MAPPINGS_VENDOR_FILE,
  NIST_CATALOG_SHA256,
} from "./sources";

export { IL4_PARAMETER_MAPPINGS_VENDOR_FILE };

const AUTHORITATIVE_STATUSES = new Set<FrameworkAuthoritativeValueStatus>([
  "not-indicated",
  "csp-organization-defined",
  "baseline-inherited",
  "may-use-baseline",
  "overlay-explicit",
  "satisfied-by-overlay",
  "authoritative-value-required",
  "source-conflict",
]);

export type Il4PinnedParameterMapping = {
  controlId: string;
  parameterId: string;
  status: FrameworkAuthoritativeValueStatus;
  values: readonly string[];
  evidence: string;
};

export type Il4ParameterMappingIndex = Map<
  string,
  Map<string, Il4PinnedParameterMapping>
>;

export class InvalidIl4ParameterMappingsError extends Error {
  constructor(message: string) {
    super(`Invalid IL4 parameter mappings: ${message}`);
    this.name = "InvalidIl4ParameterMappingsError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new InvalidIl4ParameterMappingsError(`${label} must be a nonempty string`);
  }
  return value.trim();
}

function requireHash(value: unknown, label: string, expected: string): string {
  const hash = requireString(value, label).toLowerCase();
  if (hash !== expected.toLowerCase()) {
    throw new InvalidIl4ParameterMappingsError(
      `${label} does not match the pinned artifact hash`,
    );
  }
  return hash;
}

export type Il4ParameterMappingCatalog = {
  allowedControlIds: ReadonlySet<string>;
  paramsByControl: ReadonlyMap<
    string,
    readonly FrameworkOrganizationDefinedParameter[]
  >;
};

/**
 * Parse the explicit IL4 per-ODP pin file. Empty mappings are valid.
 * Fail closed on unknown IDs, duplicates, hash drift, or invalid status.
 */
export function parseIl4ParameterMappings(
  raw: unknown,
  catalog: Il4ParameterMappingCatalog,
): Il4ParameterMappingIndex {
  if (!isRecord(raw)) {
    throw new InvalidIl4ParameterMappingsError("root must be an object");
  }
  if (!isRecord(raw.source)) {
    throw new InvalidIl4ParameterMappingsError("source must be an object");
  }
  requireString(raw.source.description, "source.description");
  requireHash(
    raw.source.addendumWorkbookSha256,
    "source.addendumWorkbookSha256",
    ADDENDUM_WORKBOOK_SHA256,
  );
  requireHash(
    raw.source.tableD1PdfSha256,
    "source.tableD1PdfSha256",
    CSP_SRG_V1R7_PDF_SHA256,
  );
  requireHash(
    raw.source.fedrampBaselineSha256,
    "source.fedrampBaselineSha256",
    FEDRAMP_BASELINE_SHA256,
  );
  requireHash(
    raw.source.nistCatalogSha256,
    "source.nistCatalogSha256",
    NIST_CATALOG_SHA256,
  );
  if (!Array.isArray(raw.mappings)) {
    throw new InvalidIl4ParameterMappingsError("mappings must be an array");
  }

  const index: Il4ParameterMappingIndex = new Map();
  for (const [entryIndex, entry] of raw.mappings.entries()) {
    const label = `mappings[${entryIndex}]`;
    if (!isRecord(entry)) {
      throw new InvalidIl4ParameterMappingsError(`${label} must be an object`);
    }
    const controlId = requireString(entry.controlId, `${label}.controlId`);
    const parameterId = requireString(entry.parameterId, `${label}.parameterId`);
    const statusRaw = requireString(entry.status, `${label}.status`);
    if (!AUTHORITATIVE_STATUSES.has(statusRaw as FrameworkAuthoritativeValueStatus)) {
      throw new InvalidIl4ParameterMappingsError(
        `${label}.status is not a known authoritative status`,
      );
    }
    if (!Array.isArray(entry.values) || entry.values.some((value) => typeof value !== "string")) {
      throw new InvalidIl4ParameterMappingsError(
        `${label}.values must be an array of strings`,
      );
    }
    const evidence = requireString(entry.evidence, `${label}.evidence`);
    if (!catalog.allowedControlIds.has(controlId)) {
      throw new InvalidIl4ParameterMappingsError(
        `${label} control ${controlId} is not in the IL4 population`,
      );
    }
    const params = catalog.paramsByControl.get(controlId) ?? [];
    if (!params.some((param) => param.id === parameterId)) {
      throw new InvalidIl4ParameterMappingsError(
        `${label} parameter ${parameterId} is not a catalog parameter of ${controlId}`,
      );
    }
    const byParam = index.get(controlId) ?? new Map();
    if (byParam.has(parameterId)) {
      throw new InvalidIl4ParameterMappingsError(
        `duplicate mapping for ${controlId} ${parameterId}`,
      );
    }
    byParam.set(parameterId, {
      controlId,
      parameterId,
      status: statusRaw as FrameworkAuthoritativeValueStatus,
      values: entry.values.map((value) => value.trim()).filter(Boolean),
      evidence,
    });
    index.set(controlId, byParam);
  }
  return index;
}

export function mappingCount(index: Il4ParameterMappingIndex): number {
  let count = 0;
  for (const byParam of index.values()) {
    count += byParam.size;
  }
  return count;
}
