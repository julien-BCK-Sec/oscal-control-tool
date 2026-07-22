import "server-only";

import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  normalizeControlRecordFields,
  isControlImplementationStatus,
  type ControlRecord,
  type ControlImplementationStatus,
  type UpsertControlRecordInput,
} from "@/data/control-record";
import type { ControlRecordRepository } from "../control-record-repository";
import type { AppDatabase } from "./client";
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
  };
}
