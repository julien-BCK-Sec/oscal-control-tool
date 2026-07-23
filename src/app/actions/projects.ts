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
import type { ProjectRepository } from "@/persistence/repository";
import { AuthorizationError, type OrgContext } from "@/authz/authorize";
import {
  getSessionUser,
  resolveDefaultOrganizationId,
  resolveOrgContext,
} from "@/auth/context";
import {
  createAutomaticSnapshotForOrg,
  createNamedVersionForOrg,
  createProjectForOrg,
  deleteProjectForOrg,
  listProjectsForOrg,
  listSnapshotsForOrg,
  loadProjectForOrg,
  renameProjectForOrg,
  restoreSnapshotForOrg,
  saveProjectForOrg,
} from "@/server/authorized-projects";

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

/** Resolve the org context for the current session, defaulting to active org. */
async function requireDefaultOrgContext(): Promise<OrgContext> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthorizationError("unauthenticated", "Authentication is required.");
  }
  const organizationId = await resolveDefaultOrganizationId(user.id);
  if (!organizationId) {
    throw new AuthorizationError(
      "forbidden",
      "You do not belong to any organization.",
    );
  }
  const ctx = await resolveOrgContext(user.id, organizationId);
  if (!ctx) {
    throw new AuthorizationError("forbidden", "No organization membership.");
  }
  return ctx;
}

/**
 * Resolve the org context for the organization that owns `projectId`. Returns
 * null (fail closed) when the project does not exist, is in another
 * organization, or the user is not a member.
 */
async function resolveProjectOrgContext(
  repo: ProjectRepository,
  projectId: string,
): Promise<OrgContext | null> {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }
  const loaded = await repo.load(projectId);
  if (!loaded.ok || !loaded.project.organizationId) {
    return null;
  }
  return resolveOrgContext(user.id, loaded.project.organizationId);
}

export async function listProjectsAction(): Promise<ProjectSummary[]> {
  const ctx = await requireDefaultOrgContext();
  return listProjectsForOrg(await getProjectRepository(), ctx);
}

export async function createProjectAction(input: {
  name: string;
  organizationName?: string;
  metadata?: unknown;
  implementations?: unknown;
}): Promise<StoredProject> {
  const ctx = await requireDefaultOrgContext();
  const name = requireNonEmptyString(input.name, "name");
  const metadata =
    input.metadata === undefined
      ? undefined
      : isProjectMetadata(input.metadata)
        ? input.metadata
        : (() => {
            throw new Error("Invalid project metadata.");
          })();

  return createProjectForOrg(await getProjectRepository(), ctx, {
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
  const repo = await getProjectRepository();
  const ctx = await resolveProjectOrgContext(repo, id);
  if (!ctx) {
    return { ok: false, error: { kind: "not-found" } };
  }
  return loadProjectForOrg(repo, ctx, id);
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

  const repo = await getProjectRepository();
  const ctx = await resolveProjectOrgContext(repo, id);
  if (!ctx) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }

  const result = await saveProjectForOrg(repo, ctx, {
    id,
    name,
    frameworkId,
    metadata: input.metadata,
    implementations,
    expectedRevision: input.expectedRevision,
  });

  if (result.ok) {
    await createAutomaticSnapshotForOrg(repo, ctx, id);
  }

  return result;
}

export async function renameProjectAction(
  projectId: string,
  name: string,
): Promise<StoredProject | null> {
  const id = requireNonEmptyString(projectId, "projectId");
  const nextName = requireNonEmptyString(name, "name");
  const repo = await getProjectRepository();
  const ctx = await resolveProjectOrgContext(repo, id);
  if (!ctx) {
    return null;
  }
  return renameProjectForOrg(repo, ctx, id, nextName);
}

export async function deleteProjectAction(projectId: string): Promise<void> {
  const id = requireNonEmptyString(projectId, "projectId");
  const repo = await getProjectRepository();
  const ctx = await resolveProjectOrgContext(repo, id);
  if (!ctx) {
    return;
  }
  await deleteProjectForOrg(repo, ctx, id);
}

export async function listSnapshotsAction(
  projectId: string,
): Promise<ProjectSnapshotSummary[]> {
  const id = requireNonEmptyString(projectId, "projectId");
  const repo = await getProjectRepository();
  const ctx = await resolveProjectOrgContext(repo, id);
  if (!ctx) {
    return [];
  }
  return listSnapshotsForOrg(repo, ctx, id);
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

  const repo = await getProjectRepository();
  const ctx = await resolveProjectOrgContext(repo, projectId);
  if (!ctx) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }

  return createNamedVersionForOrg(repo, ctx, {
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

  const repo = await getProjectRepository();
  const ctx = await resolveProjectOrgContext(repo, projectId);
  if (!ctx) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }

  return restoreSnapshotForOrg(repo, ctx, {
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
  const repo = await getProjectRepository();
  const ctx = await resolveProjectOrgContext(repo, id);
  if (!ctx) {
    return null;
  }
  return createAutomaticSnapshotForOrg(repo, ctx, id);
}
