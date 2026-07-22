import type { ProjectRepository } from "../repository";
import type { CreateProjectInput, StoredProject } from "../types";
import type { AppDatabase } from "./client";
import { createPostgresProjectRepository } from "./project-repository";

/**
 * Default organization id used by persistence unit tests that only need a
 * project as a foreign-key parent and do not exercise tenancy. Tenant
 * isolation tests pass explicit organization ids instead.
 */
export const TEST_ORGANIZATION_ID = "org-test-default";

/**
 * Project repository for tests: identical to the production PostgreSQL
 * repository, but `create` defaults `organizationId` when a test does not
 * provide one (the column is NOT NULL and the repository requires it). An
 * explicit `organizationId` in the input still takes precedence.
 */
export function createTestProjectRepository(
  db: AppDatabase,
  defaultOrganizationId: string = TEST_ORGANIZATION_ID,
): ProjectRepository {
  const base = createPostgresProjectRepository(db);
  return {
    ...base,
    create(input: CreateProjectInput): Promise<StoredProject> {
      return base.create({ organizationId: defaultOrganizationId, ...input });
    },
  };
}
