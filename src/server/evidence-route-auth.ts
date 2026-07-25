import "server-only";

import { getSessionUser, resolveOrgContext, sessionActor } from "@/auth/context";
import type { OrgContext } from "@/authz/authorize";
import { getProjectRepository } from "@/persistence/server";
import type { ActorIdentity } from "@/persistence/actor";

export type EvidenceRouteAuth =
  | {
      ok: true;
      ctx: OrgContext;
      actor: ActorIdentity;
    }
  | { ok: false; status: 401 | 404 };

/**
 * Resolve session + org context for a project-scoped Evidence API route.
 * Fail closed when unauthenticated or the project is outside the caller's org.
 */
export async function authorizeEvidenceProjectRoute(
  projectId: string,
): Promise<EvidenceRouteAuth> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, status: 401 };
  }
  const projectRepo = await getProjectRepository();
  const loaded = await projectRepo.load(projectId);
  if (!loaded.ok || !loaded.project.organizationId) {
    return { ok: false, status: 404 };
  }
  const ctx = await resolveOrgContext(user.id, loaded.project.organizationId);
  if (!ctx) {
    return { ok: false, status: 404 };
  }
  const actor = sessionActor(user);
  if (!actor) {
    return { ok: false, status: 401 };
  }
  return { ok: true, ctx, actor };
}
