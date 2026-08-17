import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  escapeCsvField,
  evidenceInventoryFilename,
  formatEvidenceInventoryCsv,
  type EvidenceInventoryRow,
} from "./inventory-csv";

describe("evidence inventory CSV", () => {
  it("escapes quotes, commas, and newlines", () => {
    assert.equal(escapeCsvField("plain"), "plain");
    assert.equal(escapeCsvField("a,b"), '"a,b"');
    assert.equal(escapeCsvField('say "hi"'), '"say ""hi"""');
    assert.equal(escapeCsvField("line\nbreak"), '"line\nbreak"');
  });

  it("emits a header, pairwise rows, and empty control fields for unlinked evidence", () => {
    const rows: EvidenceInventoryRow[] = [
      {
        projectId: "p1",
        projectName: "Goose, Inc.",
        controlId: "ac-2",
        evidenceRequirement: "required",
        evidenceId: "e1",
        title: 'Policy "A"',
        evidenceType: "policy",
        owner: "Sam",
        status: "active",
        collectionDate: "2026-01-01",
        reviewDueDate: "2026-06-15",
        freshness: "due_soon",
        currentVersionFilename: "policy.pdf",
        currentVersionUploadedAt: "2026-01-02T00:00:00.000Z",
        linkedControlCount: 1,
      },
      {
        projectId: "p1",
        projectName: "Goose, Inc.",
        controlId: null,
        evidenceRequirement: null,
        evidenceId: "e2",
        title: "Unlinked draft",
        evidenceType: "other",
        owner: "",
        status: "draft",
        collectionDate: null,
        reviewDueDate: null,
        freshness: "no_review_date",
        currentVersionFilename: null,
        currentVersionUploadedAt: null,
        linkedControlCount: 0,
      },
    ];
    const csv = formatEvidenceInventoryCsv(rows);
    assert.match(csv, /^Project,Project ID,Control ID,/);
    assert.match(csv, /"Goose, Inc\."/);
    assert.match(csv, /ac-2/);
    assert.match(csv, /Required/);
    assert.match(csv, /"Policy ""A"""/);
    assert.match(csv, /Due soon/);
    assert.match(csv, /policy\.pdf/);
    assert.doesNotMatch(csv, /storage/i);
    assert.doesNotMatch(csv, /bucket/i);
    const lines = csv.trimEnd().split("\r\n");
    assert.equal(lines.length, 3);
    const unlinked = lines[2]?.split(",") ?? [];
    assert.equal(unlinked[2], "");
    assert.equal(unlinked[3], "");
  });

  it("builds a safe download filename", () => {
    assert.equal(
      evidenceInventoryFilename("Goose Flagship!", "2026-06-01"),
      "evidence-inventory-goose-flagship-2026-06-01.csv",
    );
  });
});
