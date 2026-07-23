import "server-only";

import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_CONTROL_RECORD_FIELDS,
  DEFAULT_CONTROL_REVIEW_STATUS,
  isControlImplementationStatus,
  isControlReviewStatus,
  isEvidenceRequirement,
  type ControlRecord,
} from "@/data/control-record";
import { DEFAULT_EVIDENCE_REQUIREMENT } from "@/data/evidence";
import type { ActorIdentity } from "../actor";
import { nextActivityTimestamp } from "../activity-clock";
import type { DiscussionService } from "../discussion-service";
import { createPostgresCommentRepository } from "./comment-repository";
import { appendActivitiesInTransaction } from "./control-activity-repository";
import {
  filterMentionIdsToOrgMembers,
  replaceCommentMentions,
} from "./comment-mentions";
import type { AppDatabase } from "./client";
import { controlRecords, projects } from "./schema";
import { member as memberTable } from "./auth-schema";

function toControlRecord(
  row: typeof controlRecords.$inferSelect,
): ControlRecord {
  const implementationStatus = isControlImplementationStatus(
    row.implementationStatus,
  )
    ? row.implementationStatus
    : "draft";
  const reviewStatus = isControlReviewStatus(row.reviewStatus)
    ? row.reviewStatus
    : DEFAULT_CONTROL_REVIEW_STATUS;
  const evidenceRequirement = isEvidenceRequirement(row.evidenceRequirement)
    ? row.evidenceRequirement
    : DEFAULT_EVIDENCE_REQUIREMENT;
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
    evidenceRequirement,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Ensure a ControlRecord exists so collaboration events can join the shared
 * activity stream. Lazy-creates with draft defaults when missing.
 */
async function ensureControlRecord(
  db: AppDatabase,
  organizationId: string,
  projectId: string,
  controlId: string,
  actor: ActorIdentity,
): Promise<ControlRecord> {
  const projectRows = await db
    .select({ id: projects.id, organizationId: projects.organizationId })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!projectRows[0]) {
    throw new Error("Project not found in organization.");
  }

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
    return toControlRecord(existing[0]);
  }

  const id = randomUUID();
  const createdAt = nextActivityTimestamp();
  const fields = DEFAULT_CONTROL_RECORD_FIELDS;
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
    evidenceRequirement: fields.evidenceRequirement,
    createdAt,
    updatedAt: createdAt,
  });

  await appendActivitiesInTransaction(db, [
    {
      controlRecordId: id,
      activityType: "control_record_created",
      actorId: actor.actorId,
      actorDisplayName: actor.actorDisplayName,
      createdAt,
    },
  ]);

  return {
    id,
    projectId,
    controlId,
    ...fields,
    reviewStatus: DEFAULT_CONTROL_REVIEW_STATUS,
    createdAt,
    updatedAt: createdAt,
  };
}

async function orgMemberUserIds(
  db: AppDatabase,
  organizationId: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ userId: memberTable.userId })
    .from(memberTable)
    .where(eq(memberTable.organizationId, organizationId));
  return new Set(rows.map((row) => row.userId));
}

async function persistMentions(
  db: AppDatabase,
  organizationId: string,
  commentId: string,
  mentionedUserIds: readonly string[] | undefined,
): Promise<string[]> {
  const allowed = await orgMemberUserIds(db, organizationId);
  const filtered = filterMentionIdsToOrgMembers(
    mentionedUserIds ?? [],
    allowed,
  );
  await replaceCommentMentions(db, commentId, filtered);
  return filtered;
}

function commentMetadata(
  commentId: string,
  parentCommentId: string | null,
  mentionedUserIds: readonly string[] = [],
) {
  return JSON.stringify({ commentId, parentCommentId, mentionedUserIds });
}

