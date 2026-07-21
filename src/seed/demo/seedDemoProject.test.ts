import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { FRAMEWORK, FRAMEWORK_CONTROLS } from "@/data/framework";
import { assembleProject } from "@/domain";
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
  analyzeDemoNarrativeCoverage,
  buildCompleteDemoImplementations,
  buildDemoImplementationsForStage,
  buildDemoMetadata,
  buildFinalDemoImplementations,
  collectDemoNarratives,
  demoBaselineControlCount,
  familyImplementationCounts,
  featuredNarratives,
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

afterEach(() => {
  closeDb();
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("demo baseline coverage", () => {
  it("covers every FrameworkProvider control exactly once", () => {
    const narratives = collectDemoNarratives();
    const coverage = analyzeDemoNarrativeCoverage(narratives);

    assert.equal(coverage.frameworkId, FRAMEWORK.id);
    assert.equal(coverage.baselineCount, FRAMEWORK_CONTROLS.length);
    assert.equal(coverage.narrativeCount, FRAMEWORK_CONTROLS.length);
    assert.deepEqual(coverage.missingIds, []);
    assert.deepEqual(coverage.unknownIds, []);
    assert.deepEqual(coverage.duplicateIds, []);
    assert.equal(demoBaselineControlCount(), FRAMEWORK_CONTROLS.length);
  });

  it("builds implementations in framework order without unknown ids", () => {
    const implementations = buildCompleteDemoImplementations();
    const ids = Object.keys(implementations);
    assert.equal(ids.length, FRAMEWORK_CONTROLS.length);
    assert.deepEqual(
      ids,
      FRAMEWORK_CONTROLS.map((control) => control.id),
    );

    for (const control of FRAMEWORK_CONTROLS) {
      assert.equal(implementations[control.id]?.status, "implemented");
      assert.ok(implementations[control.id]?.narrative.trim().length > 0);
    }
  });

  it("reports family counts that sum to the baseline", () => {
    const implementations = buildCompleteDemoImplementations();
    const counts = familyImplementationCounts(implementations);
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    assert.equal(total, FRAMEWORK_CONTROLS.length);
    assert.ok(Object.keys(counts).length >= 10);
  });
});

describe("demo seed content", () => {
  it("builds valid complete metadata and implementations", () => {
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
    assert.equal(Object.keys(implementations).length, FRAMEWORK_CONTROLS.length);

    const validation = validateDemoProjectContent({
      metadata,
      implementations,
      frameworkControlIds,
      requireCompleteBaseline: true,
    });
    assert.equal(validation.ok, true);
  });

  it("preserves featured narratives and canonical terminology", () => {
    const featured = featuredNarratives();
    assert.equal(Object.keys(featured).length, DEMO_CONTROL_IDS.length);
    for (const id of DEMO_CONTROL_IDS) {
      assert.ok(featured[id]?.includes("CGDS") || featured[id]?.length);
      assert.match(featured[id] ?? "", /\S/);
    }

    const final = buildFinalDemoImplementations();
    assert.match(final["ac-1"]?.narrative ?? "", /CGDS-POL-001/);
    assert.match(final["cm-2"]?.narrative ?? "", /prod-final-final-v2/);
    assert.match(final["cp-9"]?.narrative ?? "", /Schrödinger/);
    assert.match(final["pe-3"]?.narrative ?? "", /Controlled Bread Exception/);
    assert.match(
      final["at-1"]?.narrative ?? "",
      new RegExp(`must not feed ${DEMO_PEOPLE.garyMercer.name}`),
    );
    assert.match(final["si-4"]?.narrative ?? "", /NestWatch/);
    const allNarratives = Object.values(final)
      .map((item) => item.narrative)
      .join("\n");
    assert.match(allNarratives, new RegExp(DEMO_TERMS.honkProtocol));
    assert.doesNotMatch(allNarratives, /Honksworth/);
  });

  it("keeps Gary's veterinary clearance out of early stages", () => {
    const early = buildDemoImplementationsForStage(0);
    const mid = buildDemoImplementationsForStage(2);
    const final = buildFinalDemoImplementations();
    const veterinary = /annual veterinary examination/i;
    const allEarlyMid = [
      ...Object.values(early).map((item) => item.narrative),
      ...Object.values(mid).map((item) => item.narrative),
      ...Object.values(collectDemoNarratives()),
    ].join("\n");

    assert.doesNotMatch(early["pl-2"]?.narrative ?? "", veterinary);
    assert.doesNotMatch(mid["pl-2"]?.narrative ?? "", veterinary);
    assert.doesNotMatch(allEarlyMid, /remains cleared for operational deployment/i);
    assert.match(final["pl-2"]?.narrative ?? "", veterinary);
    assert.match(
      final["pl-2"]?.narrative ?? "",
      /remains cleared for operational deployment/i,
    );
  });

  it("does not explain coconut purpose", () => {
    const prose = Object.values(buildFinalDemoImplementations())
      .map((item) => item.narrative)
      .join("\n");
    assert.match(prose, /Emergency Coconut Reserve/);
    assert.doesNotMatch(prose, /coconut(?:s)? (?:are|is) (?:used|needed|required) (?:to|for)/i);
    assert.doesNotMatch(prose, /purpose of (?:the )?coconut/i);
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
  it("creates the complete baseline demo through the repository", async () => {
    const { repo } = tempRepo();
    const result = await seedDemoProject(
      repo,
      { validateOscal: false },
      { databasePathHint: "temp" },
    );

    assert.equal(result.status, "created");
    assert.ok(result.project);
    assert.equal(result.project.name, DEMO_PROJECT_NAME);
    assert.equal(result.project.frameworkId, FRAMEWORK.id);
    assert.equal(result.controlCount, FRAMEWORK_CONTROLS.length);
    assert.equal(result.baselineControlCount, FRAMEWORK_CONTROLS.length);
    assert.equal(result.domainValidationOk, true);
    assert.deepEqual(result.snapshotNames, [...DEMO_SNAPSHOT_NAMES]);

    const loaded = await repo.load(result.project.id);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) {
      return;
    }
    assert.equal(
      Object.keys(loaded.project.implementations).length,
      FRAMEWORK_CONTROLS.length,
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
    assert.equal(second.controlCount, FRAMEWORK_CONTROLS.length);

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

    const reset = await seedDemoProject(repo, {
      reset: true,
      validateOscal: false,
    });
    assert.equal(reset.status, "reset");
    assert.ok(reset.project);
    assert.notEqual(reset.project.id, firstId);
    assert.equal(reset.controlCount, FRAMEWORK_CONTROLS.length);

    const oldLoad = await repo.load(firstId);
    assert.equal(oldLoad.ok, false);
    assert.equal((await repo.listSnapshots(firstId)).length, 0);

    const newSnapshots = await repo.listSnapshots(reset.project.id);
    assert.equal(newSnapshots.length, DEMO_SNAPSHOT_NAMES.length);
    assert.deepEqual(
      new Set(newSnapshots.map((snapshot) => snapshot.name)),
      new Set(DEMO_SNAPSHOT_NAMES),
    );
  });

  it("loads through ProjectRepository and keeps named snapshots", async () => {
    const { repo } = tempRepo();
    const seeded = await seedDemoProject(repo, { validateOscal: false });
    assert.ok(seeded.project);

    const found = await findDemoProject(repo);
    assert.ok(found);
    assert.equal(found.id, seeded.project.id);

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
      frameworkId: FRAMEWORK.id,
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
    assert.equal((await repo.list()).length, 2);
  });

  it("optionally validates exported OSCAL SSP against the pinned schema", async () => {
    const { repo } = tempRepo();
    const result = await seedDemoProject(repo, { validateOscal: true });
    assert.equal(result.status, "created");
    assert.ok(result.oscalValidation);
    assert.equal(result.oscalValidation.ok, true);
    assert.ok(result.project);
    assert.equal(result.controlCount, FRAMEWORK_CONTROLS.length);

    const domain = assembleProject({
      metadata: result.project.metadata,
      frameworkControls: FRAMEWORK_CONTROLS,
      implementations: result.project.implementations,
    });
    const revalidated = validateOscalSspDocument(projectToOscalSsp(domain));
    assert.equal(revalidated.ok, true);
  });
});
