import "server-only";

import type { ControlActivityRepository } from "./control-activity-repository";
import type { ControlRecordRepository } from "./control-record-repository";
import type { ControlRecordService } from "./control-record-service";
import type { ProjectRepository } from "./repository";
import { getDb } from "./postgres/client";
import { createPostgresControlActivityRepository } from "./postgres/control-activity-repository";
import { createPostgresControlRecordRepository } from "./postgres/control-record-repository";
import { createPostgresControlRecordService } from "./postgres/control-record-service";
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
