"use server";

import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { isControlImplementation } from "@/data/implementation";
import { isProjectMetadata } from "@/data/project";
import { getProjectRepository } from "@/persistence/server";
import type {
  CreateProjectInput,
  ProjectLoadResult,
  ProjectSnapshotSummary,
  ProjectSummary,
  RestoreSnapshotResult,
  SaveProjectInput,
  SaveProjectResult,
  StoredProject,
} from "@/persistence/types";

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

function parseImplementations(
  value: unknown,
): CreateProjectInput["implementations"] {
  if (value === undefined) {
    return {};
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("implementations must be an object.");
  }
  const result: NonNullable<CreateProjectInput["implementations"]> = {};
  for (const [controlId, entry] of Object.entries(value)) {
    if (typeof controlId !== "string" || controlId.trim() === "") {
      throw new Error("Invalid control id in implementations.");
    }
    if (!isControlImplementation(entry)) {
      throw new Error(`Invalid implementation for ${controlId}.`);
    }
    result[controlId] = {
      status: entry.status,
      narrative: entry.narrative,
    };
  }
  return result;
}

export async function listProjectsAction(): Promise<ProjectSummary[]> {
  return getProjectRepository().list();
}

export async function createProjectAction(input: {
  name: string;
  organizationName?: string;
  metadata?: unknown;
  implementations?: unknown;
}): Promise<StoredProject> {
  const name = requireNonEmptyString(input.name, "name");
  const metadata =
    input.metadata === undefined
      ? undefined
      : isProjectMetadata(input.metadata)
        ? input.metadata
        : (() => {
            throw new Error("Invalid project metadata.");
          })();

  return getProjectRepository().create({
    name,
    organizationName:
      typeof input.organizationName === "string"
        ? input.organizationName
        : undefined,
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    metadata,
    implementations: parseImplementations(input.implementations),
  });
}

export async function loadProjectAction(
  projectId: string,
): Promise<ProjectLoadResult> {
  const id = requireNonEmptyString(projectId, "projectId");
  return getProjectRepository().load(id);
}

export async function saveProjectAction(
  input: SaveProjectInput,
): Promise<SaveProjectResult> {
  const id = requireNonEmptyString(input.id, "id");
  const name = requireNonEmptyString(input.name, "name");
  const frameworkId = requireNonEmptyString(input.frameworkId, "frameworkId");
  if (!isProjectMetadata(input.metadata)) {
    return {
      ok: false,
      reason: "validation",
      message: "Invalid project metadata.",
    };
  }
  let implementations: SaveProjectInput["implementations"];
  try {
    implementations = parseImplementations(input.implementations) ?? {};
  } catch (error) {
    return {
      ok: false,
      reason: "validation",
      message: error instanceof Error ? error.message : "Invalid implementations.",
    };
  }

  if (
    typeof input.expectedRevision !== "number" ||
    !Number.isInteger(input.expectedRevision) ||
    input.expectedRevision < 1
  ) {
    return {
      ok: false,
      reason: "validation",
      message: "expectedRevision must be a positive integer.",
    };
  }

  const result = await getProjectRepository().save({
    id,
    name,
    frameworkId,
    metadata: input.metadata,
    implementations,
    expectedRevision: input.expectedRevision,
  });

  if (result.ok) {
    await getProjectRepository().createAutomaticSnapshot(id);
  }

  return result;
}

export async function renameProjectAction(
  projectId: string,
  name: string,
): Promise<StoredProject | null> {
  const id = requireNonEmptyString(projectId, "projectId");
  const nextName = requireNonEmptyString(name, "name");
  return getProjectRepository().rename(id, nextName);
}

export async function deleteProjectAction(projectId: string): Promise<void> {
  const id = requireNonEmptyString(projectId, "projectId");
  await getProjectRepository().delete(id);
}

export async function listSnapshotsAction(
  projectId: string,
): Promise<ProjectSnapshotSummary[]> {
  const id = requireNonEmptyString(projectId, "projectId");
  return getProjectRepository().listSnapshots(id);
}

export async function createNamedVersionAction(input: {
  projectId: string;
  name: string;
  expectedRevision: number;
}): Promise<
  | { ok: true; snapshot: ProjectSnapshotSummary }
  | { ok: false; reason: string; message: string }
> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const name = requireNonEmptyString(input.name, "name");
  if (
    typeof input.expectedRevision !== "number" ||
    !Number.isInteger(input.expectedRevision)
  ) {
    return {
      ok: false,
      reason: "validation",
      message: "expectedRevision must be an integer.",
    };
  }

  return getProjectRepository().createNamedVersion({
    projectId,
    name,
    expectedRevision: input.expectedRevision,
  });
}

export async function restoreSnapshotAction(input: {
  projectId: string;
  snapshotId: string;
  expectedRevision: number;
}): Promise<RestoreSnapshotResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const snapshotId = requireNonEmptyString(input.snapshotId, "snapshotId");
  if (
    typeof input.expectedRevision !== "number" ||
    !Number.isInteger(input.expectedRevision)
  ) {
    return {
      ok: false,
      reason: "validation",
      message: "expectedRevision must be an integer.",
    };
  }

  return getProjectRepository().restoreSnapshot({
    projectId,
    snapshotId,
    expectedRevision: input.expectedRevision,
  });
}

/** Explicit automatic snapshot (skips time throttle; still dedupes identical content). */
export async function createAutomaticSnapshotAction(
  projectId: string,
): Promise<ProjectSnapshotSummary | null> {
  const id = requireNonEmptyString(projectId, "projectId");
  return getProjectRepository().createAutomaticSnapshotNow(id);
}

export async function importLegacyProjectAction(input: {
  name: string;
  metadata: unknown;
  implementations: unknown;
}): Promise<StoredProject> {
  const name = requireNonEmptyString(input.name, "name");
  if (!isProjectMetadata(input.metadata)) {
    throw new Error("Invalid legacy project metadata.");
  }
  const implementations = parseImplementations(input.implementations) ?? {};

  return getProjectRepository().create({
    name,
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    metadata: input.metadata,
    implementations,
  });
}
