import "server-only";

import { and, eq, isNotNull, lt, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_CONTROL_REVIEW_STATUS,
  isControlImplementationStatus,
  isControlReviewStatus,
  normalizeControlRecordFields,
  type ControlRecord,
  type ControlImplementationStatus,
  type ControlReviewStatus,
  type UpsertControlRecordInput,
} from "@/data/control-record";
import type { ControlRecordRepository } from "../control-record-repository";
import type { AppDatabase } from "./client";
import { controlRecords, projects } from "./schema";

function nowIso(): string {
  return new Date().toISOString();
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

async function assertProjectExists(
  db: AppDatabase,
  projectId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return rows.length > 0;
}

export function createSqliteControlRecordRepository(
  db: AppDatabase,
): ControlRecordRepository {
  async function upsertOne(
    projectId: string,
    input: UpsertControlRecordInput,
  ): Promise<ControlRecord> {
    const controlId = input.controlId.trim();
    if (!controlId) {
      throw new Error("controlId is required.");
    }

    const fields = normalizeControlRecordFields(input);
    const updatedAt = nowIso();

    const existing = await db
      .select()
      .from(controlRecords)
      .where(
        and(
          eq(controlRecords.projectId, projectId),
          eq(controlRecords.controlId, controlId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      const row = existing[0];
      await db
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

      return toControlRecord({
        ...row,
        owner: fields.owner,
        coOwner: fields.coOwner,
        businessUnit: fields.businessUnit,
        implementationStatus: fields.implementationStatus,
        reviewDueDate: fields.reviewDueDate,
        updatedAt,
      });
    }

    const id = randomUUID();
    const createdAt = updatedAt;
    await db.insert(controlRecords).values({
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
      updatedAt,
    });

    return {
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
      updatedAt,
    };
  }

  return {
    async listByProject(projectId: string): Promise<ControlRecord[]> {
      const rows = await db
        .select()
        .from(controlRecords)
        .where(eq(controlRecords.projectId, projectId));
      return rows.map(toControlRecord);
    },

    async getByProjectAndControl(
      projectId: string,
      controlId: string,
    ): Promise<ControlRecord | null> {
      const rows = await db
        .select()
        .from(controlRecords)
        .where(
          and(
            eq(controlRecords.projectId, projectId),
            eq(controlRecords.controlId, controlId.trim()),
          ),
        )
        .limit(1);
      return rows[0] ? toControlRecord(rows[0]) : null;
    },

    async upsert(
      projectId: string,
      input: UpsertControlRecordInput,
    ): Promise<ControlRecord> {
      const exists = await assertProjectExists(db, projectId);
      if (!exists) {
        throw new Error("Project not found.");
      }
      return upsertOne(projectId, input);
    },

    async upsertMany(
      projectId: string,
      inputs: UpsertControlRecordInput[],
    ): Promise<ControlRecord[]> {
      const exists = await assertProjectExists(db, projectId);
      if (!exists) {
        throw new Error("Project not found.");
      }

      const results: ControlRecord[] = [];
      for (const input of inputs) {
        results.push(await upsertOne(projectId, input));
      }
      return results;
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

    async listOverdueForReview(
      projectId: string,
      asOfDate: string = todayIsoDate(),
    ): Promise<ControlRecord[]> {
      const rows = await db
        .select()
        .from(controlRecords)
        .where(
          and(
            eq(controlRecords.projectId, projectId),
            isNotNull(controlRecords.reviewDueDate),
            lt(controlRecords.reviewDueDate, asOfDate),
            ne(controlRecords.reviewStatus, "approved"),
          ),
        );
      return rows.map(toControlRecord);
    },
  };
}

/** Shared row → DTO mapping for ControlRecordService. */
export { toControlRecord };