export function createPostgresDiscussionService(
  db: AppDatabase,
): DiscussionService {
  const comments = createPostgresCommentRepository(db);

  return {
    listComments(organizationId, projectId, controlId, options) {
      return comments.listByControl(
        organizationId,
        projectId,
        controlId,
        options,
      );
    },

    getComment(organizationId, commentId) {
      return comments.getById(organizationId, commentId);
    },

    async createComment(input, actor) {
      const controlId = input.controlId.trim();
      const record = await ensureControlRecord(
        db,
        input.organizationId,
        input.projectId,
        controlId,
        actor,
      );
      const comment = await comments.create({
        organizationId: input.organizationId,
        projectId: input.projectId,
        controlId,
        parentCommentId: input.parentCommentId,
        authorId: actor.actorId ?? "unknown",
        body: input.body,
      });
      const mentionedUserIds = await persistMentions(
        db,
        input.organizationId,
        comment.id,
        input.mentionedUserIds,
      );
      const [activity] = await appendActivitiesInTransaction(db, [
        {
          controlRecordId: record.id,
          activityType: "comment_added",
          actorId: actor.actorId,
          actorDisplayName: actor.actorDisplayName,
          newValue: comment.body.slice(0, 200),
          metadataJson: commentMetadata(
            comment.id,
            comment.parentCommentId,
            mentionedUserIds,
          ),
          createdAt: nextActivityTimestamp(),
        },
      ]);
      return { comment, activity, mentionedUserIds };
    },

    async editComment(
      organizationId,
      commentId,
      body,
      actor,
      mentionedUserIdsInput,
    ) {
      const existing = await comments.getById(organizationId, commentId);
      if (!existing || existing.deletedAt) {
        return null;
      }
      const comment = await comments.update(organizationId, commentId, { body });
      if (!comment) {
        return null;
      }
      const mentionedUserIds = await persistMentions(
        db,
        organizationId,
        comment.id,
        mentionedUserIdsInput,
      );
      const record = await ensureControlRecord(
        db,
        organizationId,
        comment.projectId,
        comment.controlId,
        actor,
      );
      const [activity] = await appendActivitiesInTransaction(db, [
        {
          controlRecordId: record.id,
          activityType: "comment_edited",
          actorId: actor.actorId,
          actorDisplayName: actor.actorDisplayName,
          previousValue: existing.body.slice(0, 200),
          newValue: comment.body.slice(0, 200),
          metadataJson: commentMetadata(
            comment.id,
            comment.parentCommentId,
            mentionedUserIds,
          ),
          createdAt: nextActivityTimestamp(),
        },
      ]);
      return { comment, activity, mentionedUserIds };
    },

    async softDeleteComment(organizationId, commentId, actor) {
      const comment = await comments.softDelete(organizationId, commentId);
      if (!comment) {
        return null;
      }
      const record = await ensureControlRecord(
        db,
        organizationId,
        comment.projectId,
        comment.controlId,
        actor,
      );
      const [activity] = await appendActivitiesInTransaction(db, [
        {
          controlRecordId: record.id,
          activityType: "comment_deleted",
          actorId: actor.actorId,
          actorDisplayName: actor.actorDisplayName,
          metadataJson: commentMetadata(comment.id, comment.parentCommentId),
          createdAt: nextActivityTimestamp(),
        },
      ]);
      return { comment, activity, mentionedUserIds: [] };
    },

    async restoreComment(organizationId, commentId, actor) {
      const comment = await comments.restore(organizationId, commentId);
      if (!comment) {
        return null;
      }
      const record = await ensureControlRecord(
        db,
        organizationId,
        comment.projectId,
        comment.controlId,
        actor,
      );
      const [activity] = await appendActivitiesInTransaction(db, [
        {
          controlRecordId: record.id,
          activityType: "comment_restored",
          actorId: actor.actorId,
          actorDisplayName: actor.actorDisplayName,
          metadataJson: commentMetadata(comment.id, comment.parentCommentId),
          createdAt: nextActivityTimestamp(),
        },
      ]);
      return { comment, activity, mentionedUserIds: [] };
    },

    async resolveDiscussion(organizationId, commentId, actor) {
      const existing = await comments.getById(organizationId, commentId);
      if (!existing || existing.deletedAt) {
        return null;
      }
      if (existing.resolved) {
        return null;
      }
      const comment = await comments.setResolved(
        organizationId,
        commentId,
        true,
      );
      if (!comment) {
        return null;
      }
      const record = await ensureControlRecord(
        db,
        organizationId,
        comment.projectId,
        comment.controlId,
        actor,
      );
      const [activity] = await appendActivitiesInTransaction(db, [
        {
          controlRecordId: record.id,
          activityType: "comment_resolved",
          actorId: actor.actorId,
          actorDisplayName: actor.actorDisplayName,
          metadataJson: commentMetadata(comment.id, comment.parentCommentId),
          createdAt: nextActivityTimestamp(),
        },
      ]);
      return { comment, activity, mentionedUserIds: [] };
    },

    async reopenDiscussion(organizationId, commentId, actor) {
      const existing = await comments.getById(organizationId, commentId);
      if (!existing || existing.deletedAt) {
        return null;
      }
      if (!existing.resolved) {
        return null;
      }
      const comment = await comments.setResolved(
        organizationId,
        commentId,
        false,
      );
      if (!comment) {
        return null;
      }
      const record = await ensureControlRecord(
        db,
        organizationId,
        comment.projectId,
        comment.controlId,
        actor,
      );
      const [activity] = await appendActivitiesInTransaction(db, [
        {
          controlRecordId: record.id,
          activityType: "discussion_reopened",
          actorId: actor.actorId,
          actorDisplayName: actor.actorDisplayName,
          metadataJson: commentMetadata(comment.id, comment.parentCommentId),
          createdAt: nextActivityTimestamp(),
        },
      ]);
      return { comment, activity, mentionedUserIds: [] };
    },
  };
}
