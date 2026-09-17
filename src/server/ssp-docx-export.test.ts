import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-sp-800-53-rev5/identities";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresControlRecordRepository } from "@/persistence/postgres/control-record-repository";
import { createPostgresEvidenceService } from "@/persistence/postgres/evidence-service";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createProjectForOrg } from "@/server/authorized-projects";
import {
  generateSspDocxForOrg,
  handleSspDocxExportRequest,
  SSP_DOCX_CONTENT_TYPE,
} from "@/server/ssp-docx-export";
import { readZipTextEntries } from "@/export/ssp-docx/readPackage";

afterEach(async () => {
  await closeDb();
});

function ctx(organizationId: string, role: OrgRole, userId = "user-1"): OrgContext {
  return { userId, organizationId, role };
}

async function setup() {
  const db = await openTestDb();
  const orgs = createPostgresOrganizationRepository(db);
  const orgA = await orgs.createOrganization({ name: "Org A", slug: "org-a-ssp" });
  const orgB = await orgs.createOrganization({ name: "Org B", slug: "org-b-ssp" });
  const projectRepo = createPostgresProjectRepository(db);
  const controlRecordRepo = createPostgresControlRecordRepository(db);
  const evidenceService = createPostgresEvidenceService(db);
  const deps = { projectRepo, controlRecordRepo, evidenceService };
  return { db, orgs, orgA, orgB, deps };
}

const GENERATED_AT = "2026-09-16T18:00:00.000Z";

describe("SSP DOCX export authorization", () => {
  it("returns 401 when unauthenticated", async () => {
    const { deps } = await setup();
    const response = await handleSspDocxExportRequest({
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
    const response = await handleSspDocxExportRequest({
      projectId: "   ",
      auth: { ok: true, ctx: ctx(orgA.id, "viewer"), actor: { actorId: "user-1", actorDisplayName: "Viewer" } },
      deps,
      generatedAt: GENERATED_AT,
    });
    assert.equal(response.status, 404);
  });

  it("does not reveal another tenant's project", async () => {
    const { deps, orgA, orgB } = await setup();
    const created = await createProjectForOrg(deps.projectRepo, ctx(orgA.id, "organization_admin"), {
      name: "Secret Harbor",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: {
        systemName: "Secret Harbor",
        organizationName: "Org A",
        systemDescription: "Classified narrative that must not leak.",
      },
      implementations: {},
    });
    const asB = await generateSspDocxForOrg(
      deps,
      ctx(orgB.id, "organization_admin"),
      created.id,
      GENERATED_AT,
    );
    assert.equal(asB.ok, false);
    if (!asB.ok) {
      assert.equal(asB.status, 404);
      assert.equal(asB.message, "Not found.");
    }
    const response = await handleSspDocxExportRequest({
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
    assert.equal(await response.text(), "Not found.");
  });

  it("allows a viewer with project.read to download the live saved SSP", async () => {
    const { deps, orgA } = await setup();
    const created = await createProjectForOrg(deps.projectRepo, ctx(orgA.id, "organization_admin"), {
      name: "Harbor Watch",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: {
        systemName: "Harbor Watch",
        organizationName: "Harbor Org",
        systemDescription: "Coastal monitoring.",
      },
      implementations: {},
    });
    const messages: unknown[] = [];
    const originalInfo = console.info;
    console.info = (...args: unknown[]) => {
      messages.push(args);
    };
    try {
      const response = await handleSspDocxExportRequest({
        projectId: created.id,
        auth: {
          ok: true,
          ctx: ctx(orgA.id, "viewer"),
          actor: { actorId: "viewer-1", actorDisplayName: "Viewer" },
        },
        deps,
        generatedAt: GENERATED_AT,
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Content-Type"), SSP_DOCX_CONTENT_TYPE);
      assert.match(response.headers.get("Content-Disposition") ?? "", /harbor-watch-system-security-plan\.docx/);
      assert.equal(response.headers.get("Cache-Control"), "private, no-store");
      assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.ok(bytes.byteLength > 1000);
      const xml = readZipTextEntries(bytes).get("word/document.xml") ?? "";
      assert.match(xml, /Harbor Watch/);
      assert.doesNotMatch(xml, /tmp\/|\/var\/data/);
      assert.equal(messages.length, 1);
      const payload = JSON.stringify(messages);
      assert.match(payload, /ssp.docx generated/);
      assert.doesNotMatch(payload, /Coastal monitoring/);
    } finally {
      console.info = originalInfo;
    }
  });
});
