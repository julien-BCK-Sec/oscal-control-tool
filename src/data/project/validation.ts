import { DEFAULT_PROJECT_METADATA } from "./defaults";
import type { ProjectMetadata } from "./types";

export function isProjectMetadata(value: unknown): value is ProjectMetadata {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.systemName === "string" &&
    typeof record.organizationName === "string" &&
    typeof record.systemDescription === "string"
  );
}

/** Return a validated copy, or defaults when the value is not usable. */
export function normalizeProjectMetadata(value: unknown): ProjectMetadata {
  if (!isProjectMetadata(value)) {
    return { ...DEFAULT_PROJECT_METADATA };
  }

  return {
    systemName: value.systemName,
    organizationName: value.organizationName,
    systemDescription: value.systemDescription,
  };
}
