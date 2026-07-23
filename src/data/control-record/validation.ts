import {
  CONTROL_IMPLEMENTATION_STATUSES,
  CONTROL_REVIEW_STATUSES,
  isEvidenceRequirement,
} from "./defaults";
import type {
  ControlRecordFields,
  ControlImplementationStatus,
  ControlReviewStatus,
  UpsertControlRecordInput,
} from "./types";

export function isControlImplementationStatus(
  value: unknown,
): value is ControlImplementationStatus {
  return (
    typeof value === "string" &&
    (CONTROL_IMPLEMENTATION_STATUSES as readonly string[]).includes(value)
  );
}

export function isControlReviewStatus(
  value: unknown,
): value is ControlReviewStatus {
  return (
    typeof value === "string" &&
    (CONTROL_REVIEW_STATUSES as readonly string[]).includes(value)
  );
}

/** Accepts `YYYY-MM-DD` or null/empty → null. Rejects other shapes. */
export function parseControlRecordReviewDueDate(
  value: unknown,
): string | null | undefined {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return undefined;
  }
  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return trimmed;
}

export function isControlRecordFields(
  value: unknown,
): value is ControlRecordFields {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.owner !== "string") {
    return false;
  }
  if (typeof record.coOwner !== "string") {
    return false;
  }
  if (typeof record.businessUnit !== "string") {
    return false;
  }
  if (!isControlImplementationStatus(record.implementationStatus)) {
    return false;
  }
  const due = parseControlRecordReviewDueDate(record.reviewDueDate);
  if (due === undefined) {
    return false;
  }
  if (!isEvidenceRequirement(record.evidenceRequirement)) {
    return false;
  }
  return true;
}

export function normalizeControlRecordFields(
  value: ControlRecordFields,
): ControlRecordFields {
  return {
    owner: value.owner,
    coOwner: value.coOwner,
    businessUnit: value.businessUnit,
    implementationStatus: value.implementationStatus,
    reviewDueDate: parseControlRecordReviewDueDate(value.reviewDueDate) ?? null,
    evidenceRequirement: value.evidenceRequirement,
  };
}

export function parseUpsertControlRecordInput(
  value: unknown,
): UpsertControlRecordInput | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.controlId !== "string" || record.controlId.trim() === "") {
    return null;
  }
  const controlId = record.controlId.trim();
  if (!isControlRecordFields(record)) {
    return null;
  }
  return {
    controlId,
    ...normalizeControlRecordFields(record),
  };
}
