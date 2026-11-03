import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import { readZipTextEntries } from "@/export/ssp-docx/readPackage";
import { DOD_CLOUD_IL4_FRAMEWORK_ID } from "@/framework/dod-cloud-il4-rev5/identities";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-sp-800-53-rev5/identities";
import { IL4_ADDENDUM_UNSUPPORTED_FRAMEWORK_MESSAGE } from "@/il4-addendum";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresControlRecordRepository } from "@/persistence/postgres/control-record-repository";
import { createPostgresEvidenceService } from "@/persistence/postgres/evidence-service";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createProjectForOrg } from "@/server/authorized-projects";
import {
  generateIl4AddendumDocxForOrg,
  handleIl4AddendumDocxExportRequest,
  IL4_ADDENDUM_DOCX_CONTENT_TYPE,
} from "@/server/il4-addendum-docx-export";

afterEach(async () => {
  await closeDb();
});

function ctx(organizationId: string, role: OrgRole, userId = "user-1"): OrgContext {
  return { userId, organizationId, role };
}

async function setup() {
  const db = await openTestDb();
  const orgs = createPostgresOrganizationRepository(db);
  const orgA = await orgs.createOrganization({ name: "Org A", slug: "org-a-il4" });
  const orgB = await orgs.createOrganization({ name: "Org B", slug: "org-b-il4" });
  const projectRepo = createPostgresProjectRepository(db);
  const controlRecordRepo = createPostgresControlRecordRepository(db);
  const evidenceService = createPostgresEvidenceService(db);
  const deps = { projectRepo, controlRecordRepo, evidenceService };
  return { orgA, orgB, deps };
}

const GENERATED_AT = "2026-09-28T15:00:00.000Z";

describe("IL4 Addendum DOCX export authorization", () => {
  it("returns 401 when unauthenticated", async () => {
    const { deps } = await setup();
    const response = await handleIl4AddendumDocxExportRequest({
      projectId: "any-id",
      auth: { ok: false, status: 401 },
      deps,
      generatedAt: GENERATED_AT,
    });
    assert.equal(response.status, 401);
    assert.equal(await response.text(), "Unauthorized.");
  });

  it("returns 404 for empty project ids", async () => {
    const { deps, orgA } = await setup();
    const response = await handleIl4AddendumDocxExportRequest({
      projectId: "   ",
      auth: {
        ok: true,
        ctx: ctx(orgA.id, "viewer"),
        actor: { actorId: "user-1", actorDisplayName: "Viewer" },
      },
      deps,
      generatedAt: GENERATED_AT,
    });
    assert.equal(response.status, 404);
  });

  it("does not reveal another tenant's project", async () => {
    const { deps, orgA, orgB } = await setup();
    const created = await createProjectForOrg(
      deps.projectRepo,
      ctx(orgA.id, "organization_admin"),
      {
        name: "Secret Harbor",
        frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
        metadata: {
          systemName: "Secret Harbor",
          organizationName: "Org A",
          systemDescription: "Classified narrative that must not leak.",
        },
        implementations: {},
      },
    );
    const asB = await generateIl4AddendumDocxForOrg(
      deps,
      ctx(orgB.id, "organization_admin"),
      created.id,
      GENERATED_AT,
    );
    assert.equal(asB.ok, false);
    if (!asB.ok) {
      assert.equal(asB.status, 404);
    }
    const response = await handleIl4AddendumDocxExportRequest({
      projectId: created.id,
      auth: {
        ok: true,
        ctx: ctx(orgB.id, "organization_admin"),
        actor: { actorId: "user-b", actorDisplayName: "Admin B" },
      },
      deps,
      generatedAt: GENERATED_AT,
    });
    assert.equal(response.status, 404);
    const body = await response.text();
    assert.equal(body, "Not found.");
    assert.doesNotMatch(body, /Secret Harbor/);
  });

  it("allows a viewer to download an IL4 addendum and rejects other frameworks", async () => {
    const { deps, orgA } = await setup();
    const il4 = await createProjectForOrg(
      deps.projectRepo,
      ctx(orgA.id, "organization_admin"),
      {
        name: "Snow Goose",
        frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
        metadata: {
          systemName: "Snow Goose Cloud Impact Level 4",
          organizationName: "Harbor Org",
          systemDescription: "Coastal cloud.",
        },
        implementations: {},
      },
    );
    const moderate = await createProjectForOrg(
      deps.projectRepo,
      ctx(orgA.id, "organization_admin"),
      {
        name: "Moderate Goose",
        frameworkId: NIST_MODERATE_FRAMEWORK_ID,
        metadata: {
          systemName: "Moderate Goose",
          organizationName: "Harbor Org",
          systemDescription: "Moderate baseline.",
        },
        implementations: {},
      },
    );
    const rejected = await handleIl4AddendumDocxExportRequest({
      projectId: moderate.id,
      auth: {
        ok: true,
        ctx: ctx(orgA.id, "viewer"),
        actor: { actorId: "viewer-1", actorDisplayName: "Viewer" },
      },
      deps,
      generatedAt: GENERATED_AT,
    });
    assert.equal(rejected.status, 409);
    assert.equal(await rejected.text(), IL4_ADDENDUM_UNSUPPORTED_FRAMEWORK_MESSAGE);

    const messages: unknown[] = [];
    const originalInfo = console.info;
    console.info = (...args: unknown[]) => {
      messages.push(args);
    };
    try {
      const response = await handleIl4AddendumDocxExportRequest({
        projectId: il4.id,
        auth: {
          ok: true,
          ctx: ctx(orgA.id, "viewer"),
          actor: { actorId: "viewer-1", actorDisplayName: "Viewer" },
        },
        deps,
        generatedAt: GENERATED_AT,
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Content-Type"), IL4_ADDENDUM_DOCX_CONTENT_TYPE);
      assert.match(
        response.headers.get("Content-Disposition") ?? "",
        /snow-goose-cloud-impact-level-4-il4-ssp-addendum\.docx/,
      );
      assert.equal(response.headers.get("Cache-Control"), "private, no-store");
      const bytes = Buffer.from(await response.arrayBuffer());
      const xml = readZipTextEntries(bytes).get("word/document.xml") ?? "";
      assert.match(xml, /Snow Goose Cloud Impact Level 4/);
      assert.doesNotMatch(xml, /tmp\/|\/var\/data/);
      const payload = JSON.stringify(messages);
      assert.match(payload, /il4-addendum.docx generated/);
      assert.doesNotMatch(payload, /Coastal cloud/);
    } finally {
      console.info = originalInfo;
    }
  });
});
