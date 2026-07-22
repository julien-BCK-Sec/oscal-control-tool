import "server-only";

import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  isControlActivityType,
  type AppendControlActivityInput,
  type ControlActivity,
} from "@/data/control-activity";
import type { ControlActivityRepository } from "../control-activity-repository";
import type { AppDatabase } from "./client";
import { controlActivities } from "./schema";

function nowIso(): string {
  return new Date().toISOString();
}

function toControlActivity(
  row: typeof controlActivities.$inferSelect,
): ControlActivity {
  const activityType = isControlActivityType(row.activityType)
    ? row.activityType
    : "control_record_created";
  return {
    id: row.id,
    controlRecordId: row.controlRecordId,
    activityType,
    actorId: row.actorId,
    actorDisplayName: row.actorDisplayName,
    fieldName: row.fieldName,
    previousValue: row.previousValue,
    newValue: row.newValue,
    metadataJson: row.metadataJson,
    createdAt: row.createdAt,
  };
}

type ActivityWriter = {
  insert: AppDatabase["insert"];
};

/**
 * Postgres has no SQLite-style implicit `rowid` tie-breaker for insertion
 * order within an identical `createdAt` timestamp. Callers that append
 * multiple activities in the same batch already assign strictly increasing
 * `createdAt` values (see `control-record-service.ts`), so ordering by
 * `createdAt` alone preserves the intended order in practice.
 */
async function insertActivities(
  writer: ActivityWriter,
  inputs: AppendControlActivityInput[],
): Promise<ControlActivity[]> {
  const created: ControlActivity[] = [];
  for (const input of inputs) {
    const controlRecordId = input.controlRecordId.trim();
    if (!controlRecordId) {
      throw new Error("controlRecordId is required.");
    }
    const id = randomUUID();
    const createdAt = input.createdAt ?? nowIso();
    const row = {
      id,
      controlRecordId,
      activityType: input.activityType,
      actorId: input.actorId ?? null,
      actorDisplayName: input.actorDisplayName ?? null,
      fieldName: input.fieldName ?? null,
      previousValue: input.previousValue ?? null,
      newValue: input.newValue ?? null,
      metadataJson: input.metadataJson ?? null,
      createdAt,
    };
    await writer.insert(controlActivities).values(row);
    created.push(toControlActivity(row));
  }
  return created;
}

export function createPostgresControlActivityRepository(
  db: AppDatabase,
): ControlActivityRepository {
  return {
    async append(input: AppendControlActivityInput): Promise<ControlActivity> {
      const [row] = await insertActivities(db, [input]);
      return row;
    },

    async appendMany(
      inputs: AppendControlActivityInput[],
    ): Promise<ControlActivity[]> {
      if (inputs.length === 0) {
        return [];
      }
      return db.transaction((tx) => insertActivities(tx, inputs));
    },

    async listByControlRecordId(
      controlRecordId: string,
    ): Promise<ControlActivity[]> {
      const rows = await db
        .select()
        .from(controlActivities)
        .where(eq(controlActivities.controlRecordId, controlRecordId))
        .orderBy(desc(controlActivities.createdAt));
      return rows.map(toControlActivity);
    },
  };
}

/** Internal helper for transactional inserts from ControlRecordService. */
export function appendActivitiesInTransaction(
  tx: ActivityWriter,
  inputs: AppendControlActivityInput[],
): Promise<ControlActivity[]> {
  return insertActivities(tx, inputs);
}

export { toControlActivity };
