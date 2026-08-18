import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { AuthorizationError } from "@/authz/authorize";
import type { OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import {
  NIST_HIGH_FRAMEWORK_ID,
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
} from "@/framework/nist-sp-800-53-rev5/identities";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import {
  createProjectForOrg,
  saveProjectForOrg,
} from "./authorized-projects";

afterEach(async () => {
  await closeDb();
});

async function setup() {
  const db = await openTestDb();
  const projects = createPostgresProjectRepository(db);
  const orgs = createPostgresOrganizationRepository(db);
  const org = await orgs.createOrganization({ name: "Org A", slug: "org-a" });
  return { projects, org };
}

function ctx(organizationId: string, role: OrgRole = "organization_admin"): OrgContext {
  return { userId: "u", organizationId, role };
}

describe("authorized project framework identity", () => {
  it("creates Low, Moderate, and High projects", async () => {
    const { projects, org } = await setup();
    const admin = ctx(org.id);
    const low = await createProjectForOrg(projects, admin, {
      name: "Low",
      frameworkId: NIST_LOW_FRAMEWORK_ID,
    });
    const moderate = await createProjectForOrg(projects, admin, {
      name: "Moderate",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const high = await createProjectForOrg(projects, admin, {
      name: "High",
      frameworkId: NIST_HIGH_FRAMEWORK_ID,
    });
    assert.equal(low.frameworkId, NIST_LOW_FRAMEWORK_ID);
    assert.equal(moderate.frameworkId, NIST_MODERATE_FRAMEWORK_ID);
    assert.equal(high.frameworkId, NIST_HIGH_FRAMEWORK_ID);
  });

  it("rejects unknown framework IDs", async () => {
    const { projects, org } = await setup();
    await assert.rejects(
      () =>
        createProjectForOrg(projects, ctx(org.id), {
          name: "Nope",
          frameworkId: "not-a-framework",
        }),
      /Unknown framework/,
    );
  });

  it("does not let save change framework identity", async () => {
    const { projects, org } = await setup();
    const created = await createProjectForOrg(projects, ctx(org.id), {
      name: "Stay Moderate",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const ignored = await saveProjectForOrg(projects, ctx(org.id), {
      id: created.id,
      name: created.name,
      frameworkId: NIST_LOW_FRAMEWORK_ID,
      metadata: created.metadata,
      implementations: created.implementations,
      expectedRevision: created.revision,
    });
    assert.equal(ignored.ok, true);
    if (ignored.ok) {
      assert.equal(ignored.project.frameworkId, NIST_MODERATE_FRAMEWORK_ID);
    }

    const omitted = await saveProjectForOrg(projects, ctx(org.id), {
      id: created.id,
      name: "Still Moderate",
      metadata: created.metadata,
      implementations: created.implementations,
      expectedRevision: ignored.ok ? ignored.project.revision : created.revision,
    });
    assert.equal(omitted.ok, true);
    if (omitted.ok) {
      assert.equal(omitted.project.frameworkId, NIST_MODERATE_FRAMEWORK_ID);
      assert.equal(omitted.project.name, "Still Moderate");
    }
  });

  it("still requires project.create to create a framework-selected project", async () => {
    const { projects, org } = await setup();
    await assert.rejects(
      () =>
        createProjectForOrg(projects, ctx(org.id, "viewer"), {
          name: "Denied",
          frameworkId: NIST_LOW_FRAMEWORK_ID,
        }),
      (error: unknown) => error instanceof AuthorizationError,
    );
  });
});
