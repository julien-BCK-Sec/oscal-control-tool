import "server-only";

import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  detectControlRecordFieldChanges,
  type AppendControlActivityInput,
} from "@/data/control-activity";
import {
  isControlImplementationStatus,
  normalizeControlRecordFields,
  type ControlRecord,
  type ControlImplementationStatus,
  type UpsertControlRecordInput,
} from "@/data/control-record";
import type { ActorIdentity } from "../actor";
import type {
  ControlRecordService,
  UpsertControlRecordWithActivityResult,
} from "../control-record-service";
import type { AppDatabase } from "./client";
import { appendActivitiesInTransaction } from "./control-activity-repository";
import { controlRecords, projects } from "./schema";

function nowIso(): string {
  return new Date().toISOString();
}

function toControlRecord(
  row: typeof controlRecords.$inferSelect,
): ControlRecord {
  const implementationStatus: ControlImplementationStatus =
    isControlImplementationStatus(row.implementationStatus)
      ? row.implementationStatus
      : "draft";
  return {
    id: row.id,
    projectId: row.projectId,
    controlId: row.controlId,
    owner: row.owner,
    coOwner: row.coOwner,
    businessUnit: row.businessUnit,
    implementationStatus,
    reviewDueDate: row.reviewDueDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type DbExecutor = Pick<AppDatabase, "select" | "insert" | "update" | "transaction">;

function projectExists(executor: DbExecutor, projectId: string): boolean {
  const rows = executor
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)
    .all();
  return rows.length > 0;
}

/**
 * Create behavior: emit only `control_record_created` (no per-field events for
 * initial values — avoids noisy duplicates on first lazy create).
 * Update behavior: emit field events only for values that actually changed.
 * No-op autosave: no row update and no activity rows.
 */
function upsertOneInTransaction(
  tx: DbExecutor,
  projectId: string,
  input: UpsertControlRecordInput,
  actor: ActorIdentity,
): UpsertControlRecordWithActivityResult {
  const controlId = input.controlId.trim();
  if (!controlId) {
    throw new Error("controlId is required.");
  }

  const fields = normalizeControlRecordFields(input);
  const existing = tx
    .select()
    .from(controlRecords)
    .where(
      and(
        eq(controlRecords.projectId, projectId),
        eq(controlRecords.controlId, controlId),
      ),
    )
    .limit(1)
    .all();

  if (!existing[0]) {
    const id = randomUUID();
    const createdAt = nowIso();
    tx.insert(controlRecords)
      .values({
        id,
        projectId,
        controlId,
        owner: fields.owner,
        coOwner: fields.coOwner,
        businessUnit: fields.businessUnit,
        implementationStatus: fields.implementationStatus,
        reviewDueDate: fields.reviewDueDate,
        createdAt,
        updatedAt: createdAt,
      })
      .run();

    appendActivitiesInTransaction(tx, [
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
  tx.update(controlRecords)
    .set({
      owner: fields.owner,
      coOwner: fields.coOwner,
      businessUnit: fields.businessUnit,
      implementationStatus: fields.implementationStatus,
      reviewDueDate: fields.reviewDueDate,
      updatedAt,
    })
    .where(eq(controlRecords.id, row.id))
    .run();

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
  appendActivitiesInTransaction(tx, activityInputs);

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

/**
 * Coordinates ControlRecord writes with ControlActivity appends.
 */
export function createSqliteControlRecordService(
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
      if (!projectExists(db, projectId)) {
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
      if (!projectExists(db, projectId)) {
        throw new Error("Project not found.");
      }
      return db.transaction((tx) => {
        const results: UpsertControlRecordWithActivityResult[] = [];
        for (const input of inputs) {
          results.push(upsertOneInTransaction(tx, projectId, input, actor));
        }
        return results;
      });
    },
  };
}
