import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { AuthorizationError } from "@/authz/authorize";
import type { OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import {
  createProjectForOrg,
  deleteProjectForOrg,
  listProjectsForOrg,
  loadProjectForOrg,
  renameProjectForOrg,
  saveProjectForOrg,
} from "./authorized-projects";

afterEach(async () => {
  await closeDb();
});

async function setup() {
  const db = await openTestDb();
  const projects = createPostgresProjectRepository(db);
  const orgs = createPostgresOrganizationRepository(db);
  const orgA = await orgs.createOrganization({ name: "Org A", slug: "org-a" });
  const orgB = await orgs.createOrganization({ name: "Org B", slug: "org-b" });
  return { db, projects, orgs, orgA, orgB };
}

function ctx(organizationId: string, role: OrgRole, userId = "u"): OrgContext {
  return { userId, organizationId, role };
}

const projectInput = {
  name: "System X",
  frameworkId: NIST_MODERATE_FRAMEWORK_ID,
  metadata: {
    systemName: "System X",
    organizationName: "Org",
    systemDescription: "Desc",
  },
  implementations: {},
} as const;

describe("tenant isolation: authorized projects", () => {
  it("scopes create and list to the caller's organization", async () => {
    const { projects, orgA, orgB } = await setup();

    const adminA = ctx(orgA.id, "organization_admin");
    const adminB = ctx(orgB.id, "organization_admin");

    await createProjectForOrg(projects, adminA, projectInput);
    await createProjectForOrg(projects, adminA, projectInput);
    await createProjectForOrg(projects, adminB, projectInput);

    const listedA = await listProjectsForOrg(projects, adminA);
    const listedB = await listProjectsForOrg(projects, adminB);
    assert.equal(listedA.length, 2);
    assert.equal(listedB.length, 1);
  });

  it("denies loading another organization's project by id (not-found, no leak)", async () => {
    const { projects, orgA, orgB } = await setup();
    const created = await createProjectForOrg(
      projects,
      ctx(orgA.id, "organization_admin"),
      projectInput,
    );

    const asB = await loadProjectForOrg(
      projects,
      ctx(orgB.id, "organization_admin"),
      created.id,
    );
    assert.equal(asB.ok, false);
    if (!asB.ok) {
      assert.equal(asB.error.kind, "not-found");
    }

    const asA = await loadProjectForOrg(
      projects,
      ctx(orgA.id, "viewer"),
      created.id,
    );
    assert.equal(asA.ok, true);
  });

  it("prevents cross-tenant mutation even with a valid project id", async () => {
    const { projects, orgA, orgB } = await setup();
    const created = await createProjectForOrg(
      projects,
      ctx(orgA.id, "organization_admin"),
      projectInput,
    );

    const renamed = await renameProjectForOrg(
      projects,
      ctx(orgB.id, "organization_admin"),
      created.id,
      "Hijacked",
    );
    assert.equal(renamed, null);

    const deleted = await deleteProjectForOrg(
      projects,
      ctx(orgB.id, "organization_admin"),
      created.id,
    );
    assert.equal(deleted, false);

    // Still present and unchanged for its real owner.
    const owner = await loadProjectForOrg(
      projects,
      ctx(orgA.id, "organization_admin"),
      created.id,
    );
    assert.equal(owner.ok, true);
    if (owner.ok) {
      assert.equal(owner.project.name, "System X");
    }
  });

  it("lets viewers read but not mutate", async () => {
    const { projects, orgA } = await setup();
    const created = await createProjectForOrg(
      projects,
      ctx(orgA.id, "organization_admin"),
      projectInput,
    );
    const viewer = ctx(orgA.id, "viewer");

    await assert.rejects(
      () => createProjectForOrg(projects, viewer, projectInput),
      (e: unknown) =>
        e instanceof AuthorizationError && e.code === "forbidden",
    );
    await assert.rejects(
      () =>
        saveProjectForOrg(projects, viewer, {
          id: created.id,
          name: created.name,
          frameworkId: created.frameworkId,
          metadata: created.metadata,
          implementations: created.implementations,
          expectedRevision: created.revision,
        }),
      (e: unknown) =>
        e instanceof AuthorizationError && e.code === "forbidden",
    );

    // Viewer read still works.
    const listed = await listProjectsForOrg(projects, viewer);
    assert.equal(listed.length, 1);
  });
});
