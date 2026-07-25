import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresEvidenceService } from "@/persistence/postgres/evidence-service";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import type { OrgContext } from "@/authz/authorize";
import {
  associateEvidenceForOrg,
  createEvidenceForOrg,
  searchEvidenceForOrg,
} from "@/server/authorized-evidence";
import { createProjectForOrg } from "@/server/authorized-projects";
import { encodeEvidenceSearchCursor } from "@/data/evidence";

afterEach(async () => {
  await closeDb();
});

async function setup() {
  const db = await openTestDb();
  const projects = createPostgresProjectRepository(db);
  const orgs = createPostgresOrganizationRepository(db);
  const evidence = createPostgresEvidenceService(db);
  const org = await orgs.createOrganization({
    name: "Picker Org",
    slug: "picker-org",
  });
  const admin: OrgContext = {
    userId: "picker-admin",
    organizationId: org.id,
    role: "organization_admin",
  };
  const project = await createProjectForOrg(projects, admin, {
    name: "Picker System",
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    metadata: {
      systemName: "Picker System",
      organizationName: "Org",
      systemDescription: "Desc",
    },
    implementations: {},
  });
  return { db, projects, evidence, org, admin, project };
}

describe("evidence search and archived associate", () => {
  it("searches with keyset pagination, excludes linked and archived", async () => {
    const { projects, evidence, admin, project } = await setup();

    const first = await createEvidenceForOrg(
      projects,
      evidence,
      admin,
      {
        projectId: project.id,
        title: "Alpha access review",
        evidenceType: "log",
        status: "active",
        owner: "Alex",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(first.ok, true);
    if (!first.ok) {
      return;
    }

    // Ensure distinct updatedAt ordering for pagination.
    await new Promise((resolve) => setTimeout(resolve, 5));

    const second = await createEvidenceForOrg(
      projects,
      evidence,
      admin,
      {
        projectId: project.id,
        title: "Bravo policy packet",
        evidenceType: "policy",
        status: "active",
        owner: "Blair",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(second.ok, true);
    if (!second.ok) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 5));

    const third = await createEvidenceForOrg(
      projects,
      evidence,
      admin,
      {
        projectId: project.id,
        title: "Charlie screenshot",
        evidenceType: "screenshot",
        status: "draft",
        owner: "Casey",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(third.ok, true);
    if (!third.ok) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 5));

    // Fourth eligible row so limit=2 yields hasMore + a one-item page 2
    // (linked first + archived are excluded → three searchable).
    const fourth = await createEvidenceForOrg(
      projects,
      evidence,
      admin,
      {
        projectId: project.id,
        title: "Delta interview notes",
        evidenceType: "attestation",
        status: "active",
        owner: "Dana",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(fourth.ok, true);
    if (!fourth.ok) {
      return;
    }

    const archived = await createEvidenceForOrg(
      projects,
      evidence,
      admin,
      {
        projectId: project.id,
        title: "Archived relic",
        evidenceType: "other",
        status: "draft",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(archived.ok, true);
    if (!archived.ok) {
      return;
    }
    await evidence.archive(project.id, archived.evidence.id, SYSTEM_ACTOR);

    await associateEvidenceForOrg(
      projects,
      evidence,
      admin,
      project.id,
      first.evidence.id,
      "ac-2",
      SYSTEM_ACTOR,
    );

    const page1 = await searchEvidenceForOrg(projects, evidence, admin, {
      projectId: project.id,
      limit: 2,
      excludeLinkedToControlId: "ac-2",
    });
    assert.equal(page1.items.length, 2);
    assert.equal(page1.hasMore, true);
    assert.ok(page1.nextCursor);
    assert.ok(page1.items.every((item) => item.id !== first.evidence.id));
    assert.ok(page1.items.every((item) => item.id !== archived.evidence.id));
    assert.ok(
      !Object.prototype.hasOwnProperty.call(page1.items[0], "controlIds"),
    );

    const page2 = await searchEvidenceForOrg(projects, evidence, admin, {
      projectId: project.id,
      limit: 2,
      cursor: page1.nextCursor,
      excludeLinkedToControlId: "ac-2",
    });
    assert.equal(page2.items.length, 1);
    assert.equal(page2.hasMore, false);

    const byTitle = await searchEvidenceForOrg(projects, evidence, admin, {
      projectId: project.id,
      query: "policy",
    });
    assert.equal(byTitle.items.length, 1);
    assert.equal(byTitle.items[0]?.title, "Bravo policy packet");

    const byType = await searchEvidenceForOrg(projects, evidence, admin, {
      projectId: project.id,
      evidenceType: "screenshot",
    });
    assert.equal(byType.items.length, 1);
    assert.equal(byType.items[0]?.id, third.evidence.id);
  });

  it("rejects new associations to archived evidence and stays idempotent when linked", async () => {
    const { projects, evidence, admin, project } = await setup();

    const created = await createEvidenceForOrg(
      projects,
      evidence,
      admin,
      {
        projectId: project.id,
        title: "Soon archived",
        evidenceType: "document",
        status: "active",
        controlIds: ["ac-3"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(created.ok, true);
    if (!created.ok) {
      return;
    }

    const again = await associateEvidenceForOrg(
      projects,
      evidence,
      admin,
      project.id,
      created.evidence.id,
      "ac-3",
      SYSTEM_ACTOR,
    );
    assert.equal(again.ok, true);

    await evidence.archive(project.id, created.evidence.id, SYSTEM_ACTOR);

    const blocked = await associateEvidenceForOrg(
      projects,
      evidence,
      admin,
      project.id,
      created.evidence.id,
      "ac-4",
      SYSTEM_ACTOR,
    );
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.equal(blocked.reason, "archived");
    }

    const stillLinked = await associateEvidenceForOrg(
      projects,
      evidence,
      admin,
      project.id,
      created.evidence.id,
      "ac-3",
      SYSTEM_ACTOR,
    );
    assert.equal(stillLinked.ok, true);
  });

  it("fails closed across projects and rejects invalid cursors", async () => {
    const { projects, evidence, admin, project } = await setup();

    const created = await createEvidenceForOrg(
      projects,
      evidence,
      admin,
      {
        projectId: project.id,
        title: "Scoped",
        evidenceType: "document",
        status: "active",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(created.ok, true);

    const stranger: OrgContext = {
      userId: "x",
      organizationId: "not-this-org",
      role: "organization_admin",
    };
    const cross = await searchEvidenceForOrg(projects, evidence, stranger, {
      projectId: project.id,
    });
    assert.deepEqual(cross.items, []);

    await assert.rejects(
      () =>
        evidence.search({
          projectId: project.id,
          cursor: "%%%not-a-cursor%%%",
        }),
      /Invalid search cursor/,
    );

    // Keyset is updatedAt DESC, id DESC: a cursor older than all rows
    // (not newer) yields an empty next page.
    const encoded = encodeEvidenceSearchCursor({
      updatedAt: "1970-01-01T00:00:00.000Z",
      id: "00000000-0000-0000-0000-000000000000",
    });
    const emptyPage = await searchEvidenceForOrg(projects, evidence, admin, {
      projectId: project.id,
      cursor: encoded,
    });
    assert.equal(emptyPage.items.length, 0);
  });
});
