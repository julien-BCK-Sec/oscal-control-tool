import type { ControlImplementation } from "@/data/implementation";
import type { ProjectMetadata, ProjectMetadataInput } from "@/data/project";

/** Current persisted project document schema version. */
export const PROJECT_DOCUMENT_SCHEMA_VERSION = 2 as const;

export type StoredProjectCore = {
  id: string;
  name: string;
  frameworkId: string;
  metadata: ProjectMetadata;
  implementations: Record<string, ControlImplementation>;
};

/**
 * Historical v1 envelope. Metadata in v1 files only has the original three
 * strings; parsers migrate those into the v2 metadata shape.
 */
export type StoredProjectDocumentV1 = {
  schemaVersion: 1;
  project: {
    id: string;
    name: string;
    frameworkId: string;
    metadata: {
      systemName: string;
      organizationName: string;
      systemDescription: string;
    };
    implementations: Record<string, ControlImplementation>;
  };
};

export type StoredProjectDocumentV2 = {
  schemaVersion: 2;
  project: StoredProjectCore;
};

/**
 * Versioned envelope stored in projects.project_json and snapshot rows.
 * Load/migrate always yields the current schema version.
 */
export type StoredProjectDocument = StoredProjectDocumentV2;

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
  metadata?: ProjectMetadataInput;
  implementations?: Record<string, ControlImplementation>;
};

export type SaveProjectInput = {
  id: string;
  name: string;
  /**
   * Ignored when present. Framework identity is server-owned
   * `projects.framework_id` and is not changed by save (ADR-026).
   * New callers should omit this field.
   */
  frameworkId?: string;
  metadata: ProjectMetadataInput;
  implementations: Record<string, ControlImplementation>;
  /** Must match the current database revision or save returns conflict. */
  expectedRevision: number;
};

export type LoadProjectError =
  | { kind: "not-found" }
  | { kind: "corrupt"; message: string }
  | { kind: "unsupported-schema"; schemaVersion: number }
  | { kind: "unknown-framework"; frameworkId: string; message: string };

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
