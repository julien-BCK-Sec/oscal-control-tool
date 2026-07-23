import type { ActorIdentity } from "@/persistence/actor";
import type { ProjectRepository } from "@/persistence/repository";
import type { ControlActivityRepository } from "@/persistence/control-activity-repository";
import type { ControlRecordRepository } from "@/persistence/control-record-repository";
import type {
  ControlRecordService,
  TransitionReviewStatusInput,
  TransitionReviewStatusResult,
} from "@/persistence/control-record-service";
import type { ControlActivity } from "@/data/control-activity";
import type {
  ControlRecord,
  UpsertControlRecordInput,
} from "@/data/control-record";
import { requirePermission, type OrgContext } from "@/authz/authorize";
import { reviewActionPermission } from "@/authz/permissions";

/**
 * Authorized, tenant-scoped control-record and review-workflow operations
 * (Milestone 1 WP5). Every function verifies the project belongs to the
 * caller's organization and enforces the role permission before touching the
 * ControlRecord service. Review transitions are gated per action via the
 * central RBAC matrix (viewers cannot mutate; authors cannot approve;
 * reviewers cannot author).
 */

async function projectBelongsToOrg(
  projectRepo: ProjectRepository,
  ctx: OrgContext,
  projectId: string,
): Promise<boolean> {
  const loaded = await projectRepo.load(projectId);
  return loaded.ok && loaded.project.organizationId === ctx.organizationId;
}

export async function listControlRecordsForOrg(
  projectRepo: ProjectRepository,
  controlRecordRepo: ControlRecordRepository,
  ctx: OrgContext,
  projectId: string,
): Promise<ControlRecord[]> {
  requirePermission(ctx, ctx.organizationId, "project.read");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return [];
  }
  return controlRecordRepo.listByProject(projectId);
}

export async function upsertControlRecordsForOrg(
  projectRepo: ProjectRepository,
  service: ControlRecordService,
  ctx: OrgContext,
  projectId: string,
  inputs: UpsertControlRecordInput[],
  actor: ActorIdentity,
): Promise<
  | { ok: true; records: ControlRecord[] }
  | { ok: false; reason: "not-found"; message: string }
> {
  requirePermission(ctx, ctx.organizationId, "control.edit_metadata");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  const results = await service.upsertManyWithActivity(projectId, inputs, actor);
  return { ok: true, records: results.map((result) => result.record) };
}

export async function transitionReviewForOrg(
  projectRepo: ProjectRepository,
  service: ControlRecordService,
  ctx: OrgContext,
  input: TransitionReviewStatusInput,
  actor: ActorIdentity,
): Promise<TransitionReviewStatusResult> {
  requirePermission(
    ctx,
    ctx.organizationId,
    reviewActionPermission(input.action),
  );
  if (!(await projectBelongsToOrg(projectRepo, ctx, input.projectId))) {
    return {
      ok: false,
      reason: "not-found",
      message: "Project not found.",
    };
  }
  return service.transitionReviewStatus(input, actor);
}

export async function listControlActivitiesForOrg(
  projectRepo: ProjectRepository,
  controlRecordRepo: ControlRecordRepository,
  activityRepo: ControlActivityRepository,
  ctx: OrgContext,
  projectId: string,
  controlId: string,
  options?: { limit?: number; beforeCreatedAt?: string },
): Promise<ControlActivity[]> {
  requirePermission(ctx, ctx.organizationId, "project.read");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return [];
  }
  const record = await controlRecordRepo.getByProjectAndControl(
    projectId,
    controlId,
  );
  if (!record) {
    return [];
  }
  return activityRepo.listByControlRecordId(record.id, options);
}
