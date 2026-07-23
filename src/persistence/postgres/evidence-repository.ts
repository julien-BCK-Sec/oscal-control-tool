import "server-only";

import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  isEvidenceStatus,
  isEvidenceType,
  type CreateEvidenceInput,
  type Evidence,
  type EvidenceControlLink,
  type EvidenceStatus,
  type EvidenceType,
  type EvidenceWithControlIds,
  type ListEvidenceOptions,
  type UpdateEvidenceInput,
} from "@/data/evidence";
import type { EvidenceRepository } from "../evidence-repository";
import type { AppDatabase } from "./client";
import { evidence, evidenceControls, projects } from "./schema";

function nowIso(): string {
  return new Date().toISOString();
}

function toEvidence(row: typeof evidence.$inferSelect): Evidence {
  const evidenceType: EvidenceType = isEvidenceType(row.evidenceType)
    ? row.evidenceType
    : "other";
  const status: EvidenceStatus = isEvidenceStatus(row.status)
    ? row.status
    : "draft";
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    owner: row.owner,
    evidenceType,
    status,
    collectionDate: row.collectionDate,
    reviewDueDate: row.reviewDueDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toLink(row: typeof evidenceControls.$inferSelect): EvidenceControlLink {
  return {
    id: row.id,
    evidenceId: row.evidenceId,
    projectId: row.projectId,
    controlId: row.controlId,
    createdAt: row.createdAt,
  };
}

async function projectExists(
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

async function loadControlIds(
  db: AppDatabase,
  projectId: string,
  evidenceId: string,
): Promise<string[]> {
  const rows = await db
    .select({ controlId: evidenceControls.controlId })
    .from(evidenceControls)
    .where(
      and(
        eq(evidenceControls.projectId, projectId),
        eq(evidenceControls.evidenceId, evidenceId),
      ),
    )
    .orderBy(asc(evidenceControls.controlId));
  return rows.map((row) => row.controlId);
}

async function withControlIds(
  db: AppDatabase,
  row: Evidence,
): Promise<EvidenceWithControlIds> {
  const controlIds = await loadControlIds(db, row.projectId, row.id);
  return { ...row, controlIds };
}

export function createPostgresEvidenceRepository(
  db: AppDatabase,
): EvidenceRepository {
  return {
    async create(input: CreateEvidenceInput): Promise<EvidenceWithControlIds> {
      const projectId = input.projectId.trim();
      const title = input.title.trim();
      if (!projectId || !title) {
        throw new Error("projectId and title are required.");
      }
      if (!isEvidenceType(input.evidenceType)) {
        throw new Error("Invalid evidence type.");
      }
      const status: EvidenceStatus = input.status ?? "draft";
      if (!isEvidenceStatus(status) || status === "archived") {
        throw new Error("Invalid evidence status for create.");
      }
      if (!(await projectExists(db, projectId))) {
        throw new Error("Project not found.");
      }

      const id = randomUUID();
      const createdAt = nowIso();
      const controlIds = [
        ...new Set(
          (input.controlIds ?? [])
            .map((c) => c.trim())
            .filter((c) => c.length > 0),
        ),
      ];

      await db.transaction(async (tx) => {
        await tx.insert(evidence).values({
          id,
          projectId,
          title,
          description: input.description ?? "",
          owner: (input.owner ?? "").trim(),
          evidenceType: input.evidenceType,
          status,
          collectionDate: input.collectionDate ?? null,
          reviewDueDate: input.reviewDueDate ?? null,
          createdAt,
          updatedAt: createdAt,
        });
        for (const controlId of controlIds) {
          await tx.insert(evidenceControls).values({
            id: randomUUID(),
            evidenceId: id,
            projectId,
            controlId,
            createdAt,
          });
        }
      });

      return {
        id,
        projectId,
        title,
        description: input.description ?? "",
        owner: (input.owner ?? "").trim(),
        evidenceType: input.evidenceType,
        status,
        collectionDate: input.collectionDate ?? null,
        reviewDueDate: input.reviewDueDate ?? null,
        createdAt,
        updatedAt: createdAt,
        controlIds,
      };
    },

    async getById(projectId, evidenceId) {
      const rows = await db
        .select()
        .from(evidence)
        .where(
          and(eq(evidence.projectId, projectId), eq(evidence.id, evidenceId)),
        )
        .limit(1);
      if (!rows[0]) {
        return null;
      }
      return withControlIds(db, toEvidence(rows[0]));
    },

    async listByProject(projectId, options?: ListEvidenceOptions) {
      const includeArchived = options?.includeArchived === true;
      const controlId = options?.controlId?.trim();

      let evidenceIdsFilter: string[] | null = null;
      if (controlId) {
        const links = await db
          .select({ evidenceId: evidenceControls.evidenceId })
          .from(evidenceControls)
          .where(
            and(
              eq(evidenceControls.projectId, projectId),
              eq(evidenceControls.controlId, controlId),
            ),
          );
        evidenceIdsFilter = links.map((l) => l.evidenceId);
        if (evidenceIdsFilter.length === 0) {
          return [];
        }
      }

      const conditions = [eq(evidence.projectId, projectId)];
      if (!includeArchived) {
        conditions.push(ne(evidence.status, "archived"));
      }
      if (evidenceIdsFilter) {
        conditions.push(inArray(evidence.id, evidenceIdsFilter));
      }

      const rows = await db
        .select()
        .from(evidence)
        .where(and(...conditions))
        .orderBy(asc(evidence.title));

      const results: EvidenceWithControlIds[] = [];
      for (const row of rows) {
        results.push(await withControlIds(db, toEvidence(row)));
      }
      return results;
    },

    async update(projectId, evidenceId, input: UpdateEvidenceInput) {
      const existing = await this.getById(projectId, evidenceId);
      if (!existing) {
        return null;
      }
      if (input.evidenceType !== undefined && !isEvidenceType(input.evidenceType)) {
        throw new Error("Invalid evidence type.");
      }
      if (input.status !== undefined && !isEvidenceStatus(input.status)) {
        throw new Error("Invalid evidence status.");
      }

      const updatedAt = nowIso();
      const next = {
        title: input.title !== undefined ? input.title.trim() : existing.title,
        description:
          input.description !== undefined
            ? input.description
            : existing.description,
        owner:
          input.owner !== undefined ? input.owner.trim() : existing.owner,
        evidenceType: input.evidenceType ?? existing.evidenceType,
        status: input.status ?? existing.status,
        collectionDate:
          input.collectionDate !== undefined
            ? input.collectionDate
            : existing.collectionDate,
        reviewDueDate:
          input.reviewDueDate !== undefined
            ? input.reviewDueDate
            : existing.reviewDueDate,
        updatedAt,
      };
      if (!next.title) {
        throw new Error("title is required.");
      }

      await db
        .update(evidence)
        .set(next)
        .where(
          and(eq(evidence.projectId, projectId), eq(evidence.id, evidenceId)),
        );

      return {
        ...existing,
        ...next,
        controlIds: existing.controlIds,
      };
    },

    async delete(projectId, evidenceId) {
      const existing = await this.getById(projectId, evidenceId);
      if (!existing) {
        return false;
      }
      await db
        .delete(evidence)
        .where(
          and(eq(evidence.projectId, projectId), eq(evidence.id, evidenceId)),
        );
      return true;
    },

    async listControlIds(projectId, evidenceId) {
      return loadControlIds(db, projectId, evidenceId);
    },

    async listLinksForControl(projectId, controlId) {
      const rows = await db
        .select()
        .from(evidenceControls)
        .where(
          and(
            eq(evidenceControls.projectId, projectId),
            eq(evidenceControls.controlId, controlId),
          ),
        )
        .orderBy(asc(evidenceControls.createdAt));
      return rows.map(toLink);
    },

    async associate(projectId, evidenceId, controlId) {
      const trimmedControlId = controlId.trim();
      if (!trimmedControlId) {
        throw new Error("controlId is required.");
      }
      const existing = await this.getById(projectId, evidenceId);
      if (!existing) {
        return null;
      }
      if (existing.controlIds.includes(trimmedControlId)) {
        const links = await this.listLinksForControl(projectId, trimmedControlId);
        return (
          links.find((link) => link.evidenceId === evidenceId) ?? {
            id: "",
            evidenceId,
            projectId,
            controlId: trimmedControlId,
            createdAt: existing.createdAt,
          }
        );
      }
      const id = randomUUID();
      const createdAt = nowIso();
      await db.insert(evidenceControls).values({
        id,
        evidenceId,
        projectId,
        controlId: trimmedControlId,
        createdAt,
      });
      return {
        id,
        evidenceId,
        projectId,
        controlId: trimmedControlId,
        createdAt,
      };
    },

    async dissociate(projectId, evidenceId, controlId) {
      const trimmed = controlId.trim();
      const existing = await this.getById(projectId, evidenceId);
      if (!existing || !existing.controlIds.includes(trimmed)) {
        return false;
      }
      await db
        .delete(evidenceControls)
        .where(
          and(
            eq(evidenceControls.projectId, projectId),
            eq(evidenceControls.evidenceId, evidenceId),
            eq(evidenceControls.controlId, trimmed),
          ),
        );
      return true;
    },
  };
}
