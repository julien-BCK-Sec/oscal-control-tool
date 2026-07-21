import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import { assembleProject } from "@/domain";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { projectToOscalSsp, validateOscalSspDocument } from "@/oscal";
import { closeDb, openDbAt } from "@/persistence/sqlite/client";
import { createSqliteProjectRepository } from "@/persistence/sqlite/project-repository";
import {
  DEMO_CONTROL_IDS,
  DEMO_ORGANIZATION,
  DEMO_PEOPLE,
  DEMO_PROJECT_NAME,
  DEMO_SNAPSHOT_NAMES,
  DEMO_SYSTEM,
  DEMO_TERMS,
  buildDemoImplementationsForStage,
  buildDemoMetadata,
  buildFinalDemoImplementations,
  findDemoProject,
  seedDemoProject,
  validateDemoProjectContent,
} from "@/seed/demo";

const dirs: string[] = [];

function tempRepo() {
  const dir = mkdtempSync(join(tmpdir(), "oscal-seed-"));
  dirs.push(dir);
  const dbPath = join(dir, "test.sqlite");
  const db = openDbAt(dbPath);
  return { repo: createSqliteProjectRepository(db), dbPath };
}

function allSeedProse(): string {
  const metadata = buildDemoMetadata();
  const implementations = buildFinalDemoImplementations();
  return [
    metadata.systemDescription,
    ...Object.values(implementations).map((item) => item.narrative),
  ].join("\n");
}

