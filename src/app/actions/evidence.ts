"use server";

import { roleHasPermission } from "@/authz/permissions";
import type {
  EvidenceVersion,
  EvidenceWithControlIds,
  ListEvidenceOptions,
  ProjectEvidenceCoverageResult,
  SearchEvidenceInput,
  SearchEvidencePage,
} from "@/data/evidence";
import {
  parseCreateEvidenceInput,
  parseEvidenceDate,
  parseUpdateEvidenceInput,
  toCreateEvidenceInput,
  toUpdateEvidenceInput,
  EVIDENCE_SEARCH_DEFAULT_LIMIT,
  EVIDENCE_SEARCH_MAX_LIMIT,
  isEvidenceFreshness,
  isEvidenceStatus,
  isEvidenceType,
  utcTodayIsoDate,
} from "@/data/evidence";
import type { OrgContext } from "@/authz/authorize";
import { AuthorizationError } from "@/authz/authorize";
import { getSessionUser, resolveOrgContext, sessionActor } from "@/auth/context";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import type { ProjectRepository } from "@/persistence/repository";
import {
  getEvidenceCoverageQuery,
  getEvidenceService,
  getEvidenceVersionService,
  getProjectRepository,
} from "@/persistence/server";
import {
  archiveEvidenceForOrg,
  associateEvidenceForOrg,
  createEvidenceForOrg,
  deleteDraftEvidenceForOrg,
  dissociateEvidenceForOrg,
  getEvidenceForOrg,
  getProjectEvidenceCoverageForOrg,
  listEvidenceForOrg,
  listEvidenceVersionsForOrg,
  searchEvidenceForOrg,
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

export async function searchEvidenceAction(
  input: unknown,
): Promise<
  | { ok: true; page: SearchEvidencePage }
  | { ok: false; reason: "not-found" | "validation"; message: string }
> {
  if (!input || typeof input !== "object") {
    return {
      ok: false,
      reason: "validation",
      message: "Invalid search input.",
    };
  }
  const raw = input as Record<string, unknown>;
  if (typeof raw.projectId !== "string" || raw.projectId.trim() === "") {
    return {
      ok: false,
      reason: "validation",
      message: "projectId is required.",
    };
  }
  const projectId = raw.projectId.trim();
  const query =
    typeof raw.query === "string" ? raw.query : undefined;
  const cursor =
    typeof raw.cursor === "string"
      ? raw.cursor
      : raw.cursor === null
        ? null
        : undefined;
  let limit: number | undefined;
  if (raw.limit !== undefined) {
    if (typeof raw.limit !== "number" || !Number.isFinite(raw.limit)) {
      return {
        ok: false,
        reason: "validation",
        message: "limit must be a number.",
      };
    }
    limit = Math.min(
      Math.max(1, Math.floor(raw.limit)),
      EVIDENCE_SEARCH_MAX_LIMIT,
    );
  }
  if (
    raw.status !== undefined &&
    raw.status !== null &&
    !isEvidenceStatus(raw.status)
  ) {
    return {
      ok: false,
      reason: "validation",
      message: "Invalid status filter.",
    };
  }
  if (
    raw.evidenceType !== undefined &&
    raw.evidenceType !== null &&
    !isEvidenceType(raw.evidenceType)
  ) {
    return {
      ok: false,
      reason: "validation",
      message: "Invalid evidence type filter.",
    };
  }
  if (
    raw.freshness !== undefined &&
    raw.freshness !== null &&
    !isEvidenceFreshness(raw.freshness)
  ) {
    return {
      ok: false,
      reason: "validation",
      message: "Invalid freshness filter.",
    };
  }
  let asOfDate: string | undefined;
  if (raw.asOfDate !== undefined && raw.asOfDate !== null) {
    const parsedAsOf = parseEvidenceDate(raw.asOfDate);
    if (parsedAsOf === null || parsedAsOf === undefined) {
      return {
        ok: false,
        reason: "validation",
        message: "asOfDate must be YYYY-MM-DD.",
      };
    }
    asOfDate = parsedAsOf;
  }
  if (
    raw.hasCurrentVersion !== undefined &&
    raw.hasCurrentVersion !== null &&
    typeof raw.hasCurrentVersion !== "boolean"
  ) {
    return {
      ok: false,
      reason: "validation",
      message: "hasCurrentVersion must be a boolean.",
    };
  }
  if (
    raw.linked !== undefined &&
    raw.linked !== null &&
    typeof raw.linked !== "boolean"
  ) {
    return {
      ok: false,
      reason: "validation",
      message: "linked must be a boolean.",
    };
  }

  const searchInput: SearchEvidenceInput = {
    projectId,
    query,
    cursor: cursor ?? null,
    limit: limit ?? EVIDENCE_SEARCH_DEFAULT_LIMIT,
    status: isEvidenceStatus(raw.status) ? raw.status : undefined,
    evidenceType: isEvidenceType(raw.evidenceType)
      ? raw.evidenceType
      : undefined,
    owner: typeof raw.owner === "string" ? raw.owner : undefined,
    freshness: isEvidenceFreshness(raw.freshness) ? raw.freshness : undefined,
    hasCurrentVersion:
      typeof raw.hasCurrentVersion === "boolean"
        ? raw.hasCurrentVersion
        : undefined,
    linked: typeof raw.linked === "boolean" ? raw.linked : undefined,
    asOfDate,
    excludeLinkedToControlId:
      typeof raw.excludeLinkedToControlId === "string"
        ? raw.excludeLinkedToControlId.trim()
        : undefined,
    excludeArchived:
      typeof raw.excludeArchived === "boolean"
        ? raw.excludeArchived
        : undefined,
  };

  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    const service = await getEvidenceService();
    const page = await searchEvidenceForOrg(
      projectRepo,
      service,
      resolved.ctx,
      searchInput,
    );
    return { ok: true, page };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, reason: "not-found", message: error.message };
    }
    if (error instanceof Error && /Invalid search cursor/.test(error.message)) {
      return {
        ok: false,
        reason: "validation",
        message: "Invalid or stale search cursor.",
      };
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
    const versionService = await getEvidenceVersionService();
    return await deleteDraftEvidenceForOrg(
      projectRepo,
      service,
      versionService,
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

export async function getProjectEvidenceCoverageAction(
  projectId: string,
  asOfDate?: string,
): Promise<ProjectEvidenceCoverageResult | null> {
  const pid = requireNonEmptyString(projectId, "projectId");
  let asOf = utcTodayIsoDate();
  if (asOfDate !== undefined) {
    const parsed = parseEvidenceDate(asOfDate);
    if (parsed === null || parsed === undefined) {
      return null;
    }
    asOf = parsed;
  }
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, pid);
  if (!resolved) {
    return null;
  }
  try {
    const coverageQuery = await getEvidenceCoverageQuery();
    return await getProjectEvidenceCoverageForOrg(
      projectRepo,
      coverageQuery,
      resolved.ctx,
      pid,
      asOf,
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return null;
    }
    throw error;
  }
}

export async function listEvidenceVersionsAction(
  projectId: string,
  evidenceId: string,
): Promise<EvidenceVersion[]> {
  const pid = requireNonEmptyString(projectId, "projectId");
  const eid = requireNonEmptyString(evidenceId, "evidenceId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, pid);
  if (!resolved) {
    return [];
  }
  try {
    const versionService = await getEvidenceVersionService();
    return await listEvidenceVersionsForOrg(
      projectRepo,
      versionService,
      resolved.ctx,
      pid,
      eid,
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return [];
    }
    throw error;
  }
}
