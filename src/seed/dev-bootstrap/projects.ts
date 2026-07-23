import { FRAMEWORK_CONTROLS } from "@/data/framework";
import type { ControlImplementation, ImplementationStatus } from "@/data/implementation";
import type { ProjectMetadata } from "@/data/project";
import type { ProjectRepository } from "@/persistence/repository";
import type { StoredProject } from "@/persistence/types";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import {
  buildCompleteDemoImplementations,
  collectDemoNarratives,
} from "@/seed/demo";
import { PROJECT_NAMES } from "./constants";

function metadataFor(
  systemName: string,
  organizationName: string,
  systemDescription: string,
): ProjectMetadata {
  return { systemName, organizationName, systemDescription };
}

function pickNarratives(
  controlIds: readonly string[],
  status: ImplementationStatus,
): Record<string, ControlImplementation> {
  const all = collectDemoNarratives();
  const out: Record<string, ControlImplementation> = {};
  for (const id of controlIds) {
    const narrative = all[id];
    if (!narrative) {
      continue;
    }
    out[id] = { status, narrative };
  }
  return out;
}

function everyNthControl(
  n: number,
  limit: number,
): string[] {
  const ids = FRAMEWORK_CONTROLS.map((c) => c.id);
  const picked: string[] = [];
  for (let i = 0; i < ids.length && picked.length < limit; i += n) {
    picked.push(ids[i]!);
  }
  return picked;
}

async function findOrCreateProject(
  repository: ProjectRepository,
  organizationId: string,
  name: string,
  organizationName: string,
  systemDescription: string,
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
    organizationName,
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    metadata: metadataFor(name, organizationName, systemDescription),
    implementations,
  });
  return { project, created: true };
}

export type DemoProjectsResult = {
  goose: StoredProject;
  customerA: StoredProject;
  lab: StoredProject;
  contosoCloud: StoredProject;
  created: string[];
};

/**
 * Create the four demo projects with NIST Moderate implementations.
 * Goose uses the full curated demo baseline; others use thinner subsets.
 */
export async function ensureDemoProjects(
  repository: ProjectRepository,
  organizationIds: { acme: string; contoso: string },
): Promise<DemoProjectsResult> {
  const created: string[] = [];

  const gooseImpl = buildCompleteDemoImplementations();
  const goose = await findOrCreateProject(
    repository,
    organizationIds.acme,
    PROJECT_NAMES.goose,
    "Acme Corporation",
    "Goose Command Control Center is Acme's flagship compliance demonstration system for NIST SP 800-53 Rev. 5 Moderate authoring, review, and collaboration.",
    gooseImpl,
  );
  if (goose.created) created.push(PROJECT_NAMES.goose);

  // ~25 actively worked controls for Customer A.
  const customerIds = everyNthControl(8, 26);
  const customerImpl = pickNarratives(customerIds, "in-progress");
  // Leave some as not-started intentionally by only setting ~20.
  const customerKeys = Object.keys(customerImpl).slice(0, 22);
  const customerTrimmed: Record<string, ControlImplementation> = {};
  for (const key of customerKeys) {
    customerTrimmed[key] = customerImpl[key]!;
  }
  const customerA = await findOrCreateProject(
    repository,
    organizationIds.acme,
    PROJECT_NAMES.customerA,
    "Acme Corporation",
    "Customer A SSP tracks a mid-stream Moderate authorization package with partial implementation progress.",
    customerTrimmed,
  );
  if (customerA.created) created.push(PROJECT_NAMES.customerA);

  const labIds = ["ac-1", "ac-2", "ia-2", "cm-2", "pl-2"] as const;
  const labImpl = pickNarratives(labIds, "implemented");
  const lab = await findOrCreateProject(
    repository,
    organizationIds.acme,
    PROJECT_NAMES.lab,
    "Acme Corporation",
    "Internal Lab Environment is an early-stage lab system with only a handful of completed controls.",
    labImpl,
  );
  if (lab.created) created.push(PROJECT_NAMES.lab);

  // Contoso: import most baseline narratives but mark many as not-started /
  // in-progress mix by keeping a thin subset implemented.
  const contosoIds = everyNthControl(12, 18);
  const contosoImpl = pickNarratives(contosoIds, "in-progress");
  const contosoCloud = await findOrCreateProject(
    repository,
    organizationIds.contoso,
    PROJECT_NAMES.contosoCloud,
    "Contoso Industries",
    "Contoso Cloud Platform is Contoso's Moderate baseline demonstration used for tenant-isolation testing.",
    contosoImpl,
  );
  if (contosoCloud.created) created.push(PROJECT_NAMES.contosoCloud);

  return {
    goose: goose.project,
    customerA: customerA.project,
    lab: lab.project,
    contosoCloud: contosoCloud.project,
    created,
  };
}
