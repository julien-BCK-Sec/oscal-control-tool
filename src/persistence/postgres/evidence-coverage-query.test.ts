import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { randomUUID } from "node:crypto";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresControlRecordRepository } from "@/persistence/postgres/control-record-repository";
import { createPostgresEvidenceCoverageQuery } from "@/persistence/postgres/evidence-coverage-query";
import { createPostgresEvidenceService } from "@/persistence/postgres/evidence-service";
import { createPostgresEvidenceVersionRepository } from "@/persistence/postgres/evidence-version-repository";
import { createTestProjectRepository } from "@/persistence/postgres/testing";

afterEach(async () => {
  await closeDb();
});

async function setup() {
  const db = await openTestDb();
  const projects = createTestProjectRepository(db);
  const evidence = createPostgresEvidenceService(db);
  const coverage = createPostgresEvidenceCoverageQuery(db);
  const controlRecords = createPostgresControlRecordRepository(db);
  const versions = createPostgresEvidenceVersionRepository(db);
  const project = await projects.create({
    name: "Coverage Project",
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
  });
  return { db, projects, evidence, coverage, controlRecords, versions, project };
}

async function attachVersion(
  versions: ReturnType<typeof createPostgresEvidenceVersionRepository>,
  projectId: string,
  evidenceId: string,
): Promise<void> {
  await versions.insertVersionAndSetCurrent({
    id: randomUUID(),
    evidenceId,
    projectId,
    originalFilename: "artifact.pdf",
    storageKey: `test/${randomUUID()}`,
    mimeType: "application/pdf",
    sizeBytes: 12,
    sha256: "a".repeat(64),
    uploadedByUserId: "user-1",
    uploadedAt: "2026-06-01T00:00:00.000Z",
  });
}

