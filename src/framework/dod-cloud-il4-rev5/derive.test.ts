import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { nistProfileSelectedIds } from "./catalog";
import { deriveDodCloudIl4Framework } from "./derive";
import {
  DOD_ADDED_NIST_BASE_IDS,
  DOD_ADDED_NIST_ENHANCEMENT_IDS,
  DOD_CLOUD_IL4_FRAMEWORK_ID,
  DOD_GRR_FAMILY,
  FEDRAMP_MODERATE_BASE_COUNT,
  FEDRAMP_MODERATE_ENHANCEMENT_COUNT,
  FEDRAMP_MODERATE_TOTAL_COUNT,
  GRR_IDS,
  IL4_GRR_COUNT,
  IL4_NIST_BASE_COUNT,
  IL4_NIST_ENHANCEMENT_COUNT,
  IL4_TOTAL_COUNT,
} from "./identities";
import { isGrrId, isNistBaseId, isNistEnhancementId, normalizeFrameworkControlId } from "./ids";
import { parseAddendumExtract } from "./parse-addendum";
import { parseAppendixDExtract } from "./parse-appendix-d";
import { parseFedrampModerateWorkbook } from "./parse-fedramp-moderate";
import {
  ADDENDUM_EXTRACT_VENDOR_FILE,
  APPENDIX_D_EXTRACT_VENDOR_FILE,
  FEDRAMP_BASELINE_VENDOR_FILE,
  NIST_CATALOG_VENDOR_FILE,
  NIST_MODERATE_PROFILE_VENDOR_FILE,
} from "./sources";
import type { DodIl4FrameworkArtifact, DodIl4OverlayItem } from "./types";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function derive(): DodIl4FrameworkArtifact {
  const fedramp = parseFedrampModerateWorkbook(
    readFileSync(path.join(repoRoot, FEDRAMP_BASELINE_VENDOR_FILE)),
  );
  const result = deriveDodCloudIl4Framework({
    catalogRoot: readJson(NIST_CATALOG_VENDOR_FILE),
    nistModerateIds: nistProfileSelectedIds(readJson(NIST_MODERATE_PROFILE_VENDOR_FILE)),
    fedrampRows: fedramp.rows,
    addendum: parseAddendumExtract(readJson(ADDENDUM_EXTRACT_VENDOR_FILE)),
    appendixDNotes: parseAppendixDExtract(readJson(APPENDIX_D_EXTRACT_VENDOR_FILE)),
    fedrampSha256: fedramp.sha256,
  });
  assert.equal(result.ok, true, result.ok ? "" : result.message);
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.artifact;
}

function byId(artifact: DodIl4FrameworkArtifact): Map<string, DodIl4OverlayItem> {
  return new Map(artifact.items.map((item) => [item.id, item]));
}

describe("normalizeFrameworkControlId", () => {
  it("normalizes NIST and GRR identifiers to the Control Freak grammar", () => {
    assert.equal(normalizeFrameworkControlId("AC-2"), "ac-2");
    assert.equal(normalizeFrameworkControlId("AC-2(7)"), "ac-2.7");
    assert.equal(normalizeFrameworkControlId("GRR-1"), "grr-1");
    assert.equal(normalizeFrameworkControlId("GRR-10"), "grr-10");
    assert.equal(isNistBaseId("sc-24"), true);
    assert.equal(isNistEnhancementId("au-5.1"), true);
    assert.equal(isGrrId("grr-10"), true);
  });
});

describe("FedRAMP Moderate baseline source", () => {
  it("parses the pinned workbook as 181 base / 142 enhancements / 323 total", () => {
    const parsed = parseFedrampModerateWorkbook(
      readFileSync(path.join(repoRoot, FEDRAMP_BASELINE_VENDOR_FILE)),
    );
    const bases = parsed.rows.filter((row) => isNistBaseId(row.id)).length;
    const enhancements = parsed.rows.filter((row) => isNistEnhancementId(row.id)).length;
    assert.equal(bases, FEDRAMP_MODERATE_BASE_COUNT);
    assert.equal(enhancements, FEDRAMP_MODERATE_ENHANCEMENT_COUNT);
    assert.equal(parsed.rows.length, FEDRAMP_MODERATE_TOTAL_COUNT);
    assert.equal(new Set(parsed.rows.map((row) => row.id)).size, FEDRAMP_MODERATE_TOTAL_COUNT);
  });
});

