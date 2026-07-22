import "server-only";

import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  detectControlRecordFieldChanges,
  type AppendControlActivityInput,
} from "@/data/control-activity";
import {
  DEFAULT_CONTROL_RECORD_FIELDS,
  DEFAULT_CONTROL_REVIEW_STATUS,
  isControlImplementationStatus,
  isControlReviewStatus,
  normalizeControlRecordFields,
  type ControlRecord,
  type ControlImplementationStatus,
  type ControlReviewStatus,
  type UpsertControlRecordInput,
} from "@/data/control-record";
import { resolveReviewTransition } from "@/data/control-review";
import { nextActivityTimestamp } from "../activity-clock";
import type { ActorIdentity } from "../actor";
import type {
  ControlRecordService,
  ControlReviewStatusCounts,
  TransitionReviewStatusInput,
  TransitionReviewStatusResult,
  UpsertControlRecordWithActivityResult,
} from "../control-record-service";
import type { AppDatabase } from "./client";
import { appendActivitiesInTransaction } from "./control-activity-repository";
import { controlRecords, projects } from "./schema";

function nowIso(): string {
  return nextActivityTimestamp();
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function toControlRecord(
  row: typeof controlRecords.$inferSelect,
): ControlRecord {
  const implementationStatus: ControlImplementationStatus =
    isControlImplementationStatus(row.implementationStatus)
      ? row.implementationStatus
      : "draft";
  const reviewStatus: ControlReviewStatus = isControlReviewStatus(
    row.reviewStatus,
  )
    ? row.reviewStatus
    : DEFAULT_CONTROL_REVIEW_STATUS;
  return {
    id: row.id,
    projectId: row.projectId,
    controlId: row.controlId,
    owner: row.owner,
    coOwner: row.coOwner,
    businessUnit: row.businessUnit,
    implementationStatus,
    reviewStatus,
    reviewDueDate: row.reviewDueDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type DbExecutor = Pick<AppDatabase, "select" | "insert" | "update" | "transaction">;

async function projectExists(
  executor: DbExecutor,
  projectId: string,
): Promise<boolean> {
  const rows = await executor
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return rows.length > 0;
}

function emptyReviewCounts(): ControlReviewStatusCounts {
  return {
    not_reviewed: 0,
    ready_for_review: 0,
    under_review: 0,
    changes_requested: 0,
    approved: 0,
  };
}

/**
 * Create behavior: emit only `control_record_created` (no per-field events for
 * initial values — avoids noisy duplicates on first lazy create).
 * Update behavior: emit field events only for values that actually changed.
 * No-op autosave: no row update and no activity rows.
 * Metadata upsert never changes reviewStatus.
 */
async function upsertOneInTransaction(
  tx: DbExecutor,
  projectId: string,
  input: UpsertControlRecordInput,
  actor: ActorIdentity,
): Promise<UpsertControlRecordWithActivityResult> {
  const controlId = input.controlId.trim();
  if (!controlId) {
    throw new Error("controlId is required.");
  }

  const fields = normalizeControlRecordFields(input);
  const existing = await tx
    .select()
    .from(controlRecords)
    .where(
      and(
        eq(controlRecords.projectId, projectId),
        eq(controlRecords.controlId, controlId),
      ),
    )
    .limit(1);

  if (!existing[0]) {
    const id = randomUUID();
    const createdAt = nowIso();
    await tx.insert(controlRecords).values({
      id,
      projectId,
      controlId,
      owner: fields.owner,
      coOwner: fields.coOwner,
      businessUnit: fields.businessUnit,
      implementationStatus: fields.implementationStatus,
      reviewStatus: DEFAULT_CONTROL_REVIEW_STATUS,
      reviewDueDate: fields.reviewDueDate,
      createdAt,
      updatedAt: createdAt,
    });

    await appendActivitiesInTransaction(tx, [
      {
        controlRecordId: id,
        activityType: "control_record_created",
        actorId: actor.actorId,
        actorDisplayName: actor.actorDisplayName,
        createdAt,
      },
    ]);

    return {
      record: {
        id,
        projectId,
        controlId,
        owner: fields.owner,
        coOwner: fields.coOwner,
        businessUnit: fields.businessUnit,
        implementationStatus: fields.implementationStatus,
        reviewStatus: DEFAULT_CONTROL_REVIEW_STATUS,
        reviewDueDate: fields.reviewDueDate,
        createdAt,
        updatedAt: createdAt,
      },
      changed: true,
      activityCount: 1,
    };
  }

  const row = existing[0];
  const previous = toControlRecord(row);
  const changes = detectControlRecordFieldChanges(previous, fields);
  if (changes.length === 0) {
    return {
      record: previous,
      changed: false,
      activityCount: 0,
    };
  }

  const updatedAt = nowIso();
  await tx
    .update(controlRecords)
    .set({
      owner: fields.owner,
      coOwner: fields.coOwner,
      businessUnit: fields.businessUnit,
      implementationStatus: fields.implementationStatus,
      reviewDueDate: fields.reviewDueDate,
      updatedAt,
    })
    .where(eq(controlRecords.id, row.id));

  const activityInputs: AppendControlActivityInput[] = changes.map(
    (change, index) => ({
      controlRecordId: row.id,
      activityType: change.activityType,
      actorId: actor.actorId,
      actorDisplayName: actor.actorDisplayName,
      fieldName: change.fieldName,
      previousValue: change.previousValue,
      newValue: change.newValue,
      // Stable newest-first ordering within the same save batch.
      createdAt: new Date(Date.parse(updatedAt) + index).toISOString(),
    }),
  );
  await appendActivitiesInTransaction(tx, activityInputs);

  return {
    record: {
      ...previous,
      owner: fields.owner,
      coOwner: fields.coOwner,
      businessUnit: fields.businessUnit,
      implementationStatus: fields.implementationStatus,
      reviewDueDate: fields.reviewDueDate,
      updatedAt,
    },
    changed: true,
    activityCount: activityInputs.length,
  };
}

async function transitionReviewInTransaction(
  tx: DbExecutor,
  input: TransitionReviewStatusInput,
  actor: ActorIdentity,
): Promise<TransitionReviewStatusResult> {
  const controlId = input.controlId.trim();
  if (!controlId) {
    return {
      ok: false,
      reason: "not-found",
      message: "controlId is required.",
    };
  }

  const existing = await tx
    .select()
    .from(controlRecords)
    .where(
      and(
        eq(controlRecords.projectId, input.projectId),
        eq(controlRecords.controlId, controlId),
      ),
    )
    .limit(1);

  if (!existing[0]) {
    // Missing ControlRecord: create with defaults, then apply transition.
    // Virtual current status is not_reviewed (no persisted row yet).
    const currentStatus = DEFAULT_CONTROL_REVIEW_STATUS;
    if (input.expectedCurrentStatus !== currentStatus) {
      return {
        ok: false,
        reason: "conflict",
        message: "Review status changed elsewhere. Refresh and try again.",
        currentReviewStatus: currentStatus,
      };
    }

    const transition = resolveReviewTransition(currentStatus, input.action);
    if (!transition) {
      return {
        ok: false,
        reason: "invalid-transition",
        message: `Action "${input.action}" is not allowed from status "${currentStatus}".`,
        currentReviewStatus: currentStatus,
      };
    }

    const recordId = randomUUID();
    const createdAt = nowIso();
    const fields = DEFAULT_CONTROL_RECORD_FIELDS;
    const updatedAt = new Date(Date.parse(createdAt) + 1).toISOString();

    await tx.insert(controlRecords).values({
      id: recordId,
      projectId: input.projectId,
      controlId,
      owner: fields.owner,
      coOwner: fields.coOwner,
      businessUnit: fields.businessUnit,
      implementationStatus: fields.implementationStatus,
      reviewStatus: transition.to,
      reviewDueDate: fields.reviewDueDate,
      createdAt,
      updatedAt,
    });

    const activities = await appendActivitiesInTransaction(tx, [
      {
        controlRecordId: recordId,
        activityType: "control_record_created",
        actorId: actor.actorId,
        actorDisplayName: actor.actorDisplayName,
        createdAt,
      },
      {
        controlRecordId: recordId,
        activityType: transition.activityType,
        actorId: actor.actorId,
        actorDisplayName: actor.actorDisplayName,
        fieldName: "reviewStatus",
        previousValue: transition.from,
        newValue: transition.to,
        createdAt: updatedAt,
      },
    ]);

    const transitionActivity = activities[1];
    if (!transitionActivity) {
      throw new Error("Failed to append review transition activity.");
    }

    return {
      ok: true,
      created: true,
      record: {
        id: recordId,
        projectId: input.projectId,
        controlId,
        ...fields,
        reviewStatus: transition.to,
        createdAt,
        updatedAt,
      },
      activity: transitionActivity,
    };
  }

  const row = existing[0];
  const previousRecord = toControlRecord(row);
  const currentStatus = previousRecord.reviewStatus;
  const recordId = row.id;

  if (input.expectedCurrentStatus !== currentStatus) {
    return {
      ok: false,
      reason: "conflict",
      message: "Review status changed elsewhere. Refresh and try again.",
      currentReviewStatus: currentStatus,
    };
  }

  const transition = resolveReviewTransition(currentStatus, input.action);
  if (!transition) {
    return {
      ok: false,
      reason: "invalid-transition",
      message: `Action "${input.action}" is not allowed from status "${currentStatus}".`,
      currentReviewStatus: currentStatus,
    };
  }

  const updatedAt = nowIso();
  await tx
    .update(controlRecords)
    .set({
      reviewStatus: transition.to,
      updatedAt,
    })
    .where(eq(controlRecords.id, recordId));

  const activities = await appendActivitiesInTransaction(tx, [
    {
      controlRecordId: recordId,
      activityType: transition.activityType,
      actorId: actor.actorId,
      actorDisplayName: actor.actorDisplayName,
      fieldName: "reviewStatus",
      previousValue: transition.from,
      newValue: transition.to,
      createdAt: updatedAt,
    },
  ]);

  const transitionActivity = activities[0];
  if (!transitionActivity) {
    throw new Error("Failed to append review transition activity.");
  }

  return {
    ok: true,
    created: false,
    record: {
      ...previousRecord,
      reviewStatus: transition.to,
      updatedAt,
    },
    activity: transitionActivity,
  };
}

/**
 * Coordinates ControlRecord writes with ControlActivity appends.
 */
export function createPostgresControlRecordService(
  db: AppDatabase,
): ControlRecordService {
  return {
    async listByProject(projectId: string): Promise<ControlRecord[]> {
      const rows = await db
        .select()
        .from(controlRecords)
        .where(eq(controlRecords.projectId, projectId));
      return rows.map(toControlRecord);
    },

    async upsertWithActivity(
      projectId: string,
      input: UpsertControlRecordInput,
      actor: ActorIdentity,
    ): Promise<UpsertControlRecordWithActivityResult> {
      if (!(await projectExists(db, projectId))) {
        throw new Error("Project not found.");
      }
      return db.transaction((tx) =>
        upsertOneInTransaction(tx, projectId, input, actor),
      );
    },

    async upsertManyWithActivity(
      projectId: string,
      inputs: UpsertControlRecordInput[],
      actor: ActorIdentity,
    ): Promise<UpsertControlRecordWithActivityResult[]> {
      if (!(await projectExists(db, projectId))) {
        throw new Error("Project not found.");
      }
      return db.transaction(async (tx) => {
        const results: UpsertControlRecordWithActivityResult[] = [];
        for (const input of inputs) {
          results.push(await upsertOneInTransaction(tx, projectId, input, actor));
        }
        return results;
      });
    },

    async transitionReviewStatus(
      input: TransitionReviewStatusInput,
      actor: ActorIdentity,
    ): Promise<TransitionReviewStatusResult> {
      if (!(await projectExists(db, input.projectId))) {
        return {
          ok: false,
          reason: "not-found",
          message: "Project not found.",
        };
      }
      return db.transaction((tx) =>
        transitionReviewInTransaction(tx, input, actor),
      );
    },

    async listByReviewStatus(
      projectId: string,
      reviewStatus: ControlReviewStatus,
    ): Promise<ControlRecord[]> {
      const rows = await db
        .select()
        .from(controlRecords)
        .where(
          and(
            eq(controlRecords.projectId, projectId),
            eq(controlRecords.reviewStatus, reviewStatus),
          ),
        );
      return rows.map(toControlRecord);
    },

    async countByReviewStatus(
      projectId: string,
      allControlIds?: readonly string[],
    ): Promise<ControlReviewStatusCounts> {
      const rows = await db
        .select()
        .from(controlRecords)
        .where(eq(controlRecords.projectId, projectId));
      const counts = emptyReviewCounts();
      const persistedIds = new Set<string>();
      for (const row of rows) {
        const record = toControlRecord(row);
        persistedIds.add(record.controlId);
        counts[record.reviewStatus] += 1;
      }
      if (allControlIds) {
        for (const controlId of allControlIds) {
          if (!persistedIds.has(controlId)) {
            counts.not_reviewed += 1;
          }
        }
      }
      return counts;
    },

    async listOverdueForReview(
      projectId: string,
      asOfDate: string = todayIsoDate(),
    ): Promise<ControlRecord[]> {
      const rows = await db
        .select()
        .from(controlRecords)
        .where(eq(controlRecords.projectId, projectId));
      return rows
        .map(toControlRecord)
        .filter(
          (record) =>
            record.reviewDueDate !== null &&
            record.reviewDueDate < asOfDate &&
            record.reviewStatus !== "approved",
        );
    },

    async summarizeReviewStatuses(
      projectId: string,
      allControlIds: readonly string[],
      asOfDate?: string,
    ) {
      const [counts, overdue] = await Promise.all([
        this.countByReviewStatus(projectId, allControlIds),
        this.listOverdueForReview(projectId, asOfDate),
      ]);
      return { counts, overdue };
    },
  };
}
