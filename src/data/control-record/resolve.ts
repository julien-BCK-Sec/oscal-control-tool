import {
  DEFAULT_CONTROL_RECORD_FIELDS,
  displayControlOwner,
  isControlOwnerUnassigned,
} from "./defaults";
import type { ControlRecord, ControlRecordFields } from "./types";

/**
 * Resolve fields for a control: persisted draft if present, otherwise defaults.
 * Does not invent a database row.
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
  };
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
    };
  }
  return map;
}

export {
  displayControlOwner,
  isControlOwnerUnassigned,
};
