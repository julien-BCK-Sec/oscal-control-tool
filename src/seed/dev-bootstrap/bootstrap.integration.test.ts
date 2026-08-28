import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { createPostgresEvidenceService } from "@/persistence/postgres/evidence-service";
import { FRAMEWORK_CONTROLS, resolveFrameworkControls } from "@/data/framework";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import { CMMC_LEVEL_2_REQUIREMENT_COUNT } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/families";
import {
  DOD_CLOUD_IL4_FRAMEWORK_ID,
  IL4_TOTAL_COUNT,
} from "@/framework/dod-cloud-il4-rev5/identities";
import {
  NIST_HIGH_FRAMEWORK_ID,
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
} from "@/framework/nist-sp-800-53-rev5/identities";
import { CANONICAL_ORGS, CANONICAL_PROJECTS } from "@/seed/demo/catalog";
import { cmmcAddressedCount, il4RepresentativeIds } from "@/seed/demo/supporting";
import { ensureCanonicalDemoEnvironment } from "@/seed/canonical-demo";
import { resetActivityTimestampClock } from "@/persistence/activity-clock";

afterEach(async () => {
  await closeDb();
  resetActivityTimestampClock();
});

async function seedOnce(db: Awaited<ReturnType<typeof openTestDb>>) {
  return ensureCanonicalDemoEnvironment(db, { validateOscal: false });
}

