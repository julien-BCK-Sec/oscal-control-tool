import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import {
  DEFAULT_CONTROL_RECORD_FIELDS,
  resolveControlRecordFields,
} from "@/data/control-record";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresControlRecordRepository } from "@/persistence/postgres/control-record-repository";
import { createTestProjectRepository } from "@/persistence/postgres/testing";
import { controlRecords } from "@/persistence/postgres/schema";

async function tempRepos() {
  const db = await openTestDb();
  return {
    projects: createTestProjectRepository(db),
    controlRecords: createPostgresControlRecordRepository(db),
    db,
  };
}

afterEach(async () => {
  await closeDb();
});

describe("ControlRecordRepository", () => {
  it("creates a ControlRecord for a project control", async () => {
    const { projects, controlRecords: records } = await tempRepos();
    const project = await projects.create({
      name: "Meta",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const created = await records.upsert(project.id, {
      controlId: "ac-2",
      owner: "Priya Sharma",
      coOwner: "Gary Mercer",
      businessUnit: "CGDS",
      implementationStatus: "in_review",
      reviewDueDate: "2026-08-01",
    });

    assert.equal(created.projectId, project.id);
    assert.equal(created.controlId, "ac-2");
    assert.equal(created.owner, "Priya Sharma");
    assert.equal(created.implementationStatus, "in_review");
    assert.ok(created.id.length > 0);

    const listed = await records.listByProject(project.id);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, created.id);
  });

  it("loads defaults when no ControlRecord exists", () => {
    const fields = resolveControlRecordFields({}, "ac-1");
    assert.deepEqual(fields, DEFAULT_CONTROL_RECORD_FIELDS);
    assert.equal(fields.owner, "");
    assert.equal(fields.coOwner, "");
    assert.equal(fields.businessUnit, "");
    assert.equal(fields.implementationStatus, "draft");
    assert.equal(fields.reviewDueDate, null);
  });

  it("updates metadata without changing OSCAL project implementations", async () => {
    const { projects, controlRecords: records } = await tempRepos();
    const project = await projects.create({
      name: "Keep OSCAL",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      implementations: {
        "ac-1": { status: "implemented", narrative: "original narrative" },
      },
    });

    await records.upsert(project.id, {
      controlId: "ac-1",
      owner: "Sam Okonkwo",
      coOwner: "",
      businessUnit: "Ops",
      implementationStatus: "approved",
      reviewDueDate: null,
    });

    const loaded = await projects.load(project.id);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) {
      return;
    }
    assert.equal(
      loaded.project.implementations["ac-1"]?.narrative,
      "original narrative",
    );
    assert.equal(loaded.project.implementations["ac-1"]?.status, "implemented");
    assert.equal(
      JSON.stringify(loaded.project).includes("Sam Okonkwo"),
      false,
    );
  });

  it("enforces uniqueness of projectId + controlId", async () => {
    const { projects, controlRecords: records, db } = await tempRepos();
    const project = await projects.create({
      name: "Unique",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const first = await records.upsert(project.id, {
      controlId: "ac-2",
      owner: "A",
      coOwner: "",
      businessUnit: "",
      implementationStatus: "draft",
      reviewDueDate: null,
    });

    const second = await records.upsert(project.id, {
      controlId: "ac-2",
      owner: "B",
      coOwner: "C",
      businessUnit: "Unit",
      implementationStatus: "implemented",
      reviewDueDate: "2026-09-15",
    });

    assert.equal(second.id, first.id);
    assert.equal(second.owner, "B");
    assert.equal(second.implementationStatus, "implemented");

    const listed = await records.listByProject(project.id);
    assert.equal(listed.length, 1);

    const now = new Date().toISOString();
    await assert.rejects(
      () =>
        db.insert(controlRecords).values({
          id: "duplicate-id",
          projectId: project.id,
          controlId: "ac-2",
          owner: "",
          coOwner: "",
          businessUnit: "",
          implementationStatus: "draft",
          reviewDueDate: null,
          createdAt: now,
          updatedAt: now,
        }),
      /unique|duplicate/i,
    );
  });

  it("isolates ControlRecords per project", async () => {
    const { projects, controlRecords: records } = await tempRepos();
    const projectA = await projects.create({
      name: "A",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const projectB = await projects.create({
      name: "B",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    await records.upsert(projectA.id, {
      controlId: "ac-2",
      owner: "Owner A",
      coOwner: "",
      businessUnit: "",
      implementationStatus: "draft",
      reviewDueDate: null,
    });
    await records.upsert(projectB.id, {
      controlId: "ac-2",
      owner: "Owner B",
      coOwner: "",
      businessUnit: "",
      implementationStatus: "approved",
      reviewDueDate: null,
    });

    const listA = await records.listByProject(projectA.id);
    const listB = await records.listByProject(projectB.id);
    assert.equal(listA.length, 1);
    assert.equal(listB.length, 1);
    assert.equal(listA[0].owner, "Owner A");
    assert.equal(listB[0].owner, "Owner B");
    assert.notEqual(listA[0].id, listB[0].id);
  });

  it("cascades delete when the parent project is removed", async () => {
    const { projects, controlRecords: records } = await tempRepos();
    const project = await projects.create({
      name: "Doomed",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    await records.upsert(project.id, {
      controlId: "ac-3",
      owner: "Temp",
      coOwner: "",
      businessUnit: "",
      implementationStatus: "draft",
      reviewDueDate: null,
    });

    await projects.delete(project.id);
    const listed = await records.listByProject(project.id);
    assert.equal(listed.length, 0);
  });
});

describe("ControlRecord defaults for existing controls", () => {
  it("presents unassigned draft metadata for controls without rows", () => {
    const existing = {
      "ac-2": {
        owner: "Nadia Fortin",
        coOwner: "",
        businessUnit: "Deploy",
        implementationStatus: "approved" as const,
        reviewDueDate: "2026-07-01",
      },
    };
    const withRow = resolveControlRecordFields(existing, "ac-2");
    const withoutRow = resolveControlRecordFields(existing, "ac-1");

    assert.equal(withRow.owner, "Nadia Fortin");
    assert.equal(withRow.implementationStatus, "approved");
    assert.deepEqual(withoutRow, DEFAULT_CONTROL_RECORD_FIELDS);
  });
});
