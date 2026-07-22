import type { ProjectRepository } from "@/persistence/repository";
import type {
  CreateProjectInput,
  ProjectLoadResult,
  ProjectSnapshot,
  ProjectSnapshotSummary,
  ProjectSummary,
  RestoreSnapshotResult,
  SaveProjectInput,
  SaveProjectResult,
  StoredProject,
} from "@/persistence/types";
import { requirePermission, type OrgContext } from "@/authz/authorize";

/**
 * Authorized, tenant-scoped project operations (Milestone 1 WP3/WP5).
 *
 * Every function requires an `OrgContext` resolved server-side from the
 * authenticated session (never client input) and enforces:
 *
 * 1. the role permission for the operation (fail closed), and
 * 2. that the target project belongs to the caller's organization.
 *
 * Cross-organization access to a known project id resolves to `not-found`
 * (existence is never leaked). This module is the security boundary that
 * Server Actions delegate to and that tenant-isolation tests exercise
 * directly.
 */

const NOT_FOUND: ProjectLoadResult = {
  ok: false,
  error: { kind: "not-found" },
};

/** Load a project only if it belongs to the context organization. */
async function loadOwned(
  repo: ProjectRepository,
  ctx: OrgContext,
  projectId: string,
): Promise<ProjectLoadResult> {
  const loaded = await repo.load(projectId);
  if (!loaded.ok) {
    return loaded;
  }
  if (loaded.project.organizationId !== ctx.organizationId) {
    return NOT_FOUND;
  }
  return loaded;
}

export async function listProjectsForOrg(
  repo: ProjectRepository,
  ctx: OrgContext,
): Promise<ProjectSummary[]> {
  requirePermission(ctx, ctx.organizationId, "project.read");
  return repo.list(ctx.organizationId);
}

export async function createProjectForOrg(
  repo: ProjectRepository,
  ctx: OrgContext,
  input: Omit<CreateProjectInput, "organizationId">,
): Promise<StoredProject> {
  requirePermission(ctx, ctx.organizationId, "project.create");
  return repo.create({ ...input, organizationId: ctx.organizationId });
}

export async function loadProjectForOrg(
  repo: ProjectRepository,
  ctx: OrgContext,
  projectId: string,
): Promise<ProjectLoadResult> {
  requirePermission(ctx, ctx.organizationId, "project.read");
  return loadOwned(repo, ctx, projectId);
}

export async function saveProjectForOrg(
  repo: ProjectRepository,
  ctx: OrgContext,
  input: SaveProjectInput,
): Promise<SaveProjectResult> {
  requirePermission(ctx, ctx.organizationId, "project.update");
  const owned = await loadOwned(repo, ctx, input.id);
  if (!owned.ok) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  return repo.save(input);
}

export async function renameProjectForOrg(
  repo: ProjectRepository,
  ctx: OrgContext,
  projectId: string,
  name: string,
): Promise<StoredProject | null> {
  requirePermission(ctx, ctx.organizationId, "project.update");
  const owned = await loadOwned(repo, ctx, projectId);
  if (!owned.ok) {
    return null;
  }
  return repo.rename(projectId, name);
}

export async function deleteProjectForOrg(
  repo: ProjectRepository,
  ctx: OrgContext,
  projectId: string,
): Promise<boolean> {
  requirePermission(ctx, ctx.organizationId, "project.delete");
  const owned = await loadOwned(repo, ctx, projectId);
  if (!owned.ok) {
    return false;
  }
  await repo.delete(projectId);
  return true;
}

export async function listSnapshotsForOrg(
  repo: ProjectRepository,
  ctx: OrgContext,
  projectId: string,
): Promise<ProjectSnapshotSummary[]> {
  requirePermission(ctx, ctx.organizationId, "project.read");
  const owned = await loadOwned(repo, ctx, projectId);
  if (!owned.ok) {
    return [];
  }
  return repo.listSnapshots(projectId);
}

export async function getSnapshotForOrg(
  repo: ProjectRepository,
  ctx: OrgContext,
  projectId: string,
  snapshotId: string,
): Promise<ProjectSnapshot | null> {
  requirePermission(ctx, ctx.organizationId, "project.read");
  const owned = await loadOwned(repo, ctx, projectId);
  if (!owned.ok) {
    return null;
  }
  return repo.getSnapshot(projectId, snapshotId);
}

export async function createNamedVersionForOrg(
  repo: ProjectRepository,
  ctx: OrgContext,
  input: { projectId: string; name: string; expectedRevision: number },
): Promise<
  | { ok: true; snapshot: ProjectSnapshotSummary }
  | { ok: false; reason: "not-found" | "conflict" | "validation"; message: string }
> {
  requirePermission(ctx, ctx.organizationId, "project.update");
  const owned = await loadOwned(repo, ctx, input.projectId);
  if (!owned.ok) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  return repo.createNamedVersion(input);
}

export async function restoreSnapshotForOrg(
  repo: ProjectRepository,
  ctx: OrgContext,
  input: { projectId: string; snapshotId: string; expectedRevision: number },
): Promise<RestoreSnapshotResult> {
  requirePermission(ctx, ctx.organizationId, "project.update");
  const owned = await loadOwned(repo, ctx, input.projectId);
  if (!owned.ok) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  return repo.restoreSnapshot(input);
}

export async function createAutomaticSnapshotForOrg(
  repo: ProjectRepository,
  ctx: OrgContext,
  projectId: string,
): Promise<ProjectSnapshotSummary | null> {
  requirePermission(ctx, ctx.organizationId, "project.update");
  const owned = await loadOwned(repo, ctx, projectId);
  if (!owned.ok) {
    return null;
  }
  return repo.createAutomaticSnapshotNow(projectId);
}