describe("canonical demo seed (integration)", () => {
  it("creates CGDS flagship, supporting projects, and CMMC Level 2 coverage", async () => {
    const db = await openTestDb();
    const { identity, projects } = await seedOnce(db);

    assert.equal(identity.orgs.cgds.name, CANONICAL_ORGS.cgds.name);
    assert.equal(identity.orgs.cgds.slug, CANONICAL_ORGS.cgds.slug);
    assert.equal(projects.flagship.name, CANONICAL_PROJECTS.flagship.name);
    assert.equal(projects.flagship.frameworkId, NIST_MODERATE_FRAMEWORK_ID);
    assert.equal(
      Object.keys(projects.flagship.implementations).length,
      FRAMEWORK_CONTROLS.length,
    );

    assert.equal(projects.cmmc.name, CANONICAL_PROJECTS.cmmc.name);
    assert.equal(projects.cmmc.frameworkId, CMMC_LEVEL_2_FRAMEWORK_ID);
    assert.equal(
      Object.keys(projects.cmmc.implementations).length,
      cmmcAddressedCount(),
    );
    assert.equal(CMMC_LEVEL_2_REQUIREMENT_COUNT, 110);
    assert.ok(Object.keys(projects.cmmc.implementations).length < 110);
    assert.ok(Object.keys(projects.cmmc.implementations).length > 10);
    assert.ok(
      Object.values(projects.cmmc.implementations).some(
        (row) => row.status === "implemented",
      ),
    );
    assert.ok(
      Object.values(projects.cmmc.implementations).some(
        (row) => row.status === "in-progress",
      ),
    );

    assert.equal(projects.early.frameworkId, NIST_LOW_FRAMEWORK_ID);
    assert.ok(Object.keys(projects.early.implementations).length < 10);
    assert.equal(projects.evidenceGap.frameworkId, NIST_MODERATE_FRAMEWORK_ID);
    assert.ok(
      Object.keys(projects.evidenceGap.implementations).length >
        Object.keys(projects.early.implementations).length,
    );
    assert.equal(projects.high.frameworkId, NIST_HIGH_FRAMEWORK_ID);
    assert.ok(
      Object.keys(projects.high.implementations).length <
        Object.keys(projects.flagship.implementations).length,
    );

    assert.equal(projects.il4.name, CANONICAL_PROJECTS.il4.name);
    assert.equal(projects.il4.frameworkId, DOD_CLOUD_IL4_FRAMEWORK_ID);
    assert.equal(
      resolveFrameworkControls(projects.il4.frameworkId).length,
      IL4_TOTAL_COUNT,
    );
    const il4Ids = new Set(il4RepresentativeIds());
    for (const id of il4Ids) {
      assert.ok(projects.il4.implementations[id], `IL4 demo missing ${id}`);
    }
    assert.ok(Object.keys(projects.il4.implementations).length < IL4_TOTAL_COUNT);
    assert.notEqual(projects.il4.implementations["sc-46"]?.status, "not-applicable");
    assert.match(
      projects.il4.implementations["ac-7"]?.narrative ?? "",
      /has not invented a DSPAV/i,
    );

    const evidence = createPostgresEvidenceService(db);
    const flagshipEvidence = await evidence.listByProject(projects.flagship.id);
    const gapEvidence = await evidence.listByProject(projects.evidenceGap.id);
    const earlyEvidence = await evidence.listByProject(projects.early.id);
    const cmmcEvidence = await evidence.listByProject(projects.cmmc.id);
    const il4Evidence = await evidence.listByProject(projects.il4.id);
    assert.ok(flagshipEvidence.length >= 8);
    assert.ok(flagshipEvidence.length > gapEvidence.length);
    assert.equal(earlyEvidence.length, 0);
    assert.ok(cmmcEvidence.length >= 2);
    assert.ok(cmmcEvidence.some((row) => row.status === "active"));
    assert.ok(
      flagshipEvidence.some((row) =>
        row.controlIds.includes("ac-2"),
      ),
    );
    assert.ok(il4Evidence.some((row) => row.status === "active"));
    assert.ok(
      il4Evidence.some(
        (row) =>
          row.controlIds.includes("ac-2") && row.controlIds.includes("grr-1"),
      ),
    );
  });

  it("is idempotent across two runs and does not destroy user edits", async () => {
    const db = await openTestDb();
    const first = await seedOnce(db);
    assert.ok(first.commentsCreated > 0);
    assert.ok(first.assignmentsCreated > 0);
    assert.ok(first.evidenceCreated > 0);

    const repository = createPostgresProjectRepository(db);
    const loaded = await repository.load(first.projects.flagship.id);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) {
      return;
    }
    const editedNarrative = "User-edited AC-1 narrative for preservation test.";
    const saved = await repository.save({
      id: loaded.project.id,
      name: loaded.project.name,
      frameworkId: loaded.project.frameworkId,
      metadata: loaded.project.metadata,
      implementations: {
        ...loaded.project.implementations,
        "ac-1": {
          status: "in-progress",
          narrative: editedNarrative,
        },
      },
      expectedRevision: loaded.project.revision,
    });
    assert.equal(saved.ok, true);

    const second = await seedOnce(db);
    assert.equal(second.identity.orgs.cgds.created, false);
    assert.equal(second.identity.orgs.contoso.created, false);
    assert.equal(second.identity.orgs.firstdoor.created, false);
    assert.ok(
      Object.values(second.identity.users).every(
        (user) => user.created === false,
      ),
    );
    assert.deepEqual(second.projects.created, []);
    assert.equal(second.projects.flagship.id, first.projects.flagship.id);
    assert.equal(
      second.projects.flagship.implementations["ac-1"]?.narrative,
      editedNarrative,
    );
    assert.equal(second.commentsCreated, 0);
    assert.equal(second.assignmentsCreated, 0);
    assert.equal(second.evidenceCreated, 0);

    const orgRepo = createPostgresOrganizationRepository(db);
    const cgdsMembers = await orgRepo.listMembers(first.identity.orgs.cgds.id);
    const contosoMembers = await orgRepo.listMembers(
      first.identity.orgs.contoso.id,
    );
    const firstdoorMembers = await orgRepo.listMembers(
      first.identity.orgs.firstdoor.id,
    );
    assert.equal(
      cgdsMembers.some((m) => m.email === "oscar@example.com"),
      false,
    );
    assert.equal(
      contosoMembers.some((m) => m.email === "alice@example.com"),
      false,
    );
    assert.equal(
      firstdoorMembers.some((m) => m.email === "alice@example.com"),
      false,
    );
    assert.equal(
      cgdsMembers.some((m) => m.email === "julien@example.com"),
      false,
    );
    assert.equal(firstdoorMembers.length, 7);
    assert.ok(
      firstdoorMembers.every((m) => m.role === "organization_admin"),
    );
    assert.ok(
      firstdoorMembers.some((m) => m.email === "julien@example.com"),
    );
    assert.ok(firstdoorMembers.some((m) => m.email === "test@example.com"));

    const cgdsProjects = await repository.list(first.identity.orgs.cgds.id);
    const contosoProjects = await repository.list(
      first.identity.orgs.contoso.id,
    );
    const firstdoorProjects = await repository.list(
      first.identity.orgs.firstdoor.id,
    );
    assert.equal(cgdsProjects.length, 6);
    assert.equal(contosoProjects.length, 1);
    assert.equal(firstdoorProjects.length, 1);
    assert.ok(
      cgdsProjects.some((p) => p.name === CANONICAL_PROJECTS.flagship.name),
    );
    assert.ok(
      cgdsProjects.some((p) => p.name === CANONICAL_PROJECTS.il4.name),
    );
    assert.ok(
      contosoProjects.some(
        (p) => p.name === CANONICAL_PROJECTS.contosoCloud.name,
      ),
    );
    assert.ok(
      firstdoorProjects.some(
        (p) => p.name === CANONICAL_PROJECTS.firstdoorCloud.name,
      ),
    );
    assert.equal(
      first.projects.firstdoorCloud.frameworkId,
      NIST_MODERATE_FRAMEWORK_ID,
    );

    const discussions = createPostgresDiscussionService(db);
    const gooseAc2 = await discussions.listComments(
      first.identity.orgs.cgds.id,
      first.projects.flagship.id,
      "ac-2",
    );
    assert.ok(gooseAc2.length >= 2);
    const contosoLeak = await discussions.listComments(
      first.identity.orgs.contoso.id,
      first.projects.flagship.id,
      "ac-2",
    );
    assert.deepEqual(contosoLeak, []);
  });
});
