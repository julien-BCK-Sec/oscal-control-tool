import { FRAMEWORK, FRAMEWORK_CONTROLS } from "@/data/framework";
import type { ControlImplementation } from "@/data/implementation";
import type { ProjectMetadata } from "@/data/project";
import { assembleProject } from "@/domain";
import { projectToOscalSsp, validateOscalSspDocument } from "@/oscal";
import type { SspSchemaValidationResult } from "@/oscal";
import type { ProjectRepository } from "@/persistence";
import type {
  ProjectSnapshotSummary,
  ProjectSummary,
  StoredProject,
} from "@/persistence";
import { DEMO_PROJECT_NAME, DEMO_SNAPSHOT_NAMES } from "./constants";
import {
  buildDemoImplementationsForStage,
  buildDemoMetadata,
  demoBaselineControlCount,
  demoFrameworkLabel,
  validateDemoProjectContent,
} from "./content";

export type SeedDemoOptions = {
  /** When true, delete any existing demo project (and snapshots) then recreate. */
  reset?: boolean;
  /**
   * When true (default), assemble the final project, export SSP, and validate
   * against the pinned OSCAL 1.2.2 SSP schema.
   */
  validateOscal?: boolean;
};

export type SeedDemoStatus = "already-exists" | "created" | "reset";

export type SeedDemoResult = {
  status: SeedDemoStatus;
  databasePathHint: string;
  project: StoredProject | null;
  snapshots: ProjectSnapshotSummary[];
  controlCount: number;
  baselineControlCount: number;
  frameworkLabel: string;
  snapshotNames: string[];
  domainValidationOk: boolean;
  oscalValidation: SspSchemaValidationResult | null;
};

function frameworkControlIdSet(): Set<string> {
  return new Set(FRAMEWORK_CONTROLS.map((control) => control.id));
}

function namedSnapshotNames(snapshots: ProjectSnapshotSummary[]): string[] {
  const names = snapshots
    .filter((snapshot) => snapshot.snapshotType === "named" && snapshot.name)
    .map((snapshot) => snapshot.name as string);
  const order = new Map(
    DEMO_SNAPSHOT_NAMES.map((name, index) => [name, index]),
  );
  return [...names].sort((a, b) => {
    const ai = order.get(a as (typeof DEMO_SNAPSHOT_NAMES)[number]);
    const bi = order.get(b as (typeof DEMO_SNAPSHOT_NAMES)[number]);
    if (ai === undefined && bi === undefined) {
      return a.localeCompare(b);
    }
    if (ai === undefined) {
      return 1;
    }
    if (bi === undefined) {
      return -1;
    }
    return ai - bi;
  });
}

export async function findDemoProject(
  repository: ProjectRepository,
): Promise<ProjectSummary | null> {
  const listed = await repository.list();
  return listed.find((project) => project.name === DEMO_PROJECT_NAME) ?? null;
}

async function assertNamedVersion(
  repository: ProjectRepository,
  projectId: string,
  name: string,
  expectedRevision: number,
): Promise<ProjectSnapshotSummary> {
  const result = await repository.createNamedVersion({
    projectId,
    name,
    expectedRevision,
  });
  if (!result.ok) {
    throw new Error(
      `Failed to create named version "${name}": ${result.message}`,
    );
  }
  return result.snapshot;
}

async function saveStage(
  repository: ProjectRepository,
  project: StoredProject,
  metadata: ProjectMetadata,
  implementations: Record<string, ControlImplementation>,
  options: { requireCompleteBaseline: boolean },
): Promise<StoredProject> {
  const validation = validateDemoProjectContent({
    metadata,
    implementations,
    frameworkControlIds: frameworkControlIdSet(),
    requireCompleteBaseline: options.requireCompleteBaseline,
  });
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const saved = await repository.save({
    id: project.id,
    name: DEMO_PROJECT_NAME,
    frameworkId: FRAMEWORK.id,
    metadata,
    implementations,
    expectedRevision: project.revision,
  });
  if (!saved.ok) {
    throw new Error(
      `Failed to save demo project stage: ${saved.reason} (${saved.message})`,
    );
  }
  return saved.project;
}

