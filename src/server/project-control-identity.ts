import {
  isFrameworkControlId,
  resolveFrameworkControlIdSet,
} from "@/data/framework";
import type { OrgContext } from "@/authz/authorize";
import type { ProjectRepository } from "@/persistence/repository";
import type { StoredProject } from "@/persistence/types";

export const UNKNOWN_FRAMEWORK_CONTROL_MESSAGE =
  "Control is not part of this project's framework.";

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
  return [
    ...new Set(
      controlIds
        .map((id) => id.trim())
        .filter((id) => id && !isFrameworkControlId(frameworkId, id)),
    ),
  ];
}

export function projectFrameworkControlIds(frameworkId: string): string[] {
  return [...resolveFrameworkControlIdSet(frameworkId)];
}
