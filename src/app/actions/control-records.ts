"use server";

import { headers } from "next/headers";
import {
  isControlReviewStatus,
  parseUpsertControlRecordInput,
  type ControlRecord,
  type ControlReviewStatus,
  type UpsertControlRecordInput,
} from "@/data/control-record";
import type { ControlActivity } from "@/data/control-activity";
import {
  isControlReviewAction,
  type ControlReviewAction,
} from "@/data/control-review";
import { resolveActor } from "@/persistence/actor";
import {
  getControlActivityRepository,
  getControlRecordRepository,
  getControlRecordService,
} from "@/persistence/server";
import type { TransitionReviewStatusResult } from "@/persistence/control-record-service";

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

export type UpsertControlRecordsResult =
  | { ok: true; records: ControlRecord[] }
  | { ok: false; reason: "validation" | "not-found"; message: string };

export type TransitionReviewStatusActionResult = TransitionReviewStatusResult;

/**
 * List persisted ControlRecords for a project.
 * Missing controls are not invented here — callers apply defaults.
 */
export async function listControlRecordsAction(
  projectId: string,
): Promise<ControlRecord[]> {
  const id = requireNonEmptyString(projectId, "projectId");
  return (await getControlRecordRepository()).listByProject(id);
}

/**
 * Lazy-create or update ControlRecords and append ControlActivity rows.
 * Does not modify project_json / OSCAL. Does not change reviewStatus.
 */
export async function upsertControlRecordsAction(input: {
  projectId: string;
  records: unknown;
}): Promise<UpsertControlRecordsResult> {
  let projectId: string;
  try {
    projectId = requireNonEmptyString(input.projectId, "projectId");
  } catch (error) {
    return {
      ok: false,
      reason: "validation",
      message: error instanceof Error ? error.message : "Invalid projectId.",
    };
  }

  if (!Array.isArray(input.records)) {
    return {
      ok: false,
      reason: "validation",
      message: "records must be an array.",
    };
  }

  const parsed: UpsertControlRecordInput[] = [];
  for (const entry of input.records) {
    const record = parseUpsertControlRecordInput(entry);
    if (!record) {
      return {
        ok: false,
        reason: "validation",
        message: "Invalid control record entry.",
      };
    }
    parsed.push(record);
  }

  try {
    const headerList = await headers();
    const actor = resolveActor(headerList);
    const results = await (await getControlRecordService()).upsertManyWithActivity(
      projectId,
      parsed,
      actor,
    );
    return { ok: true, records: results.map((result) => result.record) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save control records.";
    if (message === "Project not found.") {
      return { ok: false, reason: "not-found", message };
    }
    return { ok: false, reason: "validation", message };
  }
}

/**
 * Apply a legal review workflow transition. Rejects arbitrary status writes and
 * stale expectedCurrentStatus conflicts.
 */
export async function transitionReviewStatusAction(input: {
  projectId: string;
  controlId: string;
  action: unknown;
  expectedCurrentStatus: unknown;
}): Promise<TransitionReviewStatusActionResult> {
  let projectId: string;
  let controlId: string;
  try {
    projectId = requireNonEmptyString(input.projectId, "projectId");
    controlId = requireNonEmptyString(input.controlId, "controlId");
  } catch (error) {
    return {
      ok: false,
      reason: "not-found",
      message: error instanceof Error ? error.message : "Invalid identifiers.",
    };
  }

  if (!isControlReviewAction(input.action)) {
    return {
      ok: false,
      reason: "invalid-transition",
      message: "Invalid review action.",
      currentReviewStatus: isControlReviewStatus(input.expectedCurrentStatus)
        ? input.expectedCurrentStatus
        : "not_reviewed",
    };
  }

  if (!isControlReviewStatus(input.expectedCurrentStatus)) {
    return {
      ok: false,
      reason: "invalid-transition",
      message: "Invalid expectedCurrentStatus.",
      currentReviewStatus: "not_reviewed",
    };
  }

  const action = input.action as ControlReviewAction;
  const expectedCurrentStatus =
    input.expectedCurrentStatus as ControlReviewStatus;

  const headerList = await headers();
  const actor = resolveActor(headerList);
  return (await getControlRecordService()).transitionReviewStatus(
    {
      projectId,
      controlId,
      action,
      expectedCurrentStatus,
    },
    actor,
  );
}

/**
 * Activity stream for one control in a project (newest first).
 * Returns [] when no ControlRecord exists yet.
 */
export async function listControlActivitiesAction(
  projectId: string,
  controlId: string,
): Promise<ControlActivity[]> {
  const pid = requireNonEmptyString(projectId, "projectId");
  const cid = requireNonEmptyString(controlId, "controlId");
  const record = await (await getControlRecordRepository()).getByProjectAndControl(
    pid,
    cid,
  );
  if (!record) {
    return [];
  }
  return (await getControlActivityRepository()).listByControlRecordId(record.id);
}
