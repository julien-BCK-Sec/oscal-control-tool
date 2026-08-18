import type { ControlImplementation } from "@/data/implementation";
import type { ProjectMetadata } from "@/data/project";
import type { ProjectRepository } from "@/persistence/repository";
import type { StoredProject } from "@/persistence/types";
import {
  CANONICAL_PROJECTS,
  type CanonicalProjectKey,
} from "@/seed/demo/catalog";
import { seedDemoProject } from "@/seed/demo/seedDemoProject";
import {
  buildContosoCloudDescription,
  buildContosoImplementations,
  buildCmmcImplementations,
  buildCmmcProjectDescription,
  buildEarlyImplementations,
  buildEarlyProjectDescription,
  buildEvidenceGapImplementations,
  buildEvidenceGapProjectDescription,
  buildFirstDoorCloudDescription,
  buildFirstDoorImplementations,
  buildHighImplementations,
  buildHighProjectDescription,
  buildSupportingMetadata,
} from "@/seed/demo/supporting";

export type DemoProjectsResult = {
  flagship: StoredProject;
  cmmc: StoredProject;
  early: StoredProject;
  evidenceGap: StoredProject;
  high: StoredProject;
  contosoCloud: StoredProject;
  firstdoorCloud: StoredProject;
  created: string[];
};

async function findOrCreateProject(
  repository: ProjectRepository,
  organizationId: string,
  name: string,
  frameworkId: string,
  metadata: ProjectMetadata,
  implementations: Record<string, ControlImplementation>,
): Promise<{ project: StoredProject; created: boolean }> {
  const listed = await repository.list(organizationId);
  const existing = listed.find((row) => row.name === name);
  if (existing) {
    const loaded = await repository.load(existing.id);
    if (!loaded.ok) {
      throw new Error(`Failed to load project "${name}": ${loaded.error.kind}`);
    }
    return { project: loaded.project, created: false };
  }

  const project = await repository.create({
    name,
    organizationId,
    organizationName: metadata.organizationName,
    frameworkId,
    metadata,
    implementations,
  });
  return { project, created: true };
}

async function ensureSupporting(
  repository: ProjectRepository,
  organizationId: string,
  key: CanonicalProjectKey,
  implementations: Record<string, ControlImplementation>,
  systemDescription: string,
): Promise<{ project: StoredProject; created: boolean }> {
  const spec = CANONICAL_PROJECTS[key];
  return findOrCreateProject(
    repository,
    organizationId,
    spec.name,
    spec.frameworkId,
    buildSupportingMetadata(key, systemDescription),
    implementations,
  );
}

/**
 * Seed canonical demo projects. The flagship uses seedDemoProject (complete
 * baseline + named versions). Supporting projects are find-or-create only.
 */
export async function ensureDemoProjects(
  repository: ProjectRepository,
  organizationIds: { cgds: string; contoso: string; firstdoor: string },
  options: { validateOscal?: boolean } = {},
): Promise<DemoProjectsResult> {
  const created: string[] = [];

  const flagshipResult = await seedDemoProject(repository, {
    reset: false,
    validateOscal: options.validateOscal !== false,
    organizationId: organizationIds.cgds,
  });
  if (!flagshipResult.project) {
    throw new Error("Flagship demo project missing after seed.");
  }
  if (flagshipResult.status === "created") {
    created.push(CANONICAL_PROJECTS.flagship.name);
  }

  const cmmc = await ensureSupporting(
    repository,
    organizationIds.cgds,
    "cmmc",
    buildCmmcImplementations(),
    buildCmmcProjectDescription(),
  );
  if (cmmc.created) created.push(CANONICAL_PROJECTS.cmmc.name);

  const early = await ensureSupporting(
    repository,
    organizationIds.cgds,
    "early",
    buildEarlyImplementations(),
    buildEarlyProjectDescription(),
  );
  if (early.created) created.push(CANONICAL_PROJECTS.early.name);

  const evidenceGap = await ensureSupporting(
    repository,
    organizationIds.cgds,
    "evidenceGap",
    buildEvidenceGapImplementations(),
    buildEvidenceGapProjectDescription(),
  );
  if (evidenceGap.created) created.push(CANONICAL_PROJECTS.evidenceGap.name);

  const high = await ensureSupporting(
    repository,
    organizationIds.cgds,
    "high",
    buildHighImplementations(),
    buildHighProjectDescription(),
  );
  if (high.created) created.push(CANONICAL_PROJECTS.high.name);

  const contosoCloud = await ensureSupporting(
    repository,
    organizationIds.contoso,
    "contosoCloud",
    buildContosoImplementations(),
    buildContosoCloudDescription(),
  );
  if (contosoCloud.created) created.push(CANONICAL_PROJECTS.contosoCloud.name);

  const firstdoorCloud = await ensureSupporting(
    repository,
    organizationIds.firstdoor,
    "firstdoorCloud",
    buildFirstDoorImplementations(),
    buildFirstDoorCloudDescription(),
  );
  if (firstdoorCloud.created) {
    created.push(CANONICAL_PROJECTS.firstdoorCloud.name);
  }

  return {
    flagship: flagshipResult.project,
    cmmc: cmmc.project,
    early: early.project,
    evidenceGap: evidenceGap.project,
    high: high.project,
    contosoCloud: contosoCloud.project,
    firstdoorCloud: firstdoorCloud.project,
    created,
  };
}
