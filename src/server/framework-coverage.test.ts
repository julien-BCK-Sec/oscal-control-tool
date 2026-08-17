import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { OrgContext } from "@/authz/authorize";
import { resolveFrameworkControls } from "@/data/framework";
import {
  NIST_HIGH_FRAMEWORK_ID,
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
} from "@/framework/nist-sp-800-53-rev5/identities";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresEvidenceCoverageQuery } from "@/persistence/postgres/evidence-coverage-query";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { getProjectEvidenceCoverageForOrg } from "@/server/authorized-evidence";

afterEach(async () => {
  await closeDb();
});

async function setup() {
  const db = await openTestDb();
  const projects = createPostgresProjectRepository(db);
  const orgs = createPostgresOrganizationRepository(db);
  const org = await orgs.createOrganization({ name: "Org A", slug: "org-a" });
  const coverageQuery = createPostgresEvidenceCoverageQuery(db);
  const ctx: OrgContext = {
    userId: "u-admin",
    organizationId: org.id,
    role: "organization_admin",
  };
  return { projects, org, coverageQuery, ctx };
}

describe("project framework coverage denominators", () => {
  it("uses each project's pinned framework control set, including controls without ControlRecords", async () => {
    const { projects, org, coverageQuery, ctx } = await setup();
    const cases = [
      NIST_LOW_FRAMEWORK_ID,
      NIST_MODERATE_FRAMEWORK_ID,
      NIST_HIGH_FRAMEWORK_ID,
    ] as const;

    for (const frameworkId of cases) {
      const project = await projects.create({
        name: frameworkId,
        organizationId: org.id,
        frameworkId,
      });
      const expectedIds = resolveFrameworkControls(frameworkId).map(
        (control) => control.id,
      );
      const coverage = await getProjectEvidenceCoverageForOrg(
        projects,
        coverageQuery,
        ctx,
        project.id,
        "2026-06-01",
      );
      assert.ok(coverage);
      assert.equal(coverage.summary.totalControls, expectedIds.length);
      assert.equal(coverage.summary.requiredControls, expectedIds.length);
      assert.equal(
        coverage.summary.requiredMissingEvidence,
        expectedIds.length,
      );
      assert.equal(coverage.summary.requiredWithEvidence, 0);
      assert.deepEqual(
        coverage.controls.map((row) => row.controlId),
        expectedIds,
      );
      assert.ok(
        coverage.controls.every((row) => row.coverageState === "required_missing"),
      );
    }
  });

  it("does not include another profile's controls in a Low project's coverage", async () => {
    const { projects, org, coverageQuery, ctx } = await setup();
    const lowProject = await projects.create({
      name: "Low",
      organizationId: org.id,
      frameworkId: NIST_LOW_FRAMEWORK_ID,
    });
    const lowIds = new Set(
      resolveFrameworkControls(NIST_LOW_FRAMEWORK_ID).map((c) => c.id),
    );
    const highOnly = resolveFrameworkControls(NIST_HIGH_FRAMEWORK_ID).find(
      (control) => !lowIds.has(control.id),
    );
    assert.ok(highOnly);

    const coverage = await getProjectEvidenceCoverageForOrg(
      projects,
      coverageQuery,
      ctx,
      lowProject.id,
      "2026-06-01",
    );
    assert.ok(coverage);
    assert.equal(
      coverage.controls.some((row) => row.controlId === highOnly.id),
      false,
    );
    assert.ok(coverage.controls.some((row) => row.controlId === "ac-2"));
  });
});
