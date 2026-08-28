import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { dodCloudIl4FrameworkProvider } from "@/data/framework";
import type { FrameworkControl } from "@/data/framework/types";
import {
  buildOverlayPresentation,
  frameworkItemKindLabel,
  frameworkItemSingular,
  isGeneralReadinessItem,
  statementReferenceChrome,
} from "./overlayPresentation";
import { reviewHelperText } from "./useControlReviewTransition";

function byId(): Map<string, FrameworkControl> {
  return new Map(
    dodCloudIl4FrameworkProvider
      .getFramework()
      .controls.map((control) => [control.id, control]),
  );
}

const CONTROL_TERMS = { singular: "control", plural: "controls" } as const;
const REQUIREMENT_TERMS = {
  singular: "requirement",
  plural: "requirements",
} as const;

describe("overlay presentation", () => {
  const items = byId();

  it("presents AC-1 as an effective requirement with FedRAMP assignments inlined", () => {
    const ac1 = items.get("ac-1");
    assert.ok(ac1);
    const sourceStatement = ac1.statement;
    const presentation = buildOverlayPresentation(ac1);
    assert.ok(presentation);
    assert.ok(presentation.effectiveRequirement);
    assert.equal(presentation.notices.length, 0);
    assert.match(
      presentation.effectiveRequirement.text,
      /Policy at least every 3 years/i,
    );
    assert.match(
      presentation.effectiveRequirement.text,
      /Procedures at least annually and following significant changes/i,
    );
    assert.doesNotMatch(
      presentation.effectiveRequirement.text,
      /\{\{\s*insert:\s*param/i,
    );
    assert.equal(presentation.effectiveRequirement.sourceLabel, "FedRAMP Moderate");
    assert.equal(
      presentation.layers.some((layer) => layer.assignments.length > 0),
      false,
    );
    assert.equal(ac1.statement, sourceStatement);
    assert.match(ac1.statement, /\{\{\s*insert:\s*param,\s*ac-01_odp\.05/);
    assert.equal(
      statementReferenceChrome(ac1, CONTROL_TERMS, presentation).heading,
      "Source statement",
    );
    assert.equal(frameworkItemSingular(ac1, CONTROL_TERMS), "control");
    assert.equal(frameworkItemKindLabel(undefined, CONTROL_TERMS), "control");
    assert.equal(frameworkItemKindLabel(ac1, CONTROL_TERMS), "control");
  });

  it("presents the AC-2 quarterly / annual account-review assignment inline", () => {
    const ac2 = items.get("ac-2");
    assert.ok(ac2);
    const presentation = buildOverlayPresentation(ac2);
    assert.ok(presentation);
    assert.ok(presentation.effectiveRequirement);
    assert.match(
      presentation.effectiveRequirement.text,
      /quarterly for privileged access, annually for non-privileged access/,
    );
    assert.match(presentation.effectiveRequirement.text, /twenty-four \(24\) hours/);
    assert.doesNotMatch(
      presentation.effectiveRequirement.text,
      /\{\{\s*insert:\s*param/i,
    );
    assert.equal(presentation.effectiveRequirement.sourceLabel, "FedRAMP Moderate");
    assert.match(ac2.statement, /\{\{\s*insert:\s*param,\s*ac-02_odp\.10/);
  });

  it("presents the AC-7 DoD assignment without guessing DSPAV or synthesizing a winner", () => {
    const ac7 = items.get("ac-7");
    assert.ok(ac7);
    const presentation = buildOverlayPresentation(ac7);
    assert.ok(presentation);
    const dspav = presentation.notices.find(
      (notice) => notice.kind === "authoritative-value-required",
    );
    assert.ok(dspav);
    assert.equal(dspav.title, "DoD assignment required");
    assert.match(dspav.explanation, /not available in the public source material/i);
    assert.match(dspav.explanation, /has not guessed/i);
    const dod = presentation.layers.find((layer) => layer.heading === "DoD IL4");
    assert.ok(dod);
    assert.match(dod.assignments[0]?.text ?? "", /three unsuccessful attempts/i);
    assert.equal(presentation.effectiveRequirement, null);
    assert.match(ac7.statement, /\{\{\s*insert:\s*param,\s*ac-07_odp\.01/);
    assert.doesNotMatch(ac7.statement, /DSPAV/);
  });

  it("presents MA-5(1) as an unresolved DoD assignment", () => {
    const ma51 = items.get("ma-5.1");
    assert.ok(ma51);
    const presentation = buildOverlayPresentation(ma51);
    assert.ok(presentation);
    const dspav = presentation.notices.find(
      (notice) => notice.kind === "authoritative-value-required",
    );
    assert.ok(dspav);
    assert.equal(dspav.title, "DoD assignment required");
    assert.equal(
      presentation.notices.some((notice) => notice.kind === "source-conflict"),
      false,
    );
  });

  it("shows both IA-5(1) sources and no computed winner", () => {
    const ia51 = items.get("ia-5.1");
    assert.ok(ia51);
    const presentation = buildOverlayPresentation(ia51);
    assert.ok(presentation);
    const conflict = presentation.notices.find(
      (notice) => notice.kind === "source-conflict",
    );
    assert.ok(conflict);
    assert.equal(conflict.title, "Source interpretation requires review");
    assert.doesNotMatch(conflict.explanation, /overrides/i);
    assert.doesNotMatch(conflict.explanation, /noncompliant/i);
    const fedramp = presentation.layers.find(
      (layer) => layer.heading === "FedRAMP Moderate",
    );
    const dod = presentation.layers.find((layer) => layer.heading === "DoD IL4");
    assert.ok(fedramp);
    assert.ok(dod);
    assert.match(fedramp.additionalGuidance[0]?.text ?? "", /800-63B/);
    assert.match(dod.assignments[0]?.text ?? "", /15 Characters/i);
    assert.equal(ia51.parameters?.effectiveAssignmentText, null);
    assert.equal(presentation.effectiveRequirement, null);
    assert.match(ia51.statement, /\{\{\s*insert:/);
  });

  it("presents the SC-17 DoD supplemental requirement separately from the statement", () => {
    const sc17 = items.get("sc-17");
    assert.ok(sc17);
    const presentation = buildOverlayPresentation(sc17);
    assert.ok(presentation);
    const dod = presentation.layers.find((layer) => layer.heading === "DoD IL4");
    assert.ok(dod);
    assert.equal(dod.supplements.length, 1);
    assert.match(dod.supplements[0]?.text ?? "", /8520\.02/);
    assert.equal(dod.assignments.length, 0);
    assert.match(sc17.statement, /\{\{\s*insert:/);
    assert.equal(presentation.effectiveRequirement, null);
  });

  it("keeps SC-46 in the population with CDS applicability text", () => {
    const sc46 = items.get("sc-46");
    assert.ok(sc46);
    const presentation = buildOverlayPresentation(sc46);
    assert.ok(presentation);
    const applicability = presentation.layers
      .map((layer) => layer.applicability)
      .find((entry) => entry !== null);
    assert.ok(applicability);
    assert.equal(applicability.label, "Cross Domain Solution (CDS)");
    const notice = presentation.notices.find(
      (entry) => entry.kind === "conditional-applicability",
    );
    assert.ok(notice);
    assert.match(notice.title, /Cross Domain Solution \(CDS\)/);
    assert.match(notice.explanation, /does not mark it not applicable/i);
    assert.equal(presentation.effectiveRequirement, null);
    assert.match(sc46.statement, /\{\{\s*insert:\s*param,\s*sc-46_odp/);
  });

  it("uses general readiness terminology for GRRs", () => {
    const grr1 = items.get("grr-1");
    const grr10 = items.get("grr-10");
    assert.ok(grr1);
    assert.ok(grr10);
    assert.equal(isGeneralReadinessItem(grr1), true);
    assert.equal(isGeneralReadinessItem(grr10), true);
    assert.equal(
      frameworkItemSingular(grr1, CONTROL_TERMS),
      "general readiness requirement",
    );
    assert.equal(
      frameworkItemKindLabel(grr1, CONTROL_TERMS),
      "general readiness requirement",
    );
    assert.equal(frameworkItemKindLabel(undefined, CONTROL_TERMS), "control");
    const chrome = statementReferenceChrome(grr1, CONTROL_TERMS);
    assert.equal(chrome.heading, "General readiness requirement");
    assert.equal(chrome.collapsible, false);
    assert.match(grr1.statement, /DoD PKI/i);
    const presentation = buildOverlayPresentation(grr1);
    assert.equal(presentation?.effectiveRequirement ?? null, null);
    assert.match(
      reviewHelperText("not_reviewed", "general readiness requirement"),
      /general readiness requirement/,
    );
    assert.doesNotMatch(
      reviewHelperText("under_review", "general readiness requirement"),
      /NIST control/i,
    );
  });

  it("points overlay presentation at the IL4 Help topic", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/components/controlBrowser/OverlayMetadataPanel.tsx"),
      "utf8",
    );
    assert.match(source, /slug="dod-cloud-il4"/);
    assert.match(source, /how-nist-fedramp-and-dod-layers-appear/);
  });

  it("keeps the source statement collapsed independently of requirement expand preference", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/components/controlBrowser/ControlEditorWorkspace.tsx",
      ),
      "utf8",
    );
    assert.match(source, /control-freak:source-statement-expanded/);
  });

  it("does not treat CMMC requirements as overlay or GRR items", () => {
    const cmmc = {
      id: "AC.L2-3.1.1",
      title: "Limit system access",
      family: "Access Control",
      statement: "Limit system access to authorized users.",
      source: "CMMC",
      sourceVersion: "r2",
      originId: "3.1.1",
    } satisfies FrameworkControl;
    assert.equal(buildOverlayPresentation(cmmc), null);
    assert.equal(isGeneralReadinessItem(cmmc), false);
    assert.equal(frameworkItemSingular(cmmc, REQUIREMENT_TERMS), "requirement");
    assert.equal(
      statementReferenceChrome(cmmc, REQUIREMENT_TERMS).heading,
      "Requirement",
    );
  });

  it("uses Source statement chrome for ordinary NIST items that contain catalog inserts", () => {
    const nist = {
      id: "ac-1",
      title: "Policy and Procedures",
      family: "Access Control",
      statement: "Develop {{ insert: param, ac-01_odp.05 }} policy.",
      source: "NIST SP 800-53 Rev. 5 Moderate",
      sourceVersion: "5.2.0",
    } satisfies FrameworkControl;
    assert.equal(buildOverlayPresentation(nist), null);
    assert.equal(
      statementReferenceChrome(nist, CONTROL_TERMS).heading,
      "Source statement",
    );
    assert.equal(
      statementReferenceChrome(nist, CONTROL_TERMS).collapsible,
      true,
    );
  });
});
