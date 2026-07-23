import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { ensureDemoIdentity } from "./identity";
import { ensureDemoProjects } from "./projects";
import { ensureDemoCollaboration } from "./collaboration";
import { PROJECT_NAMES } from "./constants";
import { resetActivityTimestampClock } from "@/persistence/activity-clock";

afterEach(async () => {
  await closeDb();
  resetActivityTimestampClock();
});

describe("dev bootstrap identity/projects/collab (integration)", () => {
  it("is idempotent across two runs and isolates tenants", async () => {
    const db = await openTestDb();

    const firstIdentity = await ensureDemoIdentity(db);
    const firstProjects = await ensureDemoProjects(
      createPostgresProjectRepository(db),
      {
        acme: firstIdentity.orgs.acme.id,
        contoso: firstIdentity.orgs.contoso.id,
      },
    );
    const firstCollab = await ensureDemoCollaboration({
      db,
      users: firstIdentity.users,
      acmeOrgId: firstIdentity.orgs.acme.id,
      contosoOrgId: firstIdentity.orgs.contoso.id,
      goose: firstProjects.goose,
      customerA: firstProjects.customerA,
      lab: firstProjects.lab,
      contosoCloud: firstProjects.contosoCloud,
    });
    assert.ok(firstCollab.commentsCreated > 0);
    assert.ok(firstCollab.assignmentsCreated > 0);

    const secondIdentity = await ensureDemoIdentity(db);
    assert.equal(secondIdentity.orgs.acme.created, false);
    assert.equal(secondIdentity.orgs.contoso.created, false);
    assert.ok(
      Object.values(secondIdentity.users).every((user) => user.created === false),
    );

    const secondProjects = await ensureDemoProjects(
      createPostgresProjectRepository(db),
      {
        acme: secondIdentity.orgs.acme.id,
        contoso: secondIdentity.orgs.contoso.id,
      },
    );
    assert.deepEqual(secondProjects.created, []);
    assert.equal(secondProjects.goose.id, firstProjects.goose.id);

    const secondCollab = await ensureDemoCollaboration({
      db,
      users: secondIdentity.users,
      acmeOrgId: secondIdentity.orgs.acme.id,
      contosoOrgId: secondIdentity.orgs.contoso.id,
      goose: secondProjects.goose,
      customerA: secondProjects.customerA,
      lab: secondProjects.lab,
      contosoCloud: secondProjects.contosoCloud,
    });
    assert.equal(secondCollab.commentsCreated, 0);
    assert.equal(secondCollab.assignmentsCreated, 0);

    const orgRepo = createPostgresOrganizationRepository(db);
    const acmeMembers = await orgRepo.listMembers(firstIdentity.orgs.acme.id);
    const contosoMembers = await orgRepo.listMembers(
      firstIdentity.orgs.contoso.id,
    );
    assert.equal(
      acmeMembers.some((m) => m.email === "oscar@example.com"),
      false,
    );
    assert.equal(
      contosoMembers.some((m) => m.email === "alice@example.com"),
      false,
    );

    const projects = createPostgresProjectRepository(db);
    const acmeProjects = await projects.list(firstIdentity.orgs.acme.id);
    const contosoProjects = await projects.list(firstIdentity.orgs.contoso.id);
    assert.ok(acmeProjects.some((p) => p.name === PROJECT_NAMES.goose));
    assert.ok(
      contosoProjects.some((p) => p.name === PROJECT_NAMES.contosoCloud),
    );
    assert.equal(
      acmeProjects.some((p) => p.name === PROJECT_NAMES.contosoCloud),
      false,
    );

    const discussions = createPostgresDiscussionService(db);
    const gooseAc2 = await discussions.listComments(
      firstIdentity.orgs.acme.id,
      firstProjects.goose.id,
      "ac-2",
    );
    assert.ok(gooseAc2.length >= 2);
    const contosoLeak = await discussions.listComments(
      firstIdentity.orgs.contoso.id,
      firstProjects.goose.id,
      "ac-2",
    );
    assert.deepEqual(contosoLeak, []);
  });
});
