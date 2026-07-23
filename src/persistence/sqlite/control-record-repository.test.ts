import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import Database from "better-sqlite3";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import {
  DEFAULT_CONTROL_RECORD_FIELDS,
  resolveControlRecordFields,
} from "@/data/control-record";
import { closeDb, openDbAt } from "@/persistence/sqlite/client";
import { createSqliteControlRecordRepository } from "@/persistence/sqlite/control-record-repository";
import { createSqliteProjectRepository } from "@/persistence/sqlite/project-repository";

const dirs: string[] = [];

function tempRepos() {
  const dir = mkdtempSync(join(tmpdir(), "oscal-cr-"));
  dirs.push(dir);
  const dbPath = join(dir, "test.sqlite");
  const db = openDbAt(dbPath);
  return {
    projects: createSqliteProjectRepository(db),
    controlRecords: createSqliteControlRecordRepository(db),
    dbPath,
  };
}

afterEach(() => {
  closeDb();
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("ControlRecordRepository", () => {
  it("creates a ControlRecord for a project control", async () => {
    const { projects, controlRecords } = tempRepos();
    const project = await projects.create({
      name: "Meta",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const created = await controlRecords.upsert(project.id, {
      controlId: "ac-2",
      owner: "Priya Sharma",
      coOwner: "Gary Mercer",
      businessUnit: "CGDS",
      implementationStatus: "in_review",
      evidenceRequirement: "required",
      reviewDueDate: "2026-08-01",
    });

    assert.equal(created.projectId, project.id);
    assert.equal(created.controlId, "ac-2");
    assert.equal(created.owner, "Priya Sharma");
    assert.equal(created.implementationStatus, "in_review");
    assert.ok(created.id.length > 0);

    const listed = await controlRecords.listByProject(project.id);
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
    const { projects, controlRecords } = tempRepos();
    const project = await projects.create({
      name: "Keep OSCAL",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      implementations: {
        "ac-1": { status: "implemented", narrative: "original narrative" },
      },
    });

    await controlRecords.upsert(project.id, {
      controlId: "ac-1",
      owner: "Sam Okonkwo",
      coOwner: "",
      businessUnit: "Ops",
      implementationStatus: "approved",
      evidenceRequirement: "required",
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
    const { projects, controlRecords, dbPath } = tempRepos();
    const project = await projects.create({
      name: "Unique",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const first = await controlRecords.upsert(project.id, {
      controlId: "ac-2",
      owner: "A",
      coOwner: "",
      businessUnit: "",
      implementationStatus: "draft",
      evidenceRequirement: "required",
      reviewDueDate: null,
    });

    const second = await controlRecords.upsert(project.id, {
      controlId: "ac-2",
      owner: "B",
      coOwner: "C",
      businessUnit: "Unit",
      implementationStatus: "implemented",
      evidenceRequirement: "required",
      reviewDueDate: "2026-09-15",
    });

    assert.equal(second.id, first.id);
    assert.equal(second.owner, "B");
    assert.equal(second.implementationStatus, "implemented");

    const listed = await controlRecords.listByProject(project.id);
    assert.equal(listed.length, 1);

    const sqlite = new Database(dbPath);
    try {
      assert.throws(() => {
        sqlite
          .prepare(
            `INSERT INTO control_records (
              id, project_id, control_id, owner, co_owner, business_unit,
              implementation_status, review_due_date, created_at, updated_at
            ) VALUES (?, ?, ?, '', '', '', 'draft', NULL, ?, ?)`,
          )
          .run(
            "duplicate-id",
            project.id,
            "ac-2",
            new Date().toISOString(),
            new Date().toISOString(),
          );
      });
    } finally {
      sqlite.close();
    }
  });

  it("isolates ControlRecords per project", async () => {
    const { projects, controlRecords } = tempRepos();
    const projectA = await projects.create({
      name: "A",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const projectB = await projects.create({
      name: "B",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    await controlRecords.upsert(projectA.id, {
      controlId: "ac-2",
      owner: "Owner A",
      coOwner: "",
      businessUnit: "",
      implementationStatus: "draft",
      evidenceRequirement: "required",
      reviewDueDate: null,
    });
    await controlRecords.upsert(projectB.id, {
      controlId: "ac-2",
      owner: "Owner B",
      coOwner: "",
      businessUnit: "",
      implementationStatus: "approved",
      evidenceRequirement: "required",
      reviewDueDate: null,
    });

    const listA = await controlRecords.listByProject(projectA.id);
    const listB = await controlRecords.listByProject(projectB.id);
    assert.equal(listA.length, 1);
    assert.equal(listB.length, 1);
    assert.equal(listA[0].owner, "Owner A");
    assert.equal(listB[0].owner, "Owner B");
    assert.notEqual(listA[0].id, listB[0].id);
  });

  it("cascades delete when the parent project is removed", async () => {
    const { projects, controlRecords } = tempRepos();
    const project = await projects.create({
      name: "Doomed",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    await controlRecords.upsert(project.id, {
      controlId: "ac-3",
      owner: "Temp",
      coOwner: "",
      businessUnit: "",
      implementationStatus: "draft",
      evidenceRequirement: "required",
      reviewDueDate: null,
    });

    await projects.delete(project.id);
    const listed = await controlRecords.listByProject(project.id);
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
        evidenceRequirement: "required" as const,
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
