/**
 * Milestone 4 repository smoke test (non-UI).
 * Usage: npx tsx scripts/smoke-persistence.ts
 */
import assert from "node:assert/strict";
import { FRAMEWORK_CONTROLS } from "../src/data/framework";
import { assembleProject } from "../src/domain";
import { NIST_MODERATE_FRAMEWORK_ID } from "../src/framework/nist-moderate/derive";
import { projectToOscalSsp, validateOscalSspDocument } from "../src/oscal";
import { closeDb, getDb } from "../src/persistence/sqlite/client";
import { createSqliteProjectRepository } from "../src/persistence/sqlite/project-repository";

async function main(): Promise<void> {
  const repo = createSqliteProjectRepository(getDb());

  const created = await repo.create({
    name: "Smoke Project",
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    metadata: {
      systemName: "Smoke System",
      organizationName: "Smoke Org",
      systemDescription: "Smoke test system",
    },
    implementations: {
      "ac-1": { status: "in-progress", narrative: "initial" },
    },
  });

  const saved = await repo.save({
    id: created.id,
    name: created.name,
    frameworkId: created.frameworkId,
    metadata: {
      ...created.metadata,
      systemDescription: "updated description",
    },
    implementations: {
      "ac-1": { status: "implemented", narrative: "autosaved narrative" },
    },
    expectedRevision: created.revision,
  });
  assert.ok(saved.ok);

  const auto = await repo.createAutomaticSnapshotNow(created.id);
  assert.ok(auto);

  const named = await repo.createNamedVersion({
    projectId: created.id,
    name: "Ready for Audit",
    expectedRevision: saved.ok ? saved.project.revision : 1,
  });
  assert.ok(named.ok);

  const afterEdit = await repo.save({
    id: created.id,
    name: "Smoke Project",
    frameworkId: created.frameworkId,
    metadata: created.metadata,
    implementations: {
      "ac-1": { status: "implemented", narrative: "changed after version" },
    },
    expectedRevision: saved.ok ? saved.project.revision : 1,
  });
  assert.ok(afterEdit.ok);
  if (!afterEdit.ok || !named.ok) {
    throw new Error("unexpected");
  }

  const restored = await repo.restoreSnapshot({
    projectId: created.id,
    snapshotId: named.snapshot.id,
    expectedRevision: afterEdit.project.revision,
  });
  assert.ok(restored.ok);
  if (!restored.ok) {
    throw new Error("restore failed");
  }
  assert.equal(
    restored.project.implementations["ac-1"]?.narrative,
    "autosaved narrative",
  );

  const renamed = await repo.rename(created.id, "Smoke Renamed");
  assert.ok(renamed);

  const domain = assembleProject({
    metadata: restored.project.metadata,
    frameworkControls: FRAMEWORK_CONTROLS,
    implementations: restored.project.implementations,
  });
  const oscal = projectToOscalSsp(domain);
  const validation = validateOscalSspDocument(oscal);
  assert.equal(validation.ok, true);

  await repo.delete(created.id);
  closeDb();
  console.log("Smoke persistence checks passed.");
}

main().catch((error) => {
  console.error(error);
  closeDb();
  process.exit(1);
});