describe("deriveDodCloudIl4Framework population", () => {
  const artifact = derive();
  const items = byId(artifact);

  it("uses the approved durable framework id and overlay source label", () => {
    assert.equal(artifact.id, DOD_CLOUD_IL4_FRAMEWORK_ID);
    assert.match(artifact.source, /FedRAMP Rev\. 5 Moderate/);
  });

  it("derives the approved IL4 Moderate / MMx population", () => {
    assert.equal(artifact.counts.fedrampModerateBase, FEDRAMP_MODERATE_BASE_COUNT);
    assert.equal(
      artifact.counts.fedrampModerateEnhancements,
      FEDRAMP_MODERATE_ENHANCEMENT_COUNT,
    );
    assert.equal(artifact.counts.fedrampModerateTotal, FEDRAMP_MODERATE_TOTAL_COUNT);
    assert.equal(artifact.counts.nistBase, IL4_NIST_BASE_COUNT);
    assert.equal(artifact.counts.nistEnhancements, IL4_NIST_ENHANCEMENT_COUNT);
    assert.equal(artifact.counts.grr, IL4_GRR_COUNT);
    assert.equal(artifact.counts.total, IL4_TOTAL_COUNT);
    assert.equal(artifact.items.length, IL4_TOTAL_COUNT);
  });

  it("contains every NIST Moderate and FedRAMP Moderate identifier", () => {
    const nistModerateIds = nistProfileSelectedIds(
      readJson(NIST_MODERATE_PROFILE_VENDOR_FILE),
    );
    const fedrampIds = parseFedrampModerateWorkbook(
      readFileSync(path.join(repoRoot, FEDRAMP_BASELINE_VENDOR_FILE)),
    ).rows.map((row) => row.id);
    for (const id of nistModerateIds) {
      assert.equal(items.has(id), true, `missing NIST Moderate ${id}`);
    }
    for (const id of fedrampIds) {
      assert.equal(items.has(id), true, `missing FedRAMP Moderate ${id}`);
    }
  });

  it("includes the 12 DoD-added NIST IDs and GRR-1 through GRR-10 once", () => {
    for (const id of [...DOD_ADDED_NIST_BASE_IDS, ...DOD_ADDED_NIST_ENHANCEMENT_IDS]) {
      assert.equal(items.has(id), true, `missing DoD-added ${id}`);
    }
    for (const id of GRR_IDS) {
      const matches = artifact.items.filter((item) => item.id === id);
      assert.equal(matches.length, 1, `GRR ${id} count ${matches.length}`);
      assert.equal(matches[0]?.family, DOD_GRR_FAMILY);
      assert.equal(matches[0]?.itemKind, "dod-grr");
    }
    assert.ok(items.has("sc-24"));
    assert.ok(items.has("sc-46"));
    assert.ok(items.has("au-5.1"));
    assert.ok(items.has("ps-3.4"));
    assert.ok(items.has("sa-9.3"));
    assert.ok(items.has("sc-18.2"));
    assert.ok(items.has("grr-1"));
    assert.ok(items.has("grr-10"));
  });
});

describe("deriveDodCloudIl4Framework parameters and provenance", () => {
  const items = byId(derive());

  it("retains FedRAMP AC-1 assignments without a DoD override", () => {
    const ac1 = items.get("ac-1");
    assert.ok(ac1);
    assert.match(ac1.parameters.fedrampAssignment?.text ?? "", /at least every 3 years/);
    assert.equal(ac1.parameters.dodAssignment, null);
    assert.equal(ac1.parameters.effectiveAssignmentSource, "fedramp-moderate-baseline");
    assert.match(ac1.parameters.effectiveAssignmentText ?? "", /at least annually/);
  });

  it("retains AC-2 privileged quarterly / non-privileged annual account review", () => {
    const ac2 = items.get("ac-2");
    assert.ok(ac2);
    assert.match(
      ac2.parameters.fedrampAssignment?.text ?? "",
      /quarterly for privileged access, annually for non-privileged access/,
    );
    assert.equal(ac2.parameters.effectiveAssignmentSource, "fedramp-moderate-baseline");
  });

  it("retains the AC-7 DoD assignment and unresolved DSPAV fallback", () => {
    const ac7 = items.get("ac-7");
    assert.ok(ac7);
    assert.match(ac7.parameters.dodAssignment?.text ?? "", /three unsuccessful attempts/i);
    assert.equal(ac7.parameters.dspavStatus, "authoritative-value-required");
    assert.match(ac7.parameters.conditionality ?? "", /rate limiting/i);
  });

  it("preserves the IA-5(1) FedRAMP vs DoD conflict without choosing a winner", () => {
    const ia51 = items.get("ia-5.1");
    assert.ok(ia51);
    assert.match(ia51.parameters.fedrampAdditionalGuidance?.text ?? "", /800-63B/);
    assert.match(ia51.parameters.dodAssignment?.text ?? "", /15 Characters/i);
    assert.equal(ia51.parameters.interpretationConflict, true);
    assert.equal(ia51.parameters.effectiveAssignmentText, null);
    assert.equal(ia51.parameters.dspavStatus, "source-conflict");
  });

  it("represents MA-5(1) as an unresolved DSPAV", () => {
    const ma51 = items.get("ma-5.1");
    assert.ok(ma51);
    assert.equal(ma51.parameters.dspavStatus, "authoritative-value-required");
    assert.match(ma51.parameters.dodAssignment?.text ?? "", /No DSPAV available/i);
    assert.equal(ma51.parameters.effectiveAssignmentText, null);
  });

  it("retains the SA-9(5) DoD jurisdiction / location override", () => {
    const sa95 = items.get("sa-9.5");
    assert.ok(sa95);
    assert.match(sa95.parameters.dodAssignment?.text ?? "", /U\.S\. Territories/i);
    assert.equal(sa95.parameters.effectiveAssignmentSource, "dod-ssp-addendum-v1.2");
  });

  it("retains the SC-17 DoD supplemental PKI policy reference", () => {
    const sc17 = items.get("sc-17");
    assert.ok(sc17);
    assert.equal(sc17.dodSupplements.length, 1);
    assert.match(sc17.dodSupplements[0]?.text ?? "", /8520\.02/);
  });

  it("marks SC-46 as CDS-conditional without removing it from the population", () => {
    const sc46 = items.get("sc-46");
    assert.ok(sc46);
    assert.equal(sc46.applicability.kind, "conditional");
    assert.equal(sc46.applicability.condition, "cds");
    assert.match(sc46.applicability.notes, /does not mean the control is always applicable/i);
  });

  it("retains GRR questionnaire and discussion with DoD provenance", () => {
    const grr1 = items.get("grr-1");
    assert.ok(grr1);
    assert.equal(grr1.family, DOD_GRR_FAMILY);
    assert.equal(grr1.source, "dod-ssp-addendum-v1.2");
    assert.match(grr1.statement, /DoD PKI/i);
    assert.equal(grr1.itemKind, "dod-grr");
    const grr2 = items.get("grr-2");
    assert.match(grr2?.discussion ?? "", /CC SRG/i);
  });
});
