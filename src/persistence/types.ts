import type { ControlImplementation } from "@/data/implementation";
import type { ProjectMetadata } from "@/data/project";

/** Current persisted project document schema version. */
export const PROJECT_DOCUMENT_SCHEMA_VERSION = 1 as const;

/**
 * Versioned envelope stored in projects.project_json and snapshot rows.
 * Does not include framework control text.
 */
export type StoredProjectDocumentV1 = {
  schemaVersion: 1;
  project: {
    id: string;
    name: string;
    frameworkId: string;
    metadata: ProjectMetadata;
    implementations: Record<string, ControlImplementation>;
  };
};

export type StoredProjectDocument = StoredProjectDocumentV1;

/** Fully loaded project row as an application DTO (no Drizzle/SQLite types). */
export type StoredProject = {
  id: string;
  name: string;
  /**
   * Owning organization tenant boundary (ADR-016). Always set for PostgreSQL
   * projects; `null` only for legacy SQLite rows read through the cutover
   * tooling, which the authenticated application never serves.
   */
  organizationId: string | null;
  frameworkId: string;
  schemaVersion: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  metadata: ProjectMetadata;
  implementations: Record<string, ControlImplementation>;
};

export type ProjectSummary = {
  id: string;
  name: string;
  organizationId: string | null;
  organizationName: string;
  frameworkId: string;
  schemaVersion: number;
  revision: number;
  updatedAt: string;
};

export type CreateProjectInput = {
  name: string;
  /**
   * Owning organization. Required at runtime by the PostgreSQL repository
   * (tenant boundary); optional in the type only so legacy SQLite tooling and
   * repository unit-test helpers can operate without organization context.
   */
  organizationId?: string;
  organizationName?: string;
  frameworkId: string;
  metadata?: ProjectMetadata;
  implementations?: Record<string, ControlImplementation>;
};

export type SaveProjectInput = {
  id: string;
  name: string;
  frameworkId: string;
  metadata: ProjectMetadata;
  implementations: Record<string, ControlImplementation>;
  /** Must match the current database revision or save returns conflict. */
  expectedRevision: number;
};

export type LoadProjectError =
  | { kind: "not-found" }
  | { kind: "corrupt"; message: string }
  | { kind: "unsupported-schema"; schemaVersion: number };

export type ProjectLoadResult =
  | { ok: true; project: StoredProject }
  | { ok: false; error: LoadProjectError };

export type SaveProjectResult =
  | { ok: true; project: StoredProject }
  | {
      ok: false;
      reason: "not-found" | "conflict" | "validation";
      message: string;
      currentRevision?: number;
    };

export type SnapshotType = "automatic" | "named" | "pre-restore";

export type ProjectSnapshotSummary = {
  id: string;
  projectId: string;
  snapshotType: SnapshotType;
  name: string | null;
  projectRevision: number;
  createdAt: string;
};

export type ProjectSnapshot = ProjectSnapshotSummary & {
  document: StoredProjectDocument;
};

export type CreateNamedVersionInput = {
  projectId: string;
  name: string;
  /** Named versions capture the current DB document at this revision. */
  expectedRevision: number;
};

export type RestoreSnapshotInput = {
  projectId: string;
  snapshotId: string;
  expectedRevision: number;
};

export type RestoreSnapshotResult =
  | { ok: true; project: StoredProject; preRestoreSnapshotId: string }
  | {
      ok: false;
      reason: "not-found" | "conflict" | "validation" | "snapshot-not-found";
      message: string;
      currentRevision?: number;
    };
