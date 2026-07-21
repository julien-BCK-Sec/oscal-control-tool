import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  buildStoredProjectDocumentV1,
  parseProjectDocumentJson,
  projectDocumentFingerprint,
  serializeProjectDocument,
} from "../document";
import type { ProjectRepository } from "../repository";
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
  SnapshotType,
  StoredProject,
  StoredProjectDocument,
} from "../types";
import { DEFAULT_PROJECT_METADATA } from "@/data/project";
import type { AppDatabase } from "./client";
import { projectSnapshots, projects } from "./schema";
import {
  shouldCreateAutomaticSnapshot,
  snapshotIdsToPrune,
  type SnapshotPolicyRow,
} from "./snapshot-policy";

function nowIso(): string {
  return new Date().toISOString();
}

function toStoredProject(
  row: typeof projects.$inferSelect,
  document: StoredProjectDocument,
): StoredProject {
  return {
    id: row.id,
    name: document.project.name,
    frameworkId: document.project.frameworkId,
    schemaVersion: document.schemaVersion,
    revision: row.revision,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    metadata: document.project.metadata,
    implementations: document.project.implementations,
  };
}

function toSnapshotSummary(
  row: typeof projectSnapshots.$inferSelect,
): ProjectSnapshotSummary {
  return {
    id: row.id,
    projectId: row.projectId,
    snapshotType: row.snapshotType as SnapshotType,
    name: row.name,
    projectRevision: row.projectRevision,
    createdAt: row.createdAt,
  };
}

function isValidSnapshotType(value: string): value is SnapshotType {
  return (
    value === "automatic" || value === "named" || value === "pre-restore"
  );
}

