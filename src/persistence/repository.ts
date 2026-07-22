import type {
  CreateNamedVersionInput,
  CreateProjectInput,
  ProjectLoadResult,
  ProjectSnapshot,
  ProjectSnapshotSummary,
  ProjectSummary,
  RestoreSnapshotInput,
  RestoreSnapshotResult,
  SaveProjectInput,
  SaveProjectResult,
  StoredProject,
} from "./types";

/**
 * Application-facing persistence boundary.
 * UI and domain code must not depend on Drizzle or SQLite types.
 */
export interface ProjectRepository {
  create(input: CreateProjectInput): Promise<StoredProject>;
  /**
   * List projects. When `organizationId` is provided, only projects owned by
   * that organization are returned (tenant boundary). Omitting it lists every
   * project and is reserved for system tooling (migration, seed, tests) — the
   * authenticated application always scopes by organization.
   */
  list(organizationId?: string): Promise<ProjectSummary[]>;
  load(projectId: string): Promise<ProjectLoadResult>;
  save(input: SaveProjectInput): Promise<SaveProjectResult>;
  rename(projectId: string, name: string): Promise<StoredProject | null>;
  delete(projectId: string): Promise<void>;

  listSnapshots(projectId: string): Promise<ProjectSnapshotSummary[]>;
  getSnapshot(
    projectId: string,
    snapshotId: string,
  ): Promise<ProjectSnapshot | null>;
  createNamedVersion(
    input: CreateNamedVersionInput,
  ): Promise<
    | { ok: true; snapshot: ProjectSnapshotSummary }
    | { ok: false; reason: "not-found" | "conflict" | "validation"; message: string }
  >;
  createAutomaticSnapshot(
    projectId: string,
  ): Promise<ProjectSnapshotSummary | null>;
  /**
   * Explicit user-triggered automatic snapshot: skips the 5-minute throttle
   * but still skips when content is unchanged since the last automatic snapshot.
   */
  createAutomaticSnapshotNow(
    projectId: string,
  ): Promise<ProjectSnapshotSummary | null>;
  restoreSnapshot(input: RestoreSnapshotInput): Promise<RestoreSnapshotResult>;
}
