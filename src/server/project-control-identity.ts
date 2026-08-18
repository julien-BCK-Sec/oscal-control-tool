import {
  isFrameworkControlId,
  resolveFrameworkControlIdSet,
} from "@/data/framework";
import type { OrgContext } from "@/authz/authorize";
import {
  invalidFrameworkControlIds,
  UNKNOWN_FRAMEWORK_CONTROL_MESSAGE,
} from "@/persistence/framework-identity";
import type { ProjectRepository } from "@/persistence/repository";
import type { StoredProject } from "@/persistence/types";

export { UNKNOWN_FRAMEWORK_CONTROL_MESSAGE };

export async function loadOwnedProject(
  projectRepo: ProjectRepository,
  ctx: OrgContext,
  projectId: string,
): Promise<StoredProject | null> {
  const loaded = await projectRepo.load(projectId);
  if (!loaded.ok || loaded.project.organizationId !== ctx.organizationId) {
    return null;
  }
  return loaded.project;
}

export function controlBelongsToProjectFramework(
  frameworkId: string,
  controlId: string,
): boolean {
  return isFrameworkControlId(frameworkId, controlId);
}

export function invalidProjectControlIds(
  frameworkId: string,
  controlIds: readonly string[],
): string[] {
  return invalidFrameworkControlIds(frameworkId, controlIds);
}

export function projectFrameworkControlIds(frameworkId: string): string[] {
  return [...resolveFrameworkControlIdSet(frameworkId)];
}
