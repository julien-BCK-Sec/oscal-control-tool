import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { TABLE_D1_IL4_COUNT } from "./identities";
import {
  inferTableD1AdjustmentKind,
  parseAppendixDExtract,
} from "./parse-appendix-d";
import { APPENDIX_D_EXTRACT_VENDOR_FILE, CSP_SRG_V1R7_PDF_SHA256 } from "./sources";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

describe("parseAppendixDExtract", () => {
  const raw = readJson(APPENDIX_D_EXTRACT_VENDOR_FILE) as {
    source: { pdfSha256: string };
    notes: Array<Record<string, unknown>>;
  };

  it("parses the pinned Table D-1 extract with membership metadata", () => {
    const notes = parseAppendixDExtract(raw);
    assert.equal(raw.source.pdfSha256, CSP_SRG_V1R7_PDF_SHA256);
    assert.equal(notes.length, TABLE_D1_IL4_COUNT);
    assert.equal(
      notes.every((note) => note.listedInTableD1 === true),
      true,
    );
    const byId = new Map(notes.map((note) => [note.id, note]));
    assert.equal(byId.get("au-5.1")?.tableD1AdjustmentKind, "may-use-fedramp");
    assert.equal(byId.get("ma-6")?.tableD1AdjustmentKind, "may-use-fedramp");
    assert.equal(byId.get("ps-4")?.tableD1AdjustmentKind, "may-use-fedramp");
    assert.equal(byId.get("cm-7.5")?.tableD1AdjustmentKind, "dspav-must-be-used");
    assert.equal(byId.get("ac-7")?.tableD1AdjustmentKind, "explicit-value");
    assert.equal(byId.get("sc-17")?.tableD1AdjustmentKind, "explicit-value");
    assert.equal(byId.get("ma-5.5")?.tableD1AdjustmentKind, "inclusion-only");
    assert.equal(byId.get("sc-18")?.tableD1AdjustmentKind, "inclusion-only");
    assert.equal(byId.get("sc-46")?.tableD1AdjustmentKind, "dspav-must-be-used");
  });

  it("infers adjustment kind from Table D-1 parameter text without Addendum equality", () => {
    assert.equal(inferTableD1AdjustmentKind(""), "inclusion-only");
    assert.equal(
      inferTableD1AdjustmentKind("CSP/CSO may use FedRAMP value."),
      "may-use-fedramp",
    );
    assert.equal(inferTableD1AdjustmentKind("DSPAV must be used."), "dspav-must-be-used");
    assert.equal(
      inferTableD1AdjustmentKind("DODI 8520.02, Public Key Infrastructure (PKI)."),
      "explicit-value",
    );
  });

  it("fails closed when Table D-1 membership metadata is missing", () => {
    const clone = structuredClone(raw);
    delete clone.notes[0]?.listedInTableD1;
    assert.throws(
      () => parseAppendixDExtract(clone),
      /listedInTableD1/,
    );
  });

  it("fails closed when declared kind does not match parameter text", () => {
    const clone = structuredClone(raw);
    const au51 = clone.notes.find((note) => note.originId === "AU-5(1)");
    assert.ok(au51);
    au51.tableD1AdjustmentKind = "explicit-value";
    assert.throws(
      () => parseAppendixDExtract(clone),
      /does not match parameter text/,
    );
  });
});
