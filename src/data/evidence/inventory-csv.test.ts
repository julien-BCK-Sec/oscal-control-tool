import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  escapeCsvField,
  evidenceInventoryFilename,
  formatEvidenceInventoryCsv,
  neutralizeCsvFormulaPrefix,
  type EvidenceInventoryRow,
} from "./inventory-csv";

function csvCell(value: string): string {
  return escapeCsvField(neutralizeCsvFormulaPrefix(value));
}

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
    assert.match(lines[2] ?? "", /p1,,,e2,/);
  });

  it("neutralizes spreadsheet formula and control prefixes", () => {
    assert.equal(neutralizeCsvFormulaPrefix("=1+1"), "'=1+1");
    assert.equal(neutralizeCsvFormulaPrefix("+SUM(A1:A2)"), "'+SUM(A1:A2)");
    assert.equal(neutralizeCsvFormulaPrefix("-2+3"), "'-2+3");
    assert.equal(neutralizeCsvFormulaPrefix("@SUM(A1:A2)"), "'@SUM(A1:A2)");
    assert.equal(neutralizeCsvFormulaPrefix("\tprefixed"), "'\tprefixed");
    assert.equal(neutralizeCsvFormulaPrefix("\rprefixed"), "'\rprefixed");
    assert.equal(neutralizeCsvFormulaPrefix("plain title"), "plain title");
    assert.equal(neutralizeCsvFormulaPrefix("1+1"), "1+1");
    assert.equal(neutralizeCsvFormulaPrefix(""), "");
  });

  it("combines formula neutralization with RFC CSV quoting", () => {
    assert.equal(csvCell("=1+1"), "'=1+1");
    assert.equal(csvCell("+SUM(A1:A2)"), "'+SUM(A1:A2)");
    assert.equal(csvCell("-2+3"), "'-2+3");
    assert.equal(csvCell("@SUM(A1:A2)"), "'@SUM(A1:A2)");
    assert.equal(csvCell("\tprefixed"), "'\tprefixed");
    assert.equal(csvCell("\rprefixed"), `"'${"\r"}prefixed"`);
    assert.equal(csvCell("=1+1,plus"), `"'=1+1,plus"`);
    assert.equal(csvCell('=say "hi"'), `"'=say ""hi"""`);
    assert.equal(csvCell("=line\nbreak"), `"'=line\nbreak"`);
    assert.equal(csvCell("+SUM(A1),x"), `"'${"+SUM(A1),x"}"`);
    assert.equal(csvCell("plain"), "plain");
  });

  it("applies formula neutralization through inventory CSV cells", () => {
    const rows: EvidenceInventoryRow[] = [
      {
        projectId: "p1",
        projectName: "=1+1",
        controlId: "+SUM(A1:A2)",
        evidenceRequirement: "required",
        evidenceId: "e1",
        title: "-2+3",
        evidenceType: "policy",
        owner: "@SUM(A1:A2)",
        status: "active",
        collectionDate: "2026-01-01",
        reviewDueDate: null,
        freshness: "no_review_date",
        currentVersionFilename: "\tmalicious.csv",
        currentVersionUploadedAt: "\rCR-prefix",
        linkedControlCount: 1,
      },
    ];
    const csv = formatEvidenceInventoryCsv(rows);
    const line = csv.trimEnd().split("\r\n")[1] ?? "";
    assert.match(line, /'=1\+1/);
    assert.match(line, /'\+SUM\(A1:A2\)/);
    assert.match(line, /'-2\+3/);
    assert.match(line, /'@SUM\(A1:A2\)/);
    assert.match(line, /'\tmalicious\.csv/);
    assert.match(line, /"'\rCR-prefix"/);
    assert.doesNotMatch(line, /(?:^|,)=1\+1/);
    assert.doesNotMatch(line, /(?:^|,)\+SUM/);
    assert.doesNotMatch(line, /(?:^|,)-2\+3/);
    assert.doesNotMatch(line, /(?:^|,)@SUM/);
  });

  it("builds a safe download filename", () => {
    assert.equal(
      evidenceInventoryFilename("Goose Flagship!", "2026-06-01"),
      "evidence-inventory-goose-flagship-2026-06-01.csv",
    );
  });
});
