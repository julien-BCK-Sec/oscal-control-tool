import type { ActorIdentity } from "@/persistence/actor";
import type { ProjectRepository } from "@/persistence/repository";
import type { EvidenceService } from "@/persistence/evidence-service";
import type { EvidenceVersionService } from "@/persistence/evidence-version-service";
import type {
  CreateEvidenceInput,
  EvidenceVersion,
  EvidenceWithControlIds,
  ListEvidenceOptions,
  SearchEvidenceInput,
  SearchEvidencePage,
  UpdateEvidenceInput,
  ValidatedUpload,
} from "@/data/evidence";
import { requirePermission, type OrgContext } from "@/authz/authorize";
import {
  evidenceArchivedEvent,
  evidenceCreatedEvent,
  evidenceLinkedEvent,
  evidenceUnlinkedEvent,
  evidenceUpdatedEvent,
  evidenceVersionUploadedEvent,
} from "@/domain/events";
import { publishDomainEvent, publishDomainEvents } from "./publish-domain-event";
import type {
  EvidenceVersionDownloadResult,
  EvidenceVersionUploadResult,
} from "@/persistence/evidence-version-service";

/**
 * Authorized, tenant-scoped Evidence operations (Milestone 03A).
 * Every function verifies the project belongs to the caller's organization
 * and enforces evidence.* permissions before touching the service.
 */

async function projectBelongsToOrg(
  projectRepo: ProjectRepository,
  ctx: OrgContext,
  projectId: string,
): Promise<boolean> {
  const loaded = await projectRepo.load(projectId);
  return loaded.ok && loaded.project.organizationId === ctx.organizationId;
}

export type EvidenceActionResult =
  | { ok: true; evidence: EvidenceWithControlIds }
  | {
      ok: false;
      reason: "not-found" | "validation" | "not-deletable" | "archived";
      message: string;
    };

export async function listEvidenceForOrg(
  projectRepo: ProjectRepository,
  service: EvidenceService,
  ctx: OrgContext,
  projectId: string,
  options?: ListEvidenceOptions,
): Promise<EvidenceWithControlIds[]> {
  requirePermission(ctx, ctx.organizationId, "evidence.read");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return [];
  }
  return service.listByProject(projectId, options);
}

export async function searchEvidenceForOrg(
  projectRepo: ProjectRepository,
  service: EvidenceService,
  ctx: OrgContext,
  input: SearchEvidenceInput,
): Promise<SearchEvidencePage> {
  requirePermission(ctx, ctx.organizationId, "evidence.read");
  if (!(await projectBelongsToOrg(projectRepo, ctx, input.projectId))) {
    return { items: [], nextCursor: null, hasMore: false };
  }
  return service.search(input);
}

export async function getEvidenceForOrg(
  projectRepo: ProjectRepository,
  service: EvidenceService,
  ctx: OrgContext,
  projectId: string,
  evidenceId: string,
): Promise<EvidenceWithControlIds | null> {
  requirePermission(ctx, ctx.organizationId, "evidence.read");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return null;
  }
  return service.getById(projectId, evidenceId);
}

export async function createEvidenceForOrg(
  projectRepo: ProjectRepository,
  service: EvidenceService,
  ctx: OrgContext,
  input: CreateEvidenceInput,
  actor: ActorIdentity,
): Promise<EvidenceActionResult> {
  requirePermission(ctx, ctx.organizationId, "evidence.create");
  if (input.controlIds && input.controlIds.length > 0) {
    requirePermission(ctx, ctx.organizationId, "evidence.associate");
  }
  if (!(await projectBelongsToOrg(projectRepo, ctx, input.projectId))) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  const result = await service.create(input, actor);
  const events = [
    evidenceCreatedEvent({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      projectId: result.evidence.projectId,
      evidenceId: result.evidence.id,
      title: result.evidence.title,
      status: result.evidence.status,
      controlIds: result.evidence.controlIds,
    }),
    ...result.evidence.controlIds.map((controlId) =>
      evidenceLinkedEvent({
        organizationId: ctx.organizationId,
        actorId: ctx.userId,
        projectId: result.evidence.projectId,
        evidenceId: result.evidence.id,
        controlId,
        title: result.evidence.title,
      }),
    ),
  ];
  await publishDomainEvents(events);
  return { ok: true, evidence: result.evidence };
}

export async function updateEvidenceForOrg(
  projectRepo: ProjectRepository,
  service: EvidenceService,
  ctx: OrgContext,
  projectId: string,
  evidenceId: string,
  input: UpdateEvidenceInput,
  actor: ActorIdentity,
): Promise<EvidenceActionResult> {
  requirePermission(ctx, ctx.organizationId, "evidence.update");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  const result = await service.update(projectId, evidenceId, input, actor);
  if (!result) {
    return { ok: false, reason: "not-found", message: "Evidence not found." };
  }
  await publishDomainEvent(
    evidenceUpdatedEvent({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      projectId: result.evidence.projectId,
      evidenceId: result.evidence.id,
      title: result.evidence.title,
      status: result.evidence.status,
    }),
  );
  return { ok: true, evidence: result.evidence };
}