describe("evidence coverage query", () => {
  it("treats controls without ControlRecords as required and missing", async () => {
    const { coverage, project } = await setup();
    const result = await coverage.getProjectCoverage({
      projectId: project.id,
      controlIds: ["ac-1", "ac-2"],
      asOfDate: "2026-06-01",
    });
    assert.equal(result.summary.totalControls, 2);
    assert.equal(result.summary.requiredControls, 2);
    assert.equal(result.summary.requiredMissingEvidence, 2);
    assert.equal(result.summary.requiredWithEvidence, 0);
    assert.ok(result.controls.every((row) => row.coverageState === "required_missing"));
  });

  it("does not count draft or archived Evidence as present", async () => {
    const { evidence, coverage, project } = await setup();
    await evidence.create(
      {
        projectId: project.id,
        title: "Draft policy",
        evidenceType: "policy",
        status: "draft",
        controlIds: ["ac-1"],
      },
      SYSTEM_ACTOR,
    );
    const archived = await evidence.create(
      {
        projectId: project.id,
        title: "Old log",
        evidenceType: "log",
        status: "active",
        controlIds: ["ac-1"],
      },
      SYSTEM_ACTOR,
    );
    await evidence.archive(project.id, archived.evidence.id, SYSTEM_ACTOR);

    const result = await coverage.getProjectCoverage({
      projectId: project.id,
      controlIds: ["ac-1"],
      asOfDate: "2026-06-01",
    });
    const control = result.controls[0];
    assert.equal(control?.coverageState, "required_missing");
    assert.equal(control?.activeEvidenceCount, 0);
    assert.equal(control?.draftEvidenceCount, 1);
    assert.equal(result.summary.archivedEvidence, 1);
    assert.equal(result.summary.draftEvidence, 1);
  });

  it("counts active Evidence without a current Version as present", async () => {
    const { evidence, coverage, project } = await setup();
    await evidence.create(
      {
        projectId: project.id,
        title: "Attestation",
        evidenceType: "attestation",
        status: "active",
        controlIds: ["ac-2"],
      },
      SYSTEM_ACTOR,
    );
    const result = await coverage.getProjectCoverage({
      projectId: project.id,
      controlIds: ["ac-2"],
      asOfDate: "2026-06-01",
    });
    const control = result.controls[0];
    assert.equal(control?.coverageState, "required_present");
    assert.equal(control?.activeEvidenceCount, 1);
    assert.equal(control?.evidenceWithCurrentVersionCount, 0);
    assert.equal(control?.evidenceWithoutCurrentVersionCount, 1);
    assert.equal(result.summary.requiredWithEvidence, 1);
  });

  it("counts active Evidence with a current Version and shared links", async () => {
    const { evidence, coverage, versions, project } = await setup();
    const created = await evidence.create(
      {
        projectId: project.id,
        title: "Shared screenshot",
        evidenceType: "screenshot",
        status: "active",
        controlIds: ["ac-2", "ac-3"],
      },
      SYSTEM_ACTOR,
    );
    await attachVersion(versions, project.id, created.evidence.id);

    const result = await coverage.getProjectCoverage({
      projectId: project.id,
      controlIds: ["ac-2", "ac-3"],
      asOfDate: "2026-06-01",
    });
    assert.equal(result.summary.requiredWithEvidence, 2);
    assert.ok(
      result.controls.every(
        (row) =>
          row.coverageState === "required_present" &&
          row.evidenceWithCurrentVersionCount === 1,
      ),
    );
  });

  it("distinguishes optional, not required, and required missing", async () => {
    const { coverage, controlRecords, project } = await setup();
    await controlRecords.upsert(project.id, {
      controlId: "ac-4",
      owner: "",
      coOwner: "",
      businessUnit: "",
      implementationStatus: "draft",
      evidenceRequirement: "optional",
      reviewDueDate: null,
    });
    await controlRecords.upsert(project.id, {
      controlId: "ac-5",
      owner: "",
      coOwner: "",
      businessUnit: "",
      implementationStatus: "draft",
      evidenceRequirement: "not_required",
      reviewDueDate: null,
    });
    const result = await coverage.getProjectCoverage({
      projectId: project.id,
      controlIds: ["ac-4", "ac-5", "ac-6"],
      asOfDate: "2026-06-01",
    });
    const byId = Object.fromEntries(
      result.controls.map((row) => [row.controlId, row.coverageState]),
    );
    assert.equal(byId["ac-4"], "optional_absent");
    assert.equal(byId["ac-5"], "not_required");
    assert.equal(byId["ac-6"], "required_missing");
    assert.equal(result.summary.optionalControls, 1);
    assert.equal(result.summary.notRequiredControls, 1);
    assert.equal(result.summary.requiredMissingEvidence, 1);
  });

  it("counts due soon, overdue, and unlinked Evidence without double-counting shared links", async () => {
    const { evidence, coverage, project } = await setup();
    await evidence.create(
      {
        projectId: project.id,
        title: "Due soon shared",
        evidenceType: "document",
        status: "active",
        reviewDueDate: "2026-06-10",
        controlIds: ["ac-2", "ac-3"],
      },
      SYSTEM_ACTOR,
    );
    await evidence.create(
      {
        projectId: project.id,
        title: "Overdue",
        evidenceType: "document",
        status: "active",
        reviewDueDate: "2026-05-01",
        controlIds: ["ac-2"],
      },
      SYSTEM_ACTOR,
    );
    await evidence.create(
      {
        projectId: project.id,
        title: "Unlinked draft",
        evidenceType: "other",
        status: "draft",
      },
      SYSTEM_ACTOR,
    );

    const result = await coverage.getProjectCoverage({
      projectId: project.id,
      controlIds: ["ac-2", "ac-3"],
      asOfDate: "2026-06-01",
    });
    assert.equal(result.summary.dueSoonEvidence, 1);
    assert.equal(result.summary.overdueEvidence, 1);
    assert.equal(result.summary.unlinkedEvidence, 1);
    const ac2 = result.controls.find((row) => row.controlId === "ac-2");
    assert.equal(ac2?.dueSoonCount, 1);
    assert.equal(ac2?.overdueCount, 1);
    assert.equal(ac2?.activeEvidenceCount, 2);
  });

  it("isolates coverage by project", async () => {
    const { projects, evidence, coverage, project } = await setup();
    const other = await projects.create({
      name: "Other",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    await evidence.create(
      {
        projectId: project.id,
        title: "Only here",
        evidenceType: "document",
        status: "active",
        controlIds: ["ac-1"],
      },
      SYSTEM_ACTOR,
    );
    const otherResult = await coverage.getProjectCoverage({
      projectId: other.id,
      controlIds: ["ac-1"],
      asOfDate: "2026-06-01",
    });
    assert.equal(otherResult.summary.requiredMissingEvidence, 1);
    assert.equal(otherResult.summary.requiredWithEvidence, 0);
  });

  it("emits inventory rows per association and unlinked evidence without storage keys", async () => {
    const { evidence, coverage, versions, project } = await setup();
    const created = await evidence.create(
      {
        projectId: project.id,
        title: 'Say "hello", team',
        evidenceType: "policy",
        status: "active",
        collectionDate: "2026-01-01",
        reviewDueDate: "2026-06-15",
        controlIds: ["ac-2", "ac-3"],
      },
      SYSTEM_ACTOR,
    );
    await attachVersion(versions, project.id, created.evidence.id);
    await evidence.create(
      {
        projectId: project.id,
        title: "Orphan",
        evidenceType: "other",
        status: "draft",
      },
      SYSTEM_ACTOR,
    );

    const inventory = await coverage.getInventory({
      projectId: project.id,
      controlIds: ["ac-2", "ac-3"],
      asOfDate: "2026-06-01",
    });
    assert.equal(inventory.rows.length, 3);
    const linked = inventory.rows.filter((row) => row.controlId !== null);
    const unlinked = inventory.rows.filter((row) => row.controlId === null);
    assert.equal(linked.length, 2);
    assert.equal(unlinked.length, 1);
    assert.equal(unlinked[0]?.evidenceRequirement, null);
    assert.equal(linked[0]?.currentVersionFilename, "artifact.pdf");
    assert.ok(
      inventory.rows.every(
        (row) => !("storageKey" in row) && !("storage_key" in row),
      ),
    );
  });
});

describe("evidence search filters", () => {
  it("filters by freshness, owner, linked, and current version", async () => {
    const { evidence, versions, project } = await setup();
    const withFile = await evidence.create(
      {
        projectId: project.id,
        title: "Linked current",
        owner: "Priya Sharma",
        evidenceType: "document",
        status: "active",
        reviewDueDate: "2026-12-01",
        controlIds: ["ac-2"],
      },
      SYSTEM_ACTOR,
    );
    await attachVersion(versions, project.id, withFile.evidence.id);
    await evidence.create(
      {
        projectId: project.id,
        title: "Unlinked overdue",
        owner: "Sam Okonkwo",
        evidenceType: "log",
        status: "active",
        reviewDueDate: "2026-01-01",
      },
      SYSTEM_ACTOR,
    );

    const dueSoon = await evidence.search({
      projectId: project.id,
      freshness: "overdue",
      asOfDate: "2026-06-01",
    });
    assert.equal(dueSoon.items.length, 1);
    assert.equal(dueSoon.items[0]?.title, "Unlinked overdue");
    assert.equal(dueSoon.items[0]?.freshness, "overdue");
    assert.equal(dueSoon.items[0]?.linkedControlCount, 0);

    const ownerPage = await evidence.search({
      projectId: project.id,
      owner: "priya",
      asOfDate: "2026-06-01",
    });
    assert.equal(ownerPage.items.length, 1);
    assert.equal(ownerPage.items[0]?.title, "Linked current");

    const unlinked = await evidence.search({
      projectId: project.id,
      linked: false,
      asOfDate: "2026-06-01",
    });
    assert.equal(unlinked.items.length, 1);

    const withVersion = await evidence.search({
      projectId: project.id,
      hasCurrentVersion: true,
      asOfDate: "2026-06-01",
    });
    assert.equal(withVersion.items.length, 1);
    assert.equal(withVersion.items[0]?.currentVersion?.originalFilename, "artifact.pdf");

    const current = await evidence.search({
      projectId: project.id,
      freshness: "current",
      asOfDate: "2026-06-01",
    });
    assert.equal(current.items.length, 1);
    assert.equal(current.items[0]?.freshness, "current");
  });

  it("keeps keyset pagination and excludes archived by default", async () => {
    const { evidence, project } = await setup();
    const first = await evidence.create(
      {
        projectId: project.id,
        title: "Alpha",
        evidenceType: "other",
        status: "active",
      },
      SYSTEM_ACTOR,
    );
    await evidence.create(
      {
        projectId: project.id,
        title: "Beta",
        evidenceType: "other",
        status: "draft",
      },
      SYSTEM_ACTOR,
    );
    await evidence.archive(project.id, first.evidence.id, SYSTEM_ACTOR);

    const page = await evidence.search({
      projectId: project.id,
      limit: 1,
      asOfDate: "2026-06-01",
    });
    assert.equal(page.items.length, 1);
    assert.equal(page.hasMore, false);
    assert.equal(page.items[0]?.title, "Beta");

    const withArchived = await evidence.search({
      projectId: project.id,
      excludeArchived: false,
      asOfDate: "2026-06-01",
    });
    assert.equal(withArchived.items.length, 2);
  });
});