export function createSqliteProjectRepository(
  db: AppDatabase,
): ProjectRepository {
  const repository: ProjectRepository = {
    async create(input: CreateProjectInput): Promise<StoredProject> {
      const name = input.name.trim();
      if (!name) {
        throw new Error("Project name is required.");
      }
      const frameworkId = input.frameworkId.trim();
      if (!frameworkId) {
        throw new Error("frameworkId is required.");
      }

      const id = randomUUID();
      const createdAt = nowIso();
      const metadata = input.metadata ?? {
        ...DEFAULT_PROJECT_METADATA,
        organizationName: input.organizationName?.trim() ?? "",
        systemName: name,
      };
      const implementations = input.implementations ?? {};
      const document = buildStoredProjectDocumentV1({
        id,
        name,
        frameworkId,
        metadata,
        implementations,
      });

      await db.insert(projects).values({
        id,
        name,
        organizationName: metadata.organizationName,
        frameworkId,
        schemaVersion: document.schemaVersion,
        revision: 1,
        projectJson: serializeProjectDocument(document),
        createdAt,
        updatedAt: createdAt,
      });

      return {
        id,
        name,
        frameworkId,
        schemaVersion: document.schemaVersion,
        revision: 1,
        createdAt,
        updatedAt: createdAt,
        metadata: document.project.metadata,
        implementations: document.project.implementations,
      };
    },

    async list(): Promise<ProjectSummary[]> {
      const rows = await db
        .select()
        .from(projects)
        .orderBy(desc(projects.updatedAt));

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        organizationName: row.organizationName,
        frameworkId: row.frameworkId,
        schemaVersion: row.schemaVersion,
        revision: row.revision,
        updatedAt: row.updatedAt,
      }));
    },

    async load(projectId: string): Promise<ProjectLoadResult> {
      return loadRow(projectId);
    },

    async save(input: SaveProjectInput): Promise<SaveProjectResult> {
      return saveProject(input);
    },

    async rename(
      projectId: string,
      name: string,
    ): Promise<StoredProject | null> {
      const trimmed = name.trim();
      if (!trimmed) {
        return null;
      }

      const loaded = await loadRow(projectId);
      if (!loaded.ok) {
        return null;
      }

      const result = await saveProject({
        id: loaded.project.id,
        name: trimmed,
        frameworkId: loaded.project.frameworkId,
        metadata: {
          ...loaded.project.metadata,
          systemName:
            loaded.project.metadata.systemName.trim() === ""
              ? trimmed
              : loaded.project.metadata.systemName,
        },
        implementations: loaded.project.implementations,
        expectedRevision: loaded.project.revision,
      });

      return result.ok ? result.project : null;
    },

    async delete(projectId: string): Promise<void> {
      await db.delete(projects).where(eq(projects.id, projectId));
    },

    async listSnapshots(projectId: string): Promise<ProjectSnapshotSummary[]> {
      const rows = await db
        .select()
        .from(projectSnapshots)
        .where(eq(projectSnapshots.projectId, projectId))
        .orderBy(desc(projectSnapshots.createdAt));

      return rows
        .filter((row) => isValidSnapshotType(row.snapshotType))
        .map(toSnapshotSummary);
    },

    async getSnapshot(
      projectId: string,
      snapshotId: string,
    ): Promise<ProjectSnapshot | null> {
      return getSnapshot(projectId, snapshotId);
    },

    async createNamedVersion(input: CreateNamedVersionInput) {
      const name = input.name.trim();
      if (!name) {
        return {
          ok: false as const,
          reason: "validation" as const,
          message: "Version name is required.",
        };
      }

      const loaded = await loadRow(input.projectId);
      if (!loaded.ok) {
        return {
          ok: false as const,
          reason: "not-found" as const,
          message: "Project not found.",
        };
      }

      if (loaded.project.revision !== input.expectedRevision) {
        return {
          ok: false as const,
          reason: "conflict" as const,
          message:
            "This project was updated elsewhere. Reload before saving a version.",
        };
      }

      const document = buildStoredProjectDocumentV1({
        id: loaded.project.id,
        name: loaded.project.name,
        frameworkId: loaded.project.frameworkId,
        metadata: loaded.project.metadata,
        implementations: loaded.project.implementations,
      });

      const snapshot = await insertSnapshot({
        projectId: loaded.project.id,
        snapshotType: "named",
        name,
        document,
        projectRevision: loaded.project.revision,
      });

      return { ok: true as const, snapshot };
    },

    async createAutomaticSnapshot(projectId: string) {
      return createAutomaticSnapshotInternal(projectId, {
        respectThrottle: true,
      });
    },

    async createAutomaticSnapshotNow(projectId: string) {
      return createAutomaticSnapshotInternal(projectId, {
        respectThrottle: false,
      });
    },

    async restoreSnapshot(
      input: RestoreSnapshotInput,
    ): Promise<RestoreSnapshotResult> {
      const loaded = await loadRow(input.projectId);
      if (!loaded.ok) {
        return {
          ok: false,
          reason: "not-found",
          message: "Project not found.",
        };
      }

      if (loaded.project.revision !== input.expectedRevision) {
        return {
          ok: false,
          reason: "conflict",
          message:
            "This project was updated elsewhere. Reload before restoring.",
          currentRevision: loaded.project.revision,
        };
      }

      const snapshot = await getSnapshot(input.projectId, input.snapshotId);
      if (!snapshot) {
        return {
          ok: false,
          reason: "snapshot-not-found",
          message: "Snapshot not found.",
        };
      }

      const preDocument = buildStoredProjectDocumentV1({
        id: loaded.project.id,
        name: loaded.project.name,
        frameworkId: loaded.project.frameworkId,
        metadata: loaded.project.metadata,
        implementations: loaded.project.implementations,
      });

      const preRestore = await insertSnapshot({
        projectId: loaded.project.id,
        snapshotType: "pre-restore",
        name: `Before restore (${new Date().toISOString()})`,
        document: preDocument,
        projectRevision: loaded.project.revision,
      });

      const restoredName =
        snapshot.document.project.name.trim() || loaded.project.name;
      const saveResult = await saveProject({
        id: loaded.project.id,
        name: restoredName,
        frameworkId: snapshot.document.project.frameworkId,
        metadata: snapshot.document.project.metadata,
        implementations: snapshot.document.project.implementations,
        expectedRevision: loaded.project.revision,
      });

      if (!saveResult.ok) {
        return {
          ok: false,
          reason: saveResult.reason,
          message: saveResult.message,
          currentRevision: saveResult.currentRevision,
        };
      }

      return {
        ok: true,
        project: saveResult.project,
        preRestoreSnapshotId: preRestore.id,
      };
    },
  };

  async function loadRow(projectId: string): Promise<ProjectLoadResult> {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return { ok: false, error: { kind: "not-found" } };
    }

    const parsed = parseProjectDocumentJson(row.projectJson);
    if (!parsed.ok) {
      if (parsed.error.kind === "unsupported-schema") {
        return {
          ok: false,
          error: {
            kind: "unsupported-schema",
            schemaVersion: parsed.error.schemaVersion,
          },
        };
      }
      return {
        ok: false,
        error: {
          kind: "corrupt",
          message: parsed.error.message,
        },
      };
    }

    if (parsed.document.project.id !== row.id) {
      return {
        ok: false,
        error: {
          kind: "corrupt",
          message: "Document project id does not match row id.",
        },
      };
    }

    return { ok: true, project: toStoredProject(row, parsed.document) };
  }

  async function saveProject(input: SaveProjectInput): Promise<SaveProjectResult> {
    const name = input.name.trim();
    if (!name) {
      return {
        ok: false,
        reason: "validation",
        message: "Project name is required.",
      };
    }
    if (!input.frameworkId.trim()) {
      return {
        ok: false,
        reason: "validation",
        message: "frameworkId is required.",
      };
    }

    const document = buildStoredProjectDocumentV1({
      id: input.id,
      name,
      frameworkId: input.frameworkId.trim(),
      metadata: input.metadata,
      implementations: input.implementations,
    });

    const validated = parseProjectDocumentJson(
      serializeProjectDocument(document),
    );
    if (!validated.ok) {
      return {
        ok: false,
        reason: "validation",
        message:
          validated.error.kind === "unsupported-schema"
            ? `Unsupported schema version ${validated.error.schemaVersion}.`
            : validated.error.message,
      };
    }

    const existing = await db
      .select()
      .from(projects)
      .where(eq(projects.id, input.id))
      .limit(1);
    const row = existing[0];
    if (!row) {
      return {
        ok: false,
        reason: "not-found",
        message: "Project not found.",
      };
    }

    if (row.revision !== input.expectedRevision) {
      return {
        ok: false,
        reason: "conflict",
        message:
          "This project was updated elsewhere. Reload the latest version to continue.",
        currentRevision: row.revision,
      };
    }

    const updatedAt = nowIso();
    const nextRevision = row.revision + 1;

    const updated = await db
      .update(projects)
      .set({
        name: validated.document.project.name,
        organizationName: validated.document.project.metadata.organizationName,
        frameworkId: validated.document.project.frameworkId,
        schemaVersion: validated.document.schemaVersion,
        revision: nextRevision,
        projectJson: serializeProjectDocument(validated.document),
        updatedAt,
      })
      .where(
        and(
          eq(projects.id, input.id),
          eq(projects.revision, input.expectedRevision),
        ),
      )
      .returning({ id: projects.id });

    if (updated.length === 0) {
      const again = await loadRow(input.id);
      return {
        ok: false,
        reason: "conflict",
        message:
          "This project was updated elsewhere. Reload the latest version to continue.",
        currentRevision: again.ok ? again.project.revision : undefined,
      };
    }

    const after = await loadRow(input.id);
    if (!after.ok) {
      return {
        ok: false,
        reason: "not-found",
        message: "Project disappeared during save.",
      };
    }

    return { ok: true, project: after.project };
  }

  async function getSnapshot(
    projectId: string,
    snapshotId: string,
  ): Promise<ProjectSnapshot | null> {
    const rows = await db
      .select()
      .from(projectSnapshots)
      .where(
        and(
          eq(projectSnapshots.id, snapshotId),
          eq(projectSnapshots.projectId, projectId),
        ),
      )
      .limit(1);
    const row = rows[0];
    if (!row || !isValidSnapshotType(row.snapshotType)) {
      return null;
    }

    const parsed = parseProjectDocumentJson(row.projectJson);
    if (!parsed.ok) {
      return null;
    }

    return {
      ...toSnapshotSummary(row),
      document: parsed.document,
    };
  }

  async function insertSnapshot(input: {
    projectId: string;
    snapshotType: SnapshotType;
    name: string | null;
    document: StoredProjectDocument;
    projectRevision: number;
    createdAt?: string;
  }): Promise<ProjectSnapshotSummary> {
    const id = randomUUID();
    const createdAt = input.createdAt ?? nowIso();
    const fingerprint = projectDocumentFingerprint(input.document);

    await db.insert(projectSnapshots).values({
      id,
      projectId: input.projectId,
      snapshotType: input.snapshotType,
      name: input.name,
      projectJson: serializeProjectDocument(input.document),
      projectRevision: input.projectRevision,
      contentFingerprint: fingerprint,
      createdAt,
    });

    await pruneSnapshots(input.projectId);

    return {
      id,
      projectId: input.projectId,
      snapshotType: input.snapshotType,
      name: input.name,
      projectRevision: input.projectRevision,
      createdAt,
    };
  }

  async function pruneSnapshots(projectId: string): Promise<void> {
    const rows = await db
      .select({
        id: projectSnapshots.id,
        snapshotType: projectSnapshots.snapshotType,
        contentFingerprint: projectSnapshots.contentFingerprint,
        createdAt: projectSnapshots.createdAt,
      })
      .from(projectSnapshots)
      .where(eq(projectSnapshots.projectId, projectId));

    const policyRows: SnapshotPolicyRow[] = rows
      .filter((row) => isValidSnapshotType(row.snapshotType))
      .map((row) => ({
        id: row.id,
        snapshotType: row.snapshotType as SnapshotType,
        contentFingerprint: row.contentFingerprint,
        createdAt: row.createdAt,
      }));

    const deleteIds = snapshotIdsToPrune({ snapshots: policyRows });
    for (const id of deleteIds) {
      await db.delete(projectSnapshots).where(eq(projectSnapshots.id, id));
    }
  }

  async function createAutomaticSnapshotInternal(
    projectId: string,
    options: { respectThrottle: boolean },
  ): Promise<ProjectSnapshotSummary | null> {
    const loaded = await loadRow(projectId);
    if (!loaded.ok) {
      return null;
    }

    const document = buildStoredProjectDocumentV1({
      id: loaded.project.id,
      name: loaded.project.name,
      frameworkId: loaded.project.frameworkId,
      metadata: loaded.project.metadata,
      implementations: loaded.project.implementations,
    });
    const fingerprint = projectDocumentFingerprint(document);

    const autoRows = await db
      .select({
        id: projectSnapshots.id,
        snapshotType: projectSnapshots.snapshotType,
        contentFingerprint: projectSnapshots.contentFingerprint,
        createdAt: projectSnapshots.createdAt,
      })
      .from(projectSnapshots)
      .where(
        and(
          eq(projectSnapshots.projectId, projectId),
          eq(projectSnapshots.snapshotType, "automatic"),
        ),
      );

    const existingAutomatic: SnapshotPolicyRow[] = autoRows.map((row) => ({
      id: row.id,
      snapshotType: "automatic" as const,
      contentFingerprint: row.contentFingerprint,
      createdAt: row.createdAt,
    }));

    if (options.respectThrottle) {
      if (
        !shouldCreateAutomaticSnapshot({
          nowMs: Date.now(),
          contentFingerprint: fingerprint,
          existingAutomatic,
        })
      ) {
        return null;
      }
    } else {
      const newest = [...existingAutomatic].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      )[0];
      if (newest && newest.contentFingerprint === fingerprint) {
        return null;
      }
    }

    return insertSnapshot({
      projectId,
      snapshotType: "automatic",
      name: null,
      document,
      projectRevision: loaded.project.revision,
    });
  }

  return repository;
}