export async function archiveEvidenceForOrg(
  projectRepo: ProjectRepository,
  service: EvidenceService,
  ctx: OrgContext,
  projectId: string,
  evidenceId: string,
  actor: ActorIdentity,
): Promise<EvidenceActionResult> {
  requirePermission(ctx, ctx.organizationId, "evidence.archive");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  const result = await service.archive(projectId, evidenceId, actor);
  if (!result) {
    return { ok: false, reason: "not-found", message: "Evidence not found." };
  }
  await publishDomainEvents([
    evidenceArchivedEvent({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      projectId: result.evidence.projectId,
      evidenceId: result.evidence.id,
      title: result.evidence.title,
    }),
    evidenceUpdatedEvent({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      projectId: result.evidence.projectId,
      evidenceId: result.evidence.id,
      title: result.evidence.title,
      status: result.evidence.status,
    }),
  ]);
  return { ok: true, evidence: result.evidence };
}

export async function deleteDraftEvidenceForOrg(
  projectRepo: ProjectRepository,
  service: EvidenceService,
  versionService: EvidenceVersionService,
  ctx: OrgContext,
  projectId: string,
  evidenceId: string,
): Promise<
  | { ok: true }
  | {
      ok: false;
      reason: "not-found" | "not-deletable";
      message: string;
    }
> {
  requirePermission(ctx, ctx.organizationId, "evidence.delete");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  const result = await service.deleteDraft(projectId, evidenceId);
  if (!result.ok) {
    return result;
  }
  await versionService.cleanupStorageForEvidence(
    projectId,
    evidenceId,
    result.storageKeys,
  );
  return { ok: true };
}

export async function associateEvidenceForOrg(
  projectRepo: ProjectRepository,
  service: EvidenceService,
  ctx: OrgContext,
  projectId: string,
  evidenceId: string,
  controlId: string,
  actor: ActorIdentity,
): Promise<EvidenceActionResult> {
  requirePermission(ctx, ctx.organizationId, "evidence.associate");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  const before = await service.getById(projectId, evidenceId);
  if (!before) {
    return { ok: false, reason: "not-found", message: "Evidence not found." };
  }
  const alreadyLinked = before.controlIds.includes(controlId.trim());
  const result = await service.associate(
    projectId,
    evidenceId,
    controlId,
    actor,
  );
  if (!result.ok) {
    return result;
  }
  if (!alreadyLinked) {
    await publishDomainEvent(
      evidenceLinkedEvent({
        organizationId: ctx.organizationId,
        actorId: ctx.userId,
        projectId: result.evidence.projectId,
        evidenceId: result.evidence.id,
        controlId: controlId.trim(),
        title: result.evidence.title,
      }),
    );
  }
  return { ok: true, evidence: result.evidence };
}

export async function dissociateEvidenceForOrg(
  projectRepo: ProjectRepository,
  service: EvidenceService,
  ctx: OrgContext,
  projectId: string,
  evidenceId: string,
  controlId: string,
  actor: ActorIdentity,
): Promise<EvidenceActionResult> {
  requirePermission(ctx, ctx.organizationId, "evidence.associate");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  const before = await service.getById(projectId, evidenceId);
  if (!before) {
    return { ok: false, reason: "not-found", message: "Evidence not found." };
  }
  const wasLinked = before.controlIds.includes(controlId.trim());
  const result = await service.dissociate(
    projectId,
    evidenceId,
    controlId,
    actor,
  );
  if (!result) {
    return { ok: false, reason: "not-found", message: "Evidence not found." };
  }
  if (wasLinked) {
    await publishDomainEvent(
      evidenceUnlinkedEvent({
        organizationId: ctx.organizationId,
        actorId: ctx.userId,
        projectId: result.evidence.projectId,
        evidenceId: result.evidence.id,
        controlId: controlId.trim(),
        title: result.evidence.title,
      }),
    );
  }
  return { ok: true, evidence: result.evidence };
}

export async function listEvidenceVersionsForOrg(
  projectRepo: ProjectRepository,
  versionService: EvidenceVersionService,
  ctx: OrgContext,
  projectId: string,
  evidenceId: string,
): Promise<EvidenceVersion[]> {
  requirePermission(ctx, ctx.organizationId, "evidence.read");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return [];
  }
  return versionService.listVersions(projectId, evidenceId);
}

export async function uploadEvidenceVersionForOrg(
  projectRepo: ProjectRepository,
  versionService: EvidenceVersionService,
  ctx: OrgContext,
  input: {
    projectId: string;
    evidenceId: string;
    upload: ValidatedUpload;
  },
  actor: ActorIdentity,
): Promise<EvidenceVersionUploadResult> {
  requirePermission(ctx, ctx.organizationId, "evidence.update");
  if (!(await projectBelongsToOrg(projectRepo, ctx, input.projectId))) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  const result = await versionService.uploadVersion(
    {
      projectId: input.projectId,
      evidenceId: input.evidenceId,
      upload: input.upload,
      uploadedByUserId: ctx.userId,
    },
    actor,
  );
  if (!result.ok) {
    return result;
  }
  await publishDomainEvent(
    evidenceVersionUploadedEvent({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      projectId: result.evidence.projectId,
      evidenceId: result.evidence.id,
      versionId: result.version.id,
      versionNumber: result.version.versionNumber,
      originalFilename: result.version.originalFilename,
      mimeType: result.version.mimeType,
      sizeBytes: result.version.sizeBytes,
      sha256: result.version.sha256,
    }),
  );
  return result;
}

export async function downloadEvidenceVersionForOrg(
  projectRepo: ProjectRepository,
  versionService: EvidenceVersionService,
  ctx: OrgContext,
  projectId: string,
  evidenceId: string,
  versionId: string,
): Promise<EvidenceVersionDownloadResult> {
  requirePermission(ctx, ctx.organizationId, "evidence.read");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return {
      ok: false,
      reason: "not-found",
      message: "Evidence version not found.",
    };
  }
  return versionService.downloadVersion(projectId, evidenceId, versionId);
}