async function createCanonicalDemo(
  repository: ProjectRepository,
  options: { validateOscal: boolean },
): Promise<{
  project: StoredProject;
  snapshots: ProjectSnapshotSummary[];
  domainValidationOk: boolean;
  oscalValidation: SspSchemaValidationResult | null;
}> {
  const metadata = buildDemoMetadata();
  const stage0 = buildDemoImplementationsForStage(0);

  const preCreateValidation = validateDemoProjectContent({
    metadata,
    implementations: stage0,
    frameworkControlIds: frameworkControlIdSet(),
  });
  if (!preCreateValidation.ok) {
    throw new Error(preCreateValidation.message);
  }

  let project = await repository.create({
    name: DEMO_PROJECT_NAME,
    frameworkId: FRAMEWORK.id,
    metadata,
    implementations: stage0,
  });

  const snapshots: ProjectSnapshotSummary[] = [];
  const finalStage = DEMO_SNAPSHOT_NAMES.length - 1;

  for (let stage = 0; stage < DEMO_SNAPSHOT_NAMES.length; stage += 1) {
    if (stage > 0) {
      project = await saveStage(
        repository,
        project,
        metadata,
        buildDemoImplementationsForStage(stage),
        { requireCompleteBaseline: stage === finalStage },
      );
    }

    const snapshot = await assertNamedVersion(
      repository,
      project.id,
      DEMO_SNAPSHOT_NAMES[stage],
      project.revision,
    );
    snapshots.push(snapshot);
  }

  const loaded = await repository.load(project.id);
  if (!loaded.ok) {
    throw new Error("Demo project missing after seed.");
  }
  project = loaded.project;

  const finalValidation = validateDemoProjectContent({
    metadata: project.metadata,
    implementations: project.implementations,
    frameworkControlIds: frameworkControlIdSet(),
    requireCompleteBaseline: true,
  });
  if (!finalValidation.ok) {
    throw new Error(finalValidation.message);
  }

  let oscalValidation: SspSchemaValidationResult | null = null;
  if (options.validateOscal) {
    const domain = assembleProject({
      metadata: project.metadata,
      frameworkControls: FRAMEWORK_CONTROLS,
      implementations: project.implementations,
    });
    oscalValidation = validateOscalSspDocument(projectToOscalSsp(domain));
    if (!oscalValidation.ok) {
      throw new Error(
        `Demo OSCAL SSP schema validation failed: ${oscalValidation.message}`,
      );
    }
  }

  return {
    project,
    snapshots,
    domainValidationOk: true,
    oscalValidation,
  };
}

/**
 * Seed the canonical CGDS/SGOP demo project through ProjectRepository.
 * Idempotent unless `reset` is true.
 */
export async function seedDemoProject(
  repository: ProjectRepository,
  options: SeedDemoOptions = {},
  context: { databasePathHint?: string } = {},
): Promise<SeedDemoResult> {
  const reset = options.reset === true;
  const validateOscal = options.validateOscal !== false;
  const databasePathHint =
    context.databasePathHint ?? "(configured DATABASE_PATH)";
  const baselineControlCount = demoBaselineControlCount();
  const frameworkLabel = demoFrameworkLabel();

  const existing = await findDemoProject(repository);

  if (existing && !reset) {
    const loaded = await repository.load(existing.id);
    const snapshots = await repository.listSnapshots(existing.id);
    return {
      status: "already-exists",
      databasePathHint,
      project: loaded.ok ? loaded.project : null,
      snapshots,
      controlCount: loaded.ok
        ? Object.keys(loaded.project.implementations).length
        : 0,
      baselineControlCount,
      frameworkLabel,
      snapshotNames: namedSnapshotNames(snapshots),
      domainValidationOk: loaded.ok,
      oscalValidation: null,
    };
  }

  if (existing && reset) {
    await repository.delete(existing.id);
  }

  const created = await createCanonicalDemo(repository, { validateOscal });

  return {
    status: reset ? "reset" : "created",
    databasePathHint,
    project: created.project,
    snapshots: created.snapshots,
    controlCount: Object.keys(created.project.implementations).length,
    baselineControlCount,
    frameworkLabel,
    snapshotNames: namedSnapshotNames(created.snapshots),
    domainValidationOk: created.domainValidationOk,
    oscalValidation: created.oscalValidation,
  };
}

export function formatSeedDemoSummary(result: SeedDemoResult): string {
  const lines = [
    "Demo seed summary",
    `  Status:          ${result.status}`,
    `  Database:        ${result.databasePathHint}`,
    `  Project name:    ${DEMO_PROJECT_NAME}`,
    `  Project id:      ${result.project?.id ?? "(none)"}`,
    `  Organization:    ${result.project?.metadata.organizationName ?? "(n/a)"}`,
    `  System:          ${result.project?.metadata.systemName ?? "(n/a)"}`,
    `  Framework:       ${result.frameworkLabel}`,
    `  Implementations: ${result.controlCount} / baseline ${result.baselineControlCount}`,
    `  Named versions:  ${result.snapshotNames.length} (${result.snapshotNames.join(", ") || "none"})`,
    `  Domain validate: ${result.domainValidationOk ? "passed" : "failed"}`,
  ];

  if (result.oscalValidation) {
    lines.push(
      `  OSCAL validate:  ${result.oscalValidation.ok ? "passed (SSP 1.2.2)" : "failed"}`,
    );
  } else if (result.status === "already-exists") {
    lines.push("  OSCAL validate:  skipped (demo already existed)");
  }

  return lines.join("\n");
}
