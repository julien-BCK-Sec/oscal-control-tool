"use server";

import { roleHasPermission } from "@/authz/permissions";
import type {
  EvidenceWithControlIds,
  ListEvidenceOptions,
} from "@/data/evidence";
import {
  parseCreateEvidenceInput,
  parseUpdateEvidenceInput,
  toCreateEvidenceInput,
  toUpdateEvidenceInput,
} from "@/data/evidence";
import type { OrgContext } from "@/authz/authorize";
import { AuthorizationError } from "@/authz/authorize";
import { getSessionUser, resolveOrgContext, sessionActor } from "@/auth/context";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import type { ProjectRepository } from "@/persistence/repository";
import {
  getEvidenceService,
  getProjectRepository,
} from "@/persistence/server";
import {
  archiveEvidenceForOrg,
  associateEvidenceForOrg,
  createEvidenceForOrg,
  deleteDraftEvidenceForOrg,
  dissociateEvidenceForOrg,
  getEvidenceForOrg,
  listEvidenceForOrg,
  updateEvidenceForOrg,
  type EvidenceActionResult,
} from "@/server/authorized-evidence";

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

async function resolveProjectContext(
  projectRepo: ProjectRepository,
  projectId: string,
): Promise<{ ctx: OrgContext; actor: ReturnType<typeof sessionActor> } | null> {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }
  const loaded = await projectRepo.load(projectId);
  if (!loaded.ok || !loaded.project.organizationId) {
    return null;
  }
  const ctx = await resolveOrgContext(user.id, loaded.project.organizationId);
  if (!ctx) {
    return null;
  }
  return { ctx, actor: sessionActor(user) };
}

function mapAuth(error: unknown): EvidenceActionResult {
  if (error instanceof AuthorizationError) {
    return { ok: false, reason: "not-found", message: error.message };
  }
  throw error;
}

export async function listEvidenceAction(
  projectId: string,
  options?: ListEvidenceOptions,
): Promise<EvidenceWithControlIds[]> {
  const pid = requireNonEmptyString(projectId, "projectId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, pid);
  if (!resolved) {
    return [];
  }
  try {
    const service = await getEvidenceService();
    return await listEvidenceForOrg(
      projectRepo,
      service,
      resolved.ctx,
      pid,
      options,
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return [];
    }
    throw error;
  }
}

export async function getEvidenceAction(
  projectId: string,
  evidenceId: string,
): Promise<EvidenceWithControlIds | null> {
  const pid = requireNonEmptyString(projectId, "projectId");
  const eid = requireNonEmptyString(evidenceId, "evidenceId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, pid);
  if (!resolved) {
    return null;
  }
  try {
    const service = await getEvidenceService();
    return await getEvidenceForOrg(
      projectRepo,
      service,
      resolved.ctx,
      pid,
      eid,
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return null;
    }
    throw error;
  }
}

export async function createEvidenceAction(
  input: unknown,
): Promise<EvidenceActionResult> {
  const parsed = parseCreateEvidenceInput(input);
  if (!parsed) {
    return {
      ok: false,
      reason: "validation",
      message: "Invalid evidence input.",
    };
  }
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, parsed.projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    const service = await getEvidenceService();
    return await createEvidenceForOrg(
      projectRepo,
      service,
      resolved.ctx,
      toCreateEvidenceInput(parsed),
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuth(error);
  }
}

export async function updateEvidenceAction(input: {
  projectId: string;
  evidenceId: string;
  patch: unknown;
}): Promise<EvidenceActionResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const evidenceId = requireNonEmptyString(input.evidenceId, "evidenceId");
  const parsed = parseUpdateEvidenceInput(input.patch);
  if (!parsed) {
    return {
      ok: false,
      reason: "validation",
      message: "Invalid evidence update.",
    };
  }
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    const service = await getEvidenceService();
    return await updateEvidenceForOrg(
      projectRepo,
      service,
      resolved.ctx,
      projectId,
      evidenceId,
      toUpdateEvidenceInput(parsed),
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuth(error);
  }
}

export async function archiveEvidenceAction(input: {
  projectId: string;
  evidenceId: string;
}): Promise<EvidenceActionResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const evidenceId = requireNonEmptyString(input.evidenceId, "evidenceId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    const service = await getEvidenceService();
    return await archiveEvidenceForOrg(
      projectRepo,
      service,
      resolved.ctx,
      projectId,
      evidenceId,
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuth(error);
  }
}

export async function deleteDraftEvidenceAction(input: {
  projectId: string;
  evidenceId: string;
}): Promise<
  | { ok: true }
  | {
      ok: false;
      reason: "not-found" | "not-deletable" | "validation";
      message: string;
    }
> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const evidenceId = requireNonEmptyString(input.evidenceId, "evidenceId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    const service = await getEvidenceService();
    return await deleteDraftEvidenceForOrg(
      projectRepo,
      service,
      resolved.ctx,
      projectId,
      evidenceId,
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, reason: "not-found", message: error.message };
    }
    throw error;
  }
}

export async function associateEvidenceAction(input: {
  projectId: string;
  evidenceId: string;
  controlId: string;
}): Promise<EvidenceActionResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const evidenceId = requireNonEmptyString(input.evidenceId, "evidenceId");
  const controlId = requireNonEmptyString(input.controlId, "controlId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    const service = await getEvidenceService();
    return await associateEvidenceForOrg(
      projectRepo,
      service,
      resolved.ctx,
      projectId,
      evidenceId,
      controlId,
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuth(error);
  }
}

export async function dissociateEvidenceAction(input: {
  projectId: string;
  evidenceId: string;
  controlId: string;
}): Promise<EvidenceActionResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const evidenceId = requireNonEmptyString(input.evidenceId, "evidenceId");
  const controlId = requireNonEmptyString(input.controlId, "controlId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    const service = await getEvidenceService();
    return await dissociateEvidenceForOrg(
      projectRepo,
      service,
      resolved.ctx,
      projectId,
      evidenceId,
      controlId,
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuth(error);
  }
}

export type EvidenceCapabilities = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canAssociate: boolean;
  canArchive: boolean;
  canDelete: boolean;
};

export async function getEvidenceCapabilitiesAction(
  projectId: string,
): Promise<EvidenceCapabilities> {
  const empty: EvidenceCapabilities = {
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canAssociate: false,
    canArchive: false,
    canDelete: false,
  };
  const pid = requireNonEmptyString(projectId, "projectId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, pid);
  if (!resolved) {
    return empty;
  }
  const role = resolved.ctx.role;
  return {
    canRead: roleHasPermission(role, "evidence.read"),
    canCreate: roleHasPermission(role, "evidence.create"),
    canUpdate: roleHasPermission(role, "evidence.update"),
    canAssociate: roleHasPermission(role, "evidence.associate"),
    canArchive: roleHasPermission(role, "evidence.archive"),
    canDelete: roleHasPermission(role, "evidence.delete"),
  };
}
