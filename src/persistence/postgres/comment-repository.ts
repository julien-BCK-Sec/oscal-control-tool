import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type {
  Comment,
  CreateCommentInput,
  UpdateCommentInput,
} from "@/data/collaboration";
import type {
  CommentRepository,
  ListCommentsOptions,
} from "../comment-repository";
import type { AppDatabase } from "./client";
import { comments, projects } from "./schema";

function nowIso(): string {
  return new Date().toISOString();
}

function toComment(row: typeof comments.$inferSelect): Comment {
  return {
    id: row.id,
    organizationId: row.organizationId,
    projectId: row.projectId,
    controlId: row.controlId,
    parentCommentId: row.parentCommentId,
    authorId: row.authorId,
    body: row.body,
    resolved: row.resolved,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
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

export function createPostgresCommentRepository(
  db: AppDatabase,
): CommentRepository {
  return {
    async create(input: CreateCommentInput): Promise<Comment> {
      const organizationId = input.organizationId.trim();
      const projectId = input.projectId.trim();
      const controlId = input.controlId.trim();
      const authorId = input.authorId.trim();
      const body = input.body.trim();
      if (!organizationId || !projectId || !controlId || !authorId) {
        throw new Error(
          "organizationId, projectId, controlId, and authorId are required.",
        );
      }
      if (!body) {
        throw new Error("Comment body is required.");
      }

      const inOrg = await assertProjectInOrg(db, organizationId, projectId);
      if (!inOrg) {
        throw new Error("Project not found in organization.");
      }

      const parentCommentId = input.parentCommentId?.trim() || null;
      if (parentCommentId) {
        const parent = await db
          .select()
          .from(comments)
          .where(
            and(
              eq(comments.id, parentCommentId),
              eq(comments.organizationId, organizationId),
              eq(comments.projectId, projectId),
              eq(comments.controlId, controlId),
              isNull(comments.deletedAt),
            ),
          )
          .limit(1);
        if (!parent[0]) {
          throw new Error("Parent comment not found.");
        }
      }

      const id = randomUUID();
      const createdAt = nowIso();
      const row = {
        id,
        organizationId,
        projectId,
        controlId,
        parentCommentId,
        authorId,
        body,
        resolved: false,
        createdAt,
        updatedAt: createdAt,
        deletedAt: null,
      };
      await db.insert(comments).values(row);
      return toComment(row);
    },

    async getById(
      organizationId: string,
      commentId: string,
    ): Promise<Comment | null> {
      const rows = await db
        .select()
        .from(comments)
        .where(
          and(
            eq(comments.id, commentId),
            eq(comments.organizationId, organizationId.trim()),
          ),
        )
        .limit(1);
      return rows[0] ? toComment(rows[0]) : null;
    },

    async listByControl(
      organizationId: string,
      projectId: string,
      controlId: string,
      options?: ListCommentsOptions,
    ): Promise<Comment[]> {
      const conditions = [
        eq(comments.organizationId, organizationId.trim()),
        eq(comments.projectId, projectId.trim()),
        eq(comments.controlId, controlId.trim()),
      ];
      if (!options?.includeDeleted) {
        conditions.push(isNull(comments.deletedAt));
      }
      const rows = await db
        .select()
        .from(comments)
        .where(and(...conditions))
        .orderBy(asc(comments.createdAt));
      return rows.map(toComment);
    },

    async update(
      organizationId: string,
      commentId: string,
      input: UpdateCommentInput,
    ): Promise<Comment | null> {
      const body = input.body.trim();
      if (!body) {
        throw new Error("Comment body is required.");
      }
      const existing = await this.getById(organizationId, commentId);
      if (!existing || existing.deletedAt) {
        return null;
      }
      const updatedAt = nowIso();
      await db
        .update(comments)
        .set({ body, updatedAt })
        .where(
          and(
            eq(comments.id, commentId),
            eq(comments.organizationId, organizationId.trim()),
          ),
        );
      return { ...existing, body, updatedAt };
    },

    async softDelete(
      organizationId: string,
      commentId: string,
      deletedAt: string = nowIso(),
    ): Promise<Comment | null> {
      const existing = await this.getById(organizationId, commentId);
      if (!existing || existing.deletedAt) {
        return null;
      }
      const updatedAt = deletedAt;
      await db
        .update(comments)
        .set({ deletedAt, updatedAt })
        .where(
          and(
            eq(comments.id, commentId),
            eq(comments.organizationId, organizationId.trim()),
          ),
        );
      return { ...existing, deletedAt, updatedAt };
    },

    async restore(
      organizationId: string,
      commentId: string,
    ): Promise<Comment | null> {
      const existing = await this.getById(organizationId, commentId);
      if (!existing || !existing.deletedAt) {
        return null;
      }
      const updatedAt = nowIso();
      await db
        .update(comments)
        .set({ deletedAt: null, updatedAt })
        .where(
          and(
            eq(comments.id, commentId),
            eq(comments.organizationId, organizationId.trim()),
          ),
        );
      return { ...existing, deletedAt: null, updatedAt };
    },

    async setResolved(
      organizationId: string,
      commentId: string,
      resolved: boolean,
    ): Promise<Comment | null> {
      const existing = await this.getById(organizationId, commentId);
      if (!existing || existing.deletedAt) {
        return null;
      }
      const updatedAt = nowIso();
      await db
        .update(comments)
        .set({ resolved, updatedAt })
        .where(
          and(
            eq(comments.id, commentId),
            eq(comments.organizationId, organizationId.trim()),
          ),
        );
      return { ...existing, resolved, updatedAt };
    },
  };
}

export { toComment };
