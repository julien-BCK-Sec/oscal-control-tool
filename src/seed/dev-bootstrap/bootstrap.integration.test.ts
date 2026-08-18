import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { createPostgresEvidenceService } from "@/persistence/postgres/evidence-service";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import { CMMC_LEVEL_2_REQUIREMENT_COUNT } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/families";
import {
  NIST_HIGH_FRAMEWORK_ID,
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
} from "@/framework/nist-sp-800-53-rev5/identities";
import { CANONICAL_ORGS, CANONICAL_PROJECTS } from "@/seed/demo/catalog";
import { ensureCanonicalDemoEvidence } from "@/seed/demo/evidence-seed";
import { cmmcAddressedCount } from "@/seed/demo/supporting";
import { ensureDemoIdentity } from "./identity";
import { ensureDemoProjects } from "./projects";
import { ensureDemoCollaboration } from "./collaboration";
import { resetActivityTimestampClock } from "@/persistence/activity-clock";

afterEach(async () => {
  await closeDb();
  resetActivityTimestampClock();
});

async function seedOnce(db: Awaited<ReturnType<typeof openTestDb>>) {
  const identity = await ensureDemoIdentity(db);
  const projects = await ensureDemoProjects(
    createPostgresProjectRepository(db),
    {
      cgds: identity.orgs.cgds.id,
      contoso: identity.orgs.contoso.id,
    },
    { validateOscal: false },
  );
  const collab = await ensureDemoCollaboration({
    db,
    users: identity.users,
    cgdsOrgId: identity.orgs.cgds.id,
    contosoOrgId: identity.orgs.contoso.id,
    flagship: projects.flagship,
    cmmc: projects.cmmc,
    early: projects.early,
    evidenceGap: projects.evidenceGap,
    high: projects.high,
    contosoCloud: projects.contosoCloud,
  });
  const evidence = await ensureCanonicalDemoEvidence({
    db,
    projects: {
      flagshipId: projects.flagship.id,
      cmmcId: projects.cmmc.id,
      earlyId: projects.early.id,
      evidenceGapId: projects.evidenceGap.id,
      highId: projects.high.id,
    },
    actor: {
      actorId: identity.users["bob@example.com"]!.id,
      actorDisplayName: identity.users["bob@example.com"]!.name,
    },
  });
  return { identity, projects, collab, evidence };
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

    const evidence = createPostgresEvidenceService(db);
    const flagshipEvidence = await evidence.listByProject(projects.flagship.id);
    const gapEvidence = await evidence.listByProject(projects.evidenceGap.id);
    const earlyEvidence = await evidence.listByProject(projects.early.id);
    const cmmcEvidence = await evidence.listByProject(projects.cmmc.id);
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
  });

  it("is idempotent across two runs and does not destroy user edits", async () => {
    const db = await openTestDb();
    const first = await seedOnce(db);
    assert.ok(first.collab.commentsCreated > 0);
    assert.ok(first.collab.assignmentsCreated > 0);
    assert.ok(first.evidence.created > 0);

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

    const secondIdentity = await ensureDemoIdentity(db);
    assert.equal(secondIdentity.orgs.cgds.created, false);
    assert.equal(secondIdentity.orgs.contoso.created, false);
    assert.ok(
      Object.values(secondIdentity.users).every((user) => user.created === false),
    );

    const secondProjects = await ensureDemoProjects(
      repository,
      {
        cgds: secondIdentity.orgs.cgds.id,
        contoso: secondIdentity.orgs.contoso.id,
      },
      { validateOscal: false },
    );
    assert.deepEqual(secondProjects.created, []);
    assert.equal(secondProjects.flagship.id, first.projects.flagship.id);
    assert.equal(
      secondProjects.flagship.implementations["ac-1"]?.narrative,
      editedNarrative,
    );

    const secondCollab = await ensureDemoCollaboration({
      db,
      users: secondIdentity.users,
      cgdsOrgId: secondIdentity.orgs.cgds.id,
      contosoOrgId: secondIdentity.orgs.contoso.id,
      flagship: secondProjects.flagship,
      cmmc: secondProjects.cmmc,
      early: secondProjects.early,
      evidenceGap: secondProjects.evidenceGap,
      high: secondProjects.high,
      contosoCloud: secondProjects.contosoCloud,
    });
    assert.equal(secondCollab.commentsCreated, 0);
    assert.equal(secondCollab.assignmentsCreated, 0);

    const secondEvidence = await ensureCanonicalDemoEvidence({
      db,
      projects: {
        flagshipId: secondProjects.flagship.id,
        cmmcId: secondProjects.cmmc.id,
        earlyId: secondProjects.early.id,
        evidenceGapId: secondProjects.evidenceGap.id,
        highId: secondProjects.high.id,
      },
      actor: {
        actorId: secondIdentity.users["bob@example.com"]!.id,
        actorDisplayName: secondIdentity.users["bob@example.com"]!.name,
      },
    });
    assert.equal(secondEvidence.created, 0);

    const orgRepo = createPostgresOrganizationRepository(db);
    const cgdsMembers = await orgRepo.listMembers(first.identity.orgs.cgds.id);
    const contosoMembers = await orgRepo.listMembers(
      first.identity.orgs.contoso.id,
    );
    assert.equal(
      cgdsMembers.some((m) => m.email === "oscar@example.com"),
      false,
    );
    assert.equal(
      contosoMembers.some((m) => m.email === "alice@example.com"),
      false,
    );

    const cgdsProjects = await repository.list(first.identity.orgs.cgds.id);
    const contosoProjects = await repository.list(
      first.identity.orgs.contoso.id,
    );
    assert.equal(cgdsProjects.length, 5);
    assert.equal(contosoProjects.length, 1);
    assert.ok(
      cgdsProjects.some((p) => p.name === CANONICAL_PROJECTS.flagship.name),
    );
    assert.ok(
      contosoProjects.some(
        (p) => p.name === CANONICAL_PROJECTS.contosoCloud.name,
      ),
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
