import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  isAssignmentRole,
  type Assignment,
  type CreateAssignmentInput,
} from "@/data/collaboration";
import type { AssignmentRepository } from "../assignment-repository";
import type { AppDatabase } from "./client";
import { assignments, projects } from "./schema";

function nowIso(): string {
  return new Date().toISOString();
}

function toAssignment(row: typeof assignments.$inferSelect): Assignment {
  const assignmentRole = isAssignmentRole(row.assignmentRole)
    ? row.assignmentRole
    : "owner";
  return {
    id: row.id,
    organizationId: row.organizationId,
    projectId: row.projectId,
    controlId: row.controlId,
    assigneeUserId: row.assigneeUserId,
    assignmentRole,
    assignedByUserId: row.assignedByUserId,
    assignedAt: row.assignedAt,
    completedAt: row.completedAt,
  };
}

async function assertProjectInOrg(
  db: AppDatabase,
  organizationId: string,
  projectId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export function createPostgresAssignmentRepository(
  db: AppDatabase,
): AssignmentRepository {
  return {
    async create(input: CreateAssignmentInput): Promise<Assignment> {
      const organizationId = input.organizationId.trim();
      const projectId = input.projectId.trim();
      const controlId = input.controlId.trim();
      const assigneeUserId = input.assigneeUserId.trim();
      const assignedByUserId = input.assignedByUserId.trim();
      if (
        !organizationId ||
        !projectId ||
        !controlId ||
        !assigneeUserId ||
        !assignedByUserId
      ) {
        throw new Error(
          "organizationId, projectId, controlId, assigneeUserId, and assignedByUserId are required.",
        );
      }
      if (!isAssignmentRole(input.assignmentRole)) {
        throw new Error("Invalid assignment role.");
      }

      const inOrg = await assertProjectInOrg(db, organizationId, projectId);
      if (!inOrg) {
        throw new Error("Project not found in organization.");
      }

      const id = randomUUID();
      const assignedAt = nowIso();
      const row = {
        id,
        organizationId,
        projectId,
        controlId,
        assigneeUserId,
        assignmentRole: input.assignmentRole,
        assignedByUserId,
        assignedAt,
        completedAt: null,
      };
      await db.insert(assignments).values(row);
      return toAssignment(row);
    },

    async getById(
      organizationId: string,
      assignmentId: string,
    ): Promise<Assignment | null> {
      const rows = await db
        .select()
        .from(assignments)
        .where(
          and(
            eq(assignments.id, assignmentId),
            eq(assignments.organizationId, organizationId.trim()),
          ),
        )
        .limit(1);
      return rows[0] ? toAssignment(rows[0]) : null;
    },

    async listByControl(
      organizationId: string,
      projectId: string,
      controlId: string,
    ): Promise<Assignment[]> {
      const rows = await db
        .select()
        .from(assignments)
        .where(
          and(
            eq(assignments.organizationId, organizationId.trim()),
            eq(assignments.projectId, projectId.trim()),
            eq(assignments.controlId, controlId.trim()),
          ),
        )
        .orderBy(asc(assignments.assignedAt));
      return rows.map(toAssignment);
    },

    async listByProject(
      organizationId: string,
      projectId: string,
    ): Promise<Assignment[]> {
      const rows = await db
        .select()
        .from(assignments)
        .where(
          and(
            eq(assignments.organizationId, organizationId.trim()),
            eq(assignments.projectId, projectId.trim()),
          ),
        )
        .orderBy(asc(assignments.assignedAt));
      return rows.map(toAssignment);
    },

    async listByAssignee(
      organizationId: string,
      assigneeUserId: string,
    ): Promise<Assignment[]> {
      const rows = await db
        .select()
        .from(assignments)
        .where(
          and(
            eq(assignments.organizationId, organizationId.trim()),
            eq(assignments.assigneeUserId, assigneeUserId.trim()),
          ),
        )
        .orderBy(asc(assignments.assignedAt));
      return rows.map(toAssignment);
    },

    async reassign(
      organizationId: string,
      assignmentId: string,
      assigneeUserId: string,
      assignedByUserId: string,
    ): Promise<Assignment | null> {
      const existing = await this.getById(organizationId, assignmentId);
      if (!existing) {
        return null;
      }
      const nextAssignee = assigneeUserId.trim();
      const nextAssignedBy = assignedByUserId.trim();
      if (!nextAssignee || !nextAssignedBy) {
        throw new Error("assigneeUserId and assignedByUserId are required.");
      }
      const assignedAt = nowIso();
      await db
        .update(assignments)
        .set({
          assigneeUserId: nextAssignee,
          assignedByUserId: nextAssignedBy,
          assignedAt,
          completedAt: null,
        })
        .where(
          and(
            eq(assignments.id, assignmentId),
            eq(assignments.organizationId, organizationId.trim()),
          ),
        );
      return {
        ...existing,
        assigneeUserId: nextAssignee,
        assignedByUserId: nextAssignedBy,
        assignedAt,
        completedAt: null,
      };
    },

    async complete(
      organizationId: string,
      assignmentId: string,
      completedAt: string = nowIso(),
    ): Promise<Assignment | null> {
      const existing = await this.getById(organizationId, assignmentId);
      if (!existing) {
        return null;
      }
      await db
        .update(assignments)
        .set({ completedAt })
        .where(
          and(
            eq(assignments.id, assignmentId),
            eq(assignments.organizationId, organizationId.trim()),
          ),
        );
      return { ...existing, completedAt };
    },

    async remove(
      organizationId: string,
      assignmentId: string,
    ): Promise<boolean> {
      const existing = await this.getById(organizationId, assignmentId);
      if (!existing) {
        return false;
      }
      await db
        .delete(assignments)
        .where(
          and(
            eq(assignments.id, assignmentId),
            eq(assignments.organizationId, organizationId.trim()),
          ),
        );
      return true;
    },
  };
}

export { toAssignment };
