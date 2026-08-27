import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cmmcLevel2FrameworkProvider,
  dodCloudIl4FrameworkProvider,
  nistHighFrameworkProvider,
  nistLowFrameworkProvider,
  nistModerateFrameworkProvider,
} from "@/data/framework";
import type { Framework, FrameworkControl } from "@/data/framework/types";
import {
  authoringTextContainsRawParamInsert,
  renderAuthoringRequirement,
} from "./authoringRequirement";
import { buildOverlayPresentation, statementReferenceChrome } from "./overlayPresentation";

const CONTROL_TERMS = { singular: "control", plural: "controls" } as const;
const REQUIREMENT_TERMS = {
  singular: "requirement",
  plural: "requirements",
} as const;

function byId(framework: Framework): Map<string, FrameworkControl> {
  return new Map(framework.controls.map((control) => [control.id, control]));
}

function assertNoRawInsert(text: string, label: string): void {
  assert.equal(
    authoringTextContainsRawParamInsert(text),
    false,
    `${label} leaked raw parameter insert syntax`,
  );
}

describe("renderAuthoringRequirement", () => {
  it("renders NIST AC-6(1) with catalog parameter labels and keeps the source statement", () => {
    const ac61 = byId(nistModerateFrameworkProvider.getFramework()).get("ac-6.1");
    assert.ok(ac61);
    const sourceStatement = ac61.statement;
    const authoring = renderAuthoringRequirement(ac61);
    assert.match(authoring.text, /\[individuals and roles\]/);
    assert.match(
      authoring.text,
      /\[organization-defined security functions \(deployed in hardware, software, and firmware\)\]/,
    );
    assert.match(authoring.text, /\[security-relevant information\]/);
    assertNoRawInsert(authoring.text, "NIST AC-6(1) authoring requirement");
    assert.equal(ac61.statement, sourceStatement);
    assert.match(ac61.statement, /\{\{\s*insert:\s*param,\s*ac-06\.01_odp\.01/);
    assert.equal(authoring.substitutedAssignments, false);
    assert.equal(
      statementReferenceChrome(ac61, CONTROL_TERMS).heading,
      "Source statement",
    );
    assert.equal(
      statementReferenceChrome(ac61, CONTROL_TERMS).collapsible,
      true,
    );
    assert.equal(buildOverlayPresentation(ac61), null);
  });

  it("inlines IL4 AC-1 FedRAMP assignments and describes remaining ODPs", () => {
    const ac1 = byId(dodCloudIl4FrameworkProvider.getFramework()).get("ac-1");
    assert.ok(ac1);
    const sourceStatement = ac1.statement;
    const authoring = renderAuthoringRequirement(ac1);
    const presentation = buildOverlayPresentation(ac1);
    assert.ok(presentation?.effectiveRequirement);
    assert.match(authoring.text, /Policy at least every 3 years/i);
    assert.match(
      authoring.text,
      /Procedures at least annually and following significant changes/i,
    );
    assert.match(authoring.text, /\[organization-defined personnel or roles\]/);
    assert.match(
      authoring.text,
      /\[one or more of: organization-level; mission\/business process-level; system-level\]/,
    );
    assertNoRawInsert(authoring.text, "IL4 AC-1 effective requirement");
    assert.equal(presentation.effectiveRequirement.sourceLabel, "FedRAMP Moderate");
    assert.equal(ac1.statement, sourceStatement);
    assert.match(ac1.statement, /\{\{\s*insert:\s*param,\s*ac-01_odp\.03/);
    assert.equal(
      statementReferenceChrome(ac1, CONTROL_TERMS, presentation).heading,
      "Source statement",
    );
    assert.equal(
      statementReferenceChrome(ac1, CONTROL_TERMS, presentation).collapsible,
      true,
    );
  });

  it("inlines IL4 AC-2 review assignments without raw insert syntax", () => {
    const ac2 = byId(dodCloudIl4FrameworkProvider.getFramework()).get("ac-2");
    assert.ok(ac2);
    const authoring = renderAuthoringRequirement(ac2);
    assert.match(
      authoring.text,
      /quarterly for privileged access, annually for non-privileged access/,
    );
    assertNoRawInsert(authoring.text, "IL4 AC-2 effective requirement");
    assert.match(ac2.statement, /\{\{\s*insert:\s*param,\s*ac-02_odp\.10/);
  });

  it("keeps IL4 AC-7 DSPAV semantics and humanizes leftover tokens", () => {
    const ac7 = byId(dodCloudIl4FrameworkProvider.getFramework()).get("ac-7");
    assert.ok(ac7);
    const authoring = renderAuthoringRequirement(ac7);
    const presentation = buildOverlayPresentation(ac7);
    assert.ok(presentation);
    assert.equal(presentation.effectiveRequirement, null);
    assert.equal(authoring.substitutedAssignments, false);
    const dspav = presentation.notices.find(
      (notice) => notice.kind === "authoritative-value-required",
    );
    assert.ok(dspav);
    assert.equal(dspav.title, "DoD assignment required");
    const dod = presentation.layers.find((layer) => layer.heading === "DoD IL4");
    assert.ok(dod);
    assert.match(dod.assignments[0]?.text ?? "", /three unsuccessful attempts/i);
    assertNoRawInsert(authoring.text, "IL4 AC-7 authoring requirement");
    assert.doesNotMatch(authoring.text, /DSPAV/);
    assert.match(ac7.statement, /\{\{\s*insert:\s*param,\s*ac-07_odp\.01/);
  });

  it("keeps IL4 IA-5(1) as a source conflict with a human-readable statement", () => {
    const ia51 = byId(dodCloudIl4FrameworkProvider.getFramework()).get("ia-5.1");
    assert.ok(ia51);
    const authoring = renderAuthoringRequirement(ia51);
    const presentation = buildOverlayPresentation(ia51);
    assert.ok(presentation);
    assert.equal(presentation.effectiveRequirement, null);
    assert.equal(authoring.substitutedAssignments, false);
    const conflict = presentation.notices.find(
      (notice) => notice.kind === "source-conflict",
    );
    assert.ok(conflict);
    const fedramp = presentation.layers.find(
      (layer) => layer.heading === "FedRAMP Moderate",
    );
    const dod = presentation.layers.find((layer) => layer.heading === "DoD IL4");
    assert.ok(fedramp);
    assert.ok(dod);
    assert.match(fedramp.additionalGuidance[0]?.text ?? "", /800-63B/);
    assert.match(dod.assignments[0]?.text ?? "", /15 Characters/i);
    assertNoRawInsert(authoring.text, "IL4 IA-5(1) authoring requirement");
    assert.match(ia51.statement, /\{\{\s*insert:/);
  });

  it("keeps SC-17 supplemental DoD content separate from the NIST statement", () => {
    const sc17 = byId(dodCloudIl4FrameworkProvider.getFramework()).get("sc-17");
    assert.ok(sc17);
    const authoring = renderAuthoringRequirement(sc17);
    const presentation = buildOverlayPresentation(sc17);
    assert.ok(presentation);
    const dod = presentation.layers.find((layer) => layer.heading === "DoD IL4");
    assert.ok(dod);
    assert.equal(dod.supplements.length, 1);
    assert.equal(presentation.effectiveRequirement, null);
    assertNoRawInsert(authoring.text, "IL4 SC-17 authoring requirement");
    assert.match(sc17.statement, /\{\{\s*insert:/);
  });

  it("keeps SC-46 CDS conditionality separate from the requirement text", () => {
    const sc46 = byId(dodCloudIl4FrameworkProvider.getFramework()).get("sc-46");
    assert.ok(sc46);
    const authoring = renderAuthoringRequirement(sc46);
    const presentation = buildOverlayPresentation(sc46);
    assert.ok(presentation);
    const notice = presentation.notices.find(
      (entry) => entry.kind === "conditional-applicability",
    );
    assert.ok(notice);
    assert.equal(presentation.effectiveRequirement, null);
    assertNoRawInsert(authoring.text, "IL4 SC-46 authoring requirement");
    assert.doesNotMatch(authoring.text, /not applicable/i);
    assert.match(sc46.statement, /\{\{\s*insert:\s*param,\s*sc-46_odp/);
  });

  it("leaves GRR-1 questionnaire text unchanged", () => {
    const grr1 = byId(dodCloudIl4FrameworkProvider.getFramework()).get("grr-1");
    assert.ok(grr1);
    const authoring = renderAuthoringRequirement(grr1);
    assert.equal(authoring.text, grr1.statement);
    assert.equal(authoring.substitutedAssignments, false);
    assert.equal(authoring.hasParamInserts, false);
    assert.match(grr1.statement, /DoD PKI/i);
  });

  it("leaves CMMC requirement text unchanged", () => {
    const cmmc = cmmcLevel2FrameworkProvider.getFramework().controls[0];
    assert.ok(cmmc);
    const authoring = renderAuthoringRequirement(cmmc);
    assert.equal(authoring.text, cmmc.statement);
    assert.equal(authoring.hasParamInserts, false);
    assertNoRawInsert(authoring.text, "CMMC authoring requirement");
    assert.equal(
      statementReferenceChrome(cmmc, REQUIREMENT_TERMS).heading,
      "Requirement",
    );
  });

  it("does not leak raw parameter insert syntax from NIST-derived authoring views", () => {
    const frameworks: Array<{ label: string; framework: Framework }> = [
      { label: "NIST Low", framework: nistLowFrameworkProvider.getFramework() },
      {
        label: "NIST Moderate",
        framework: nistModerateFrameworkProvider.getFramework(),
      },
      { label: "NIST High", framework: nistHighFrameworkProvider.getFramework() },
      {
        label: "DoD IL4",
        framework: dodCloudIl4FrameworkProvider.getFramework(),
      },
    ];
    for (const { label, framework } of frameworks) {
      for (const control of framework.controls) {
        const authoring = renderAuthoringRequirement(control);
        assertNoRawInsert(
          authoring.text,
          `${label} ${control.id} authoring requirement`,
        );
        if (authoring.hasParamInserts) {
          assert.match(control.statement, /\{\{\s*insert:\s*param/);
        }
      }
    }
  });
});
