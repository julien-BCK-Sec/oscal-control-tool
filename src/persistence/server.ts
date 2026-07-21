import "server-only";

import { getDb } from "./sqlite/client";
import { createSqliteProjectRepository } from "./sqlite/project-repository";
import type { ProjectRepository } from "./repository";

/** Default server-side repository bound to DATABASE_PATH. */
export function getProjectRepository(): ProjectRepository {
  return createSqliteProjectRepository(getDb());
}