afterEach(() => {
  closeDb();
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("demo seed content", () => {
  it("builds valid metadata and final implementations", () => {
    const metadata = buildDemoMetadata();
    const implementations = buildFinalDemoImplementations();
    const frameworkControlIds = new Set(
      FRAMEWORK_CONTROLS.map((control) => control.id),
    );

    assert.equal(metadata.organizationName, DEMO_ORGANIZATION.name);
    assert.equal(metadata.systemName, DEMO_SYSTEM.name);
    assert.match(metadata.systemDescription, /authorization boundary/i);
    assert.match(
      metadata.systemDescription,
      new RegExp(DEMO_PEOPLE.garyMercer.name),
    );

    assert.equal(Object.keys(implementations).length, DEMO_CONTROL_IDS.length);
    assert.deepEqual(
      Object.keys(implementations).sort(),
      [...DEMO_CONTROL_IDS].sort(),
    );

    const validation = validateDemoProjectContent({
      metadata,
      implementations,
      frameworkControlIds,
    });
    assert.equal(validation.ok, true);
  });

  it("uses canonical recurring names and terminology", () => {
    const prose = allSeedProse();
    assert.match(prose, /Gary Mercer/);
    assert.match(prose, /Dr\. Margot Chen/);
    assert.match(prose, /Priya Sharma/);
    assert.match(prose, /Sam Okonkwo/);
    assert.match(prose, /Nadia Fortin/);
    assert.match(prose, /Steve Kowalski/);
    assert.match(prose, /Honkwater Barracks/);
    assert.match(prose, /Border Post 17/);
    assert.match(prose, /Coconut Storage Vault/);
    assert.match(prose, /Emergency Coconut Reserve/);
    assert.match(prose, /FeatherAuth/);
    assert.match(prose, /NestWatch/);
    assert.match(prose, new RegExp(DEMO_TERMS.honkProtocol));
    assert.doesNotMatch(prose, /Honksworth/);
    assert.doesNotMatch(prose, /Quackenbush/);
    assert.doesNotMatch(prose, /Beakman/);
    assert.doesNotMatch(prose, /Sam Coconut/);
  });

  it("keeps Gary's veterinary clearance out of early stages", () => {
    const early = buildDemoImplementationsForStage(0);
    const mid = buildDemoImplementationsForStage(2);
    const final = buildFinalDemoImplementations();
    const veterinary = /annual veterinary examination/i;

    assert.doesNotMatch(early["pl-2"]?.narrative ?? "", veterinary);
    assert.doesNotMatch(mid["pl-2"]?.narrative ?? "", veterinary);
    assert.match(final["pl-2"]?.narrative ?? "", veterinary);
    assert.match(
      final["pl-2"]?.narrative ?? "",
      /remains cleared for operational deployment/i,
    );
  });

  it("rejects unknown control ids", () => {
    const validation = validateDemoProjectContent({
      metadata: buildDemoMetadata(),
      implementations: {
        "not-a-real-control": {
          status: "implemented",
          narrative: "should fail",
        },
      },
      frameworkControlIds: new Set(FRAMEWORK_CONTROLS.map((c) => c.id)),
    });
    assert.equal(validation.ok, false);
  });
});

describe("seedDemoProject", () => {
  it("creates the demo project through the repository", async () => {
    const { repo } = tempRepo();
    const result = await seedDemoProject(
      repo,
      { validateOscal: false },
      { databasePathHint: "temp" },
    );

    assert.equal(result.status, "created");
    assert.ok(result.project);
    assert.equal(result.project.name, DEMO_PROJECT_NAME);
    assert.equal(result.project.frameworkId, NIST_MODERATE_FRAMEWORK_ID);
    assert.equal(result.controlCount, DEMO_CONTROL_IDS.length);
    assert.equal(result.snapshotNames.length, DEMO_SNAPSHOT_NAMES.length);
    assert.deepEqual(result.snapshotNames, [...DEMO_SNAPSHOT_NAMES]);

    const loaded = await repo.load(result.project.id);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) {
      return;
    }
    assert.equal(
      loaded.project.metadata.organizationName,
      DEMO_ORGANIZATION.name,
    );
    assert.equal(loaded.project.implementations["ac-1"]?.status, "implemented");
    assert.match(
      loaded.project.implementations["ac-1"]?.narrative ?? "",
      /CGDS-POL-001/,
    );
    assert.match(
      loaded.project.implementations["pl-2"]?.narrative ?? "",
      /annual veterinary examination/i,
    );
  });

  it("is idempotent when the demo already exists", async () => {
    const { repo } = tempRepo();
    const first = await seedDemoProject(repo, { validateOscal: false });
    assert.equal(first.status, "created");
    assert.ok(first.project);

    const second = await seedDemoProject(repo, { validateOscal: false });
    assert.equal(second.status, "already-exists");
    assert.equal(second.project?.id, first.project.id);

    const listed = await repo.list();
    assert.equal(
      listed.filter((project) => project.name === DEMO_PROJECT_NAME).length,
      1,
    );
  });

  it("resets by deleting and recreating the demo", async () => {
    const { repo } = tempRepo();
    const first = await seedDemoProject(repo, { validateOscal: false });
    assert.ok(first.project);
    const firstId = first.project.id;
    const firstSnapshots = await repo.listSnapshots(firstId);
    assert.equal(firstSnapshots.length, DEMO_SNAPSHOT_NAMES.length);

    const reset = await seedDemoProject(repo, {
      reset: true,
      validateOscal: false,
    });
    assert.equal(reset.status, "reset");
    assert.ok(reset.project);
    assert.notEqual(reset.project.id, firstId);

    const oldLoad = await repo.load(firstId);
    assert.equal(oldLoad.ok, false);

    const oldSnapshots = await repo.listSnapshots(firstId);
    assert.equal(oldSnapshots.length, 0);

    const newSnapshots = await repo.listSnapshots(reset.project.id);
    assert.equal(newSnapshots.length, DEMO_SNAPSHOT_NAMES.length);
    assert.deepEqual(
      new Set(newSnapshots.map((snapshot) => snapshot.name)),
      new Set(DEMO_SNAPSHOT_NAMES),
    );
    assert.deepEqual(reset.snapshotNames, [...DEMO_SNAPSHOT_NAMES]);
  });

  it("loads through ProjectRepository and keeps named snapshots", async () => {
    const { repo } = tempRepo();
    const seeded = await seedDemoProject(repo, { validateOscal: false });
    assert.ok(seeded.project);

    const found = await findDemoProject(repo);
    assert.ok(found);
    assert.equal(found.id, seeded.project.id);

    const loaded = await repo.load(found.id);
    assert.equal(loaded.ok, true);

    const snapshots = await repo.listSnapshots(found.id);
    assert.ok(snapshots.every((snapshot) => snapshot.snapshotType === "named"));
    assert.deepEqual(
      new Set(snapshots.map((snapshot) => snapshot.name)),
      new Set(DEMO_SNAPSHOT_NAMES),
    );
  });

  it("does not modify unrelated projects", async () => {
    const { repo } = tempRepo();
    const other = await repo.create({
      name: "Unrelated Border Fence Project",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: {
        systemName: "Fence",
        organizationName: "Other Org",
        systemDescription: "not the demo",
      },
      implementations: {
        "ac-1": { status: "in-progress", narrative: "keep me" },
      },
    });

    await seedDemoProject(repo, { validateOscal: false });
    await seedDemoProject(repo, { reset: true, validateOscal: false });

    const otherLoaded = await repo.load(other.id);
    assert.equal(otherLoaded.ok, true);
    if (!otherLoaded.ok) {
      return;
    }
    assert.equal(otherLoaded.project.name, "Unrelated Border Fence Project");
    assert.equal(
      otherLoaded.project.implementations["ac-1"]?.narrative,
      "keep me",
    );

    const listed = await repo.list();
    assert.equal(listed.length, 2);
  });

  it("optionally validates exported OSCAL SSP against the pinned schema", async () => {
    const { repo } = tempRepo();
    const result = await seedDemoProject(repo, { validateOscal: true });
    assert.equal(result.status, "created");
    assert.ok(result.oscalValidation);
    assert.equal(result.oscalValidation.ok, true);
    assert.ok(result.project);

    const domain = assembleProject({
      metadata: result.project.metadata,
      frameworkControls: FRAMEWORK_CONTROLS,
      implementations: result.project.implementations,
    });
    const revalidated = validateOscalSspDocument(projectToOscalSsp(domain));
    assert.equal(revalidated.ok, true);
  });
});
