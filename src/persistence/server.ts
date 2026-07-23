import "server-only";

import type { AssignmentRepository } from "./assignment-repository";
import type { CommentRepository } from "./comment-repository";
import type { ControlActivityRepository } from "./control-activity-repository";
import type { ControlRecordRepository } from "./control-record-repository";
import type { ControlRecordService } from "./control-record-service";
import type { DiscussionService } from "./discussion-service";
import type { NotificationRepository } from "./notification-repository";
import type { ProjectRepository } from "./repository";
import { getDb } from "./postgres/client";
import { createPostgresAssignmentRepository } from "./postgres/assignment-repository";
import { createPostgresCommentRepository } from "./postgres/comment-repository";
import { createPostgresControlActivityRepository } from "./postgres/control-activity-repository";
import { createPostgresControlRecordRepository } from "./postgres/control-record-repository";
import { createPostgresControlRecordService } from "./postgres/control-record-service";
import { createPostgresDiscussionService } from "./postgres/discussion-service";
import { createPostgresNotificationRepository } from "./postgres/notification-repository";
import { createPostgresProjectRepository } from "./postgres/project-repository";

/** Default server-side repository bound to DATABASE_URL (PostgreSQL). */
export async function getProjectRepository(): Promise<ProjectRepository> {
  return createPostgresProjectRepository(await getDb());
}

/** ControlRecord persistence (application metadata; not OSCAL). */
export async function getControlRecordRepository(): Promise<ControlRecordRepository> {
  return createPostgresControlRecordRepository(await getDb());
}

/** Append-only ControlActivity stream. */
export async function getControlActivityRepository(): Promise<ControlActivityRepository> {
  return createPostgresControlActivityRepository(await getDb());
}

/**
 * ControlRecord writes coordinated with ControlActivity appends.
 * Prefer this over ControlRecordRepository for metadata saves.
 */
export async function getControlRecordService(): Promise<ControlRecordService> {
  return createPostgresControlRecordService(await getDb());
}

/** Threaded control discussion comments (Milestone 02A). */
export async function getCommentRepository(): Promise<CommentRepository> {
  return createPostgresCommentRepository(await getDb());
}

/** Control work assignments (Milestone 02A). */
export async function getAssignmentRepository(): Promise<AssignmentRepository> {
  return createPostgresAssignmentRepository(await getDb());
}

/** In-app notifications (Milestone 02A). */
export async function getNotificationRepository(): Promise<NotificationRepository> {
  return createPostgresNotificationRepository(await getDb());
}

/** Discussion service coordinating comments + activity (Milestone 02A). */
export async function getDiscussionService(): Promise<DiscussionService> {
  return createPostgresDiscussionService(await getDb());
}
