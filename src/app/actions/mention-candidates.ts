"use server";

import { AuthorizationError } from "@/authz/authorize";
import { getSessionUser, resolveOrgContext } from "@/auth/context";
import { getProjectRepository } from "@/persistence/server";
import { getDb } from "@/persistence/postgres/client";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { requirePermission } from "@/authz/authorize";

export type MentionCandidate = {
  userId: string;
  name: string;
  email: string;
};

/**
 * Organization members available for @mention autocomplete within a project.
 */
export async function listMentionCandidatesAction(
  projectId: string,
): Promise<MentionCandidate[]> {
  if (typeof projectId !== "string" || !projectId.trim()) {
    return [];
  }
  const user = await getSessionUser();
  if (!user) {
    return [];
  }
  const projectRepo = await getProjectRepository();
  const loaded = await projectRepo.load(projectId.trim());
  if (!loaded.ok || !loaded.project.organizationId) {
    return [];
  }
  const ctx = await resolveOrgContext(user.id, loaded.project.organizationId);
  if (!ctx) {
    return [];
  }
  try {
    requirePermission(ctx, ctx.organizationId, "discussion.read");
    const orgs = createPostgresOrganizationRepository(await getDb());
    const members = await orgs.listMembers(ctx.organizationId);
    return members.map((member) => ({
      userId: member.userId,
      name: member.name,
      email: member.email,
    }));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return [];
    }
    throw error;
  }
}
