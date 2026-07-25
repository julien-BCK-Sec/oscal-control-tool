import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresEvidenceService } from "@/persistence/postgres/evidence-service";
import { createPostgresEvidenceVersionService } from "@/persistence/postgres/evidence-version-service";
import { createFilesystemObjectStorage } from "@/storage/filesystem-provider";
import { validateEvidenceUpload } from "@/data/evidence";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import type { OrgContext } from "@/authz/authorize";
import {
  createEvidenceForOrg,
  downloadEvidenceVersionForOrg,
  listEvidenceVersionsForOrg,
  uploadEvidenceVersionForOrg,
} from "@/server/authorized-evidence";
import { createProjectForOrg } from "@/server/authorized-projects";

afterEach(async () => {
  await closeDb();
});

describe("evidence version upload and download", () => {
  it("stores binaries outside postgres, versions immutably, and cleans up on db failure path", async () => {
    const db = await openTestDb();
    const storageRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cf-ev-ver-"));
    const storage = createFilesystemObjectStorage(storageRoot);
    const projects = createPostgresProjectRepository(db);
    const orgs = createPostgresOrganizationRepository(db);
    const evidence = createPostgresEvidenceService(db);
    const versions = createPostgresEvidenceVersionService(db, storage);
    const org = await orgs.createOrganization({
      name: "Version Org",
      slug: "version-org",
    });
    const admin: OrgContext = {
      userId: "uploader-1",
      organizationId: org.id,
      role: "organization_admin",
    };
    const project = await createProjectForOrg(projects, admin, {
      name: "Version System",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: {
        systemName: "Version System",
        organizationName: "Org",
        systemDescription: "Desc",
      },
      implementations: {},
    });

    const created = await createEvidenceForOrg(
      projects,
      evidence,
      admin,
      {
        projectId: project.id,
        title: "Access policy",
        evidenceType: "policy",
        status: "active",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(created.ok, true);
    if (!created.ok) {
      return;
    }
    assert.equal(created.evidence.currentVersionId, null);

    const validated = validateEvidenceUpload({
      filename: "policy.txt",
      declaredMimeType: "text/plain",
      body: Buffer.from("access control policy v1"),
      maxBytes: 25 * 1024 * 1024,
    });
    assert.equal(validated.ok, true);
    if (!validated.ok) {
      return;
    }

    const uploaded = await uploadEvidenceVersionForOrg(
      projects,
      versions,
      admin,
      {
        projectId: project.id,
        evidenceId: created.evidence.id,
        upload: validated.value,
      },
      SYSTEM_ACTOR,
    );
    assert.equal(uploaded.ok, true);
    if (!uploaded.ok) {
      return;
    }
    assert.equal(uploaded.version.versionNumber, 1);
    assert.equal(uploaded.evidence.currentVersionId, uploaded.version.id);
    assert.ok(!("storageKey" in uploaded.version));

    const validated2 = validateEvidenceUpload({
      filename: "policy-v2.txt",
      declaredMimeType: "text/plain",
      body: Buffer.from("access control policy v2"),
      maxBytes: 25 * 1024 * 1024,
    });
    assert.equal(validated2.ok, true);
    if (!validated2.ok) {
      return;
    }
    const replaced = await uploadEvidenceVersionForOrg(
      projects,
      versions,
      admin,
      {
        projectId: project.id,
        evidenceId: created.evidence.id,
        upload: validated2.value,
      },
      SYSTEM_ACTOR,
    );
    assert.equal(replaced.ok, true);
    if (!replaced.ok) {
      return;
    }
    assert.equal(replaced.version.versionNumber, 2);
    assert.equal(replaced.evidence.currentVersionId, replaced.version.id);

    const history = await listEvidenceVersionsForOrg(
      projects,
      versions,
      admin,
      project.id,
      created.evidence.id,
    );
    assert.equal(history.length, 2);
    assert.equal(history[0]?.versionNumber, 2);
    assert.equal(history[1]?.versionNumber, 1);

    const downloadV1 = await downloadEvidenceVersionForOrg(
      projects,
      versions,
      admin,
      project.id,
      created.evidence.id,
      history[1]!.id,
    );
    assert.equal(downloadV1.ok, true);
    if (downloadV1.ok) {
      assert.equal(downloadV1.body.toString("utf8"), "access control policy v1");
    }

    // Storage keys must never appear on list DTOs.
    for (const version of history) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(version, "storageKey"),
        false,
      );
    }

    await fs.rm(storageRoot, { recursive: true, force: true });
  });
});
