import assert from "node:assert/strict";
import { describe, it } from "node:test";
import generatedDodCloudIl4 from "@/data/framework/generated/dod-cloud-il4-rev5.json";
import { dodCloudIl4FrameworkProvider } from "@/data/framework";
import {
  DOD_CLOUD_IL4_FRAMEWORK_ID,
  DOD_CLOUD_IL4_PRESENTATION_TITLE,
  DOD_GRR_FAMILY,
  GRR_IDS,
  IL4_GRR_COUNT,
  IL4_NIST_BASE_COUNT,
  IL4_NIST_ENHANCEMENT_COUNT,
  IL4_TOTAL_COUNT,
} from "./identities";
import {
  InvalidDodCloudIl4ArtifactError,
  mapDodCloudIl4ArtifactToFramework,
} from "./runtime";

function byId() {
  const framework = dodCloudIl4FrameworkProvider.getFramework();
  return {
    framework,
    items: new Map(framework.controls.map((control) => [control.id, control])),
  };
}

describe("DoD Cloud IL4 FrameworkProvider", () => {
  const { framework, items } = byId();

  it("exposes dod-cloud-il4-rev5 with the approved 345-item population", () => {
    assert.equal(framework.id, DOD_CLOUD_IL4_FRAMEWORK_ID);
    assert.equal(framework.title, DOD_CLOUD_IL4_PRESENTATION_TITLE);
    assert.equal(framework.controls.length, IL4_TOTAL_COUNT);
    assert.equal(
      framework.controls.filter((control) => control.itemKind === "base").length,
      IL4_NIST_BASE_COUNT,
    );
    assert.equal(
      framework.controls.filter((control) => control.itemKind === "enhancement")
        .length,
      IL4_NIST_ENHANCEMENT_COUNT,
    );
    assert.equal(
      framework.controls.filter((control) => control.itemKind === "other").length,
      IL4_GRR_COUNT,
    );
    assert.deepEqual(
      new Set(
        framework.controls
          .filter((control) => control.id.startsWith("grr-"))
          .map((control) => control.id),
      ),
      new Set(GRR_IDS),
    );
  });

  it("resolves representative NIST, overlay, and GRR identifiers", () => {
    for (const id of [
      "ac-1",
      "ac-2",
      "sc-24",
      "sc-46",
      "au-5.1",
      "ia-5.1",
      "ma-5.1",
      "sa-9.5",
      "sc-17",
      "grr-1",
      "grr-10",
    ]) {
      assert.equal(items.has(id), true, `missing ${id}`);
    }
  });

  it("keeps NIST statements unmerged from overlay assignments", () => {
    const ac1 = items.get("ac-1");
    assert.ok(ac1);
    assert.match(ac1.statement, /\{\{\s*insert:/);
    assert.doesNotMatch(ac1.statement, /at least every 3 years/);
    assert.match(
      ac1.parameters?.baselineAssignment?.text ?? "",
      /at least every 3 years/,
    );
  });

  it("preserves the FedRAMP AC-1 assignment without a DoD overlay assignment", () => {
    const ac1 = items.get("ac-1");
    assert.ok(ac1);
    assert.equal(ac1.itemKind, "base");
    assert.equal(ac1.parameters?.overlayAssignment, null);
    assert.equal(
      ac1.parameters?.effectiveAssignmentSource,
      "fedramp-moderate-baseline",
    );
    assert.equal(ac1.parameters?.interpretationConflict, false);
    assert.equal(ac1.selectionProvenance?.inCatalogBaseline, true);
    assert.equal(ac1.selectionProvenance?.inExternalBaseline, true);
    assert.equal(ac1.selectionProvenance?.inOverlay, true);
  });

  it("preserves the AC-2 quarterly privileged / annual non-privileged assignment", () => {
    const ac2 = items.get("ac-2");
    assert.ok(ac2);
    assert.match(
      ac2.parameters?.baselineAssignment?.text ?? "",
      /quarterly for privileged access, annually for non-privileged access/,
    );
    assert.equal(
      ac2.parameters?.effectiveAssignmentSource,
      "fedramp-moderate-baseline",
    );
  });

  it("preserves the AC-7 DoD assignment and unresolved DSPAV fallback", () => {
    const ac7 = items.get("ac-7");
    assert.ok(ac7);
    assert.match(
      ac7.parameters?.overlayAssignment?.text ?? "",
      /three unsuccessful attempts/i,
    );
    assert.equal(
      ac7.parameters?.authoritativeValueStatus,
      "authoritative-value-required",
    );
    assert.match(ac7.parameters?.conditionality ?? "", /rate limiting/i);
  });

  it("preserves the IA-5(1) source conflict without computing a winner", () => {
    const ia51 = items.get("ia-5.1");
    assert.ok(ia51);
    assert.equal(ia51.itemKind, "enhancement");
    assert.match(
      ia51.parameters?.baselineAdditionalGuidance?.text ?? "",
      /800-63B/,
    );
    assert.match(ia51.parameters?.overlayAssignment?.text ?? "", /15 Characters/i);
    assert.equal(ia51.parameters?.interpretationConflict, true);
    assert.equal(ia51.parameters?.effectiveAssignmentText, null);
    assert.equal(ia51.parameters?.effectiveAssignmentSource, null);
    assert.equal(ia51.parameters?.authoritativeValueStatus, "source-conflict");
  });

  it("preserves MA-5(1) as an unresolved authoritative value", () => {
    const ma51 = items.get("ma-5.1");
    assert.ok(ma51);
    assert.equal(
      ma51.parameters?.authoritativeValueStatus,
      "authoritative-value-required",
    );
    assert.match(ma51.parameters?.overlayAssignment?.text ?? "", /No DSPAV available/i);
    assert.equal(ma51.parameters?.effectiveAssignmentText, null);
  });

  it("preserves the SA-9(5) DoD jurisdiction overlay assignment", () => {
    const sa95 = items.get("sa-9.5");
    assert.ok(sa95);
    assert.match(
      sa95.parameters?.overlayAssignment?.text ?? "",
      /U\.S\. Territories/i,
    );
    assert.equal(
      sa95.parameters?.effectiveAssignmentSource,
      "dod-ssp-addendum-v1.2",
    );
  });

  it("preserves the SC-17 overlay supplement without rewriting the NIST statement", () => {
    const sc17 = items.get("sc-17");
    assert.ok(sc17);
    assert.match(sc17.statement, /\{\{\s*insert:/);
    assert.equal(sc17.supplements?.length, 1);
    assert.match(sc17.supplements?.[0]?.text ?? "", /8520\.02/);
    assert.equal(sc17.supplements?.[0]?.source, "dod-ssp-addendum-v1.2");
  });

  it("keeps SC-46 in the population with CDS applicability metadata", () => {
    const sc46 = items.get("sc-46");
    assert.ok(sc46);
    assert.equal(sc46.applicability?.kind, "conditional");
    assert.equal(sc46.applicability?.condition, "cds");
    assert.match(
      sc46.applicability?.notes ?? "",
      /does not mean the control is always applicable/i,
    );
    assert.equal(sc46.selectionProvenance?.inCatalogBaseline, false);
    assert.equal(sc46.selectionProvenance?.inOverlay, true);
  });

  it("treats GRR-1 through GRR-10 as non-NIST overlay items", () => {
    const grr1 = items.get("grr-1");
    const grr10 = items.get("grr-10");
    assert.ok(grr1);
    assert.ok(grr10);
    assert.equal(grr1.itemKind, "other");
    assert.equal(grr10.itemKind, "other");
    assert.equal(grr1.family, DOD_GRR_FAMILY);
    assert.equal(grr10.family, DOD_GRR_FAMILY);
    assert.equal(grr1.source, "dod-ssp-addendum-v1.2");
    assert.equal(grr1.selectionProvenance?.inCatalogBaseline, false);
    assert.equal(grr1.selectionProvenance?.inExternalBaseline, false);
    assert.match(grr1.statement, /DoD PKI/i);
    assert.match(grr10.statement, /defense-in-depth/i);
    assert.equal(grr1.parameters?.baselineAssignment, null);
    assert.equal(grr1.parameters?.overlayAssignment, null);
  });

  it("maps AU-5(1) may-use-FedRAMP status to the generic baseline status", () => {
    const au51 = items.get("au-5.1");
    assert.ok(au51);
    assert.equal(au51.parameters?.authoritativeValueStatus, "may-use-baseline");
    assert.match(
      au51.parameters?.effectiveAssignmentText ?? "",
      /75%, or one month/,
    );
  });

  it("fails closed when the generated artifact is invalid", () => {
    assert.throws(
      () => mapDodCloudIl4ArtifactToFramework({ id: DOD_CLOUD_IL4_FRAMEWORK_ID }),
      (error: unknown) => error instanceof InvalidDodCloudIl4ArtifactError,
    );
    assert.throws(
      () =>
        mapDodCloudIl4ArtifactToFramework({
          ...generatedDodCloudIl4,
          id: "not-dod-cloud-il4-rev5",
        }),
      /id must be dod-cloud-il4-rev5/,
    );
    assert.throws(
      () =>
        mapDodCloudIl4ArtifactToFramework({
          ...generatedDodCloudIl4,
          items: generatedDodCloudIl4.items.slice(0, 10),
        }),
      InvalidDodCloudIl4ArtifactError,
    );
  });
});
