import "server-only";

import type { ControlActivityRepository } from "./control-activity-repository";
import type { ControlRecordRepository } from "./control-record-repository";
import type { ControlRecordService } from "./control-record-service";
import type { ProjectRepository } from "./repository";
import { getDb } from "./sqlite/client";
import { createSqliteControlActivityRepository } from "./sqlite/control-activity-repository";
import { createSqliteControlRecordRepository } from "./sqlite/control-record-repository";
import { createSqliteControlRecordService } from "./sqlite/control-record-service";
import { createSqliteProjectRepository } from "./sqlite/project-repository";

/** Default server-side repository bound to DATABASE_PATH. */
export function getProjectRepository(): ProjectRepository {
  return createSqliteProjectRepository(getDb());
}

/** ControlRecord persistence (application metadata; not OSCAL). */
export function getControlRecordRepository(): ControlRecordRepository {
  return createSqliteControlRecordRepository(getDb());
}

/** Append-only ControlActivity stream. */
export function getControlActivityRepository(): ControlActivityRepository {
  return createSqliteControlActivityRepository(getDb());
}

/**
 * ControlRecord writes coordinated with ControlActivity appends.
 * Prefer this over ControlRecordRepository for metadata saves.
 */
export function getControlRecordService(): ControlRecordService {
  return createSqliteControlRecordService(getDb());
}
