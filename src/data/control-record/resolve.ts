import {
  DEFAULT_CONTROL_RECORD_FIELDS,
  DEFAULT_CONTROL_REVIEW_STATUS,
  displayControlOwner,
  isControlOwnerUnassigned,
} from "./defaults";
import type {
  ControlRecord,
  ControlRecordFields,
  ControlReviewStatus,
} from "./types";

/**
 * Resolve fields for a control: persisted draft if present, otherwise defaults.
 * Does not invent a database row. Does not include reviewStatus.
 */
export function resolveControlRecordFields(
  records: Readonly<Record<string, ControlRecordFields>>,
  controlId: string,
): ControlRecordFields {
  const existing = records[controlId];
  if (!existing) {
    return { ...DEFAULT_CONTROL_RECORD_FIELDS };
  }
  return {
    owner: existing.owner,
    coOwner: existing.coOwner,
    businessUnit: existing.businessUnit,
    implementationStatus: existing.implementationStatus,
    reviewDueDate: existing.reviewDueDate,
    evidenceRequirement: existing.evidenceRequirement,
  };
}

/**
 * Resolve review workflow status: persisted value if present, otherwise
 * not_reviewed. Does not invent a database row or derive from implementationStatus.
 */
export function resolveControlReviewStatus(
  statuses: Readonly<Record<string, ControlReviewStatus>>,
  controlId: string,
): ControlReviewStatus {
  return statuses[controlId] ?? DEFAULT_CONTROL_REVIEW_STATUS;
}

export function controlRecordsEqual(
  a: Readonly<Record<string, ControlRecordFields>>,
  b: Readonly<Record<string, ControlRecordFields>>,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function cloneControlRecords(
  records: Readonly<Record<string, ControlRecordFields>>,
): Record<string, ControlRecordFields> {
  return Object.fromEntries(
    Object.entries(records).map(([controlId, fields]) => [
      controlId,
      {
        owner: fields.owner,
        coOwner: fields.coOwner,
        businessUnit: fields.businessUnit,
        implementationStatus: fields.implementationStatus,
        reviewDueDate: fields.reviewDueDate,
        evidenceRequirement: fields.evidenceRequirement,
      },
    ]),
  );
}

/** Map persisted rows to editor field drafts keyed by control id. */
export function controlRecordsToFieldMap(
  records: readonly ControlRecord[],
): Record<string, ControlRecordFields> {
  const map: Record<string, ControlRecordFields> = {};
  for (const record of records) {
    map[record.controlId] = {
      owner: record.owner,
      coOwner: record.coOwner,
      businessUnit: record.businessUnit,
      implementationStatus: record.implementationStatus,
      reviewDueDate: record.reviewDueDate,
      evidenceRequirement: record.evidenceRequirement,
    };
  }
  return map;
}

/** Map persisted rows to review statuses keyed by control id. */
export function controlRecordsToReviewStatusMap(
  records: readonly ControlRecord[],
): Record<string, ControlReviewStatus> {
  const map: Record<string, ControlReviewStatus> = {};
  for (const record of records) {
    map[record.controlId] = record.reviewStatus;
  }
  return map;
}

export {
  displayControlOwner,
  isControlOwnerUnassigned,
};
