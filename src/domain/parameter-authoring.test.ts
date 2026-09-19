import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cmmcLevel2FrameworkProvider,
  dodCloudIl4FrameworkProvider,
  nistModerateFrameworkProvider,
} from "@/data/framework";
import {
  authorFacingStatusHint,
  authorFacingStatusLabel,
  catalogChoiceVisibleText,
  parameterAuthoringSummary,
  parameterDetailsDefaultOpen,
  parameterEditorMode,
  parameterInsertContext,
  parameterOdpSectionDefaultOpen,
  parameterPrompt,
  parameterUsesCompactResolvedPresentation,
  sharedAuthorableEditorMode,
  sharedParameterSectionNotice,
  visibleAuthoringParameters,
  withCatalogSelection,
} from "./parameter-authoring";
import { resolveControlParameters } from "./parameter-resolution";
import { resolveParameter } from "./parameter-resolution";

describe("visibleAuthoringParameters", () => {
  it("hides aggregate grouping parameters and shows child ODPs", () => {
    const ac1 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-1");
    assert.ok(ac1);
    const visible = visibleAuthoringParameters(ac1);
    assert.equal(
      visible.some((param) => param.id === "ac-1_prm_1"),
      false,
    );
    assert.ok(visible.some((param) => param.id === "ac-01_odp.01"));
    assert.ok(visible.some((param) => param.id === "ac-01_odp.03"));
  });

  it("does not invent ODP editors for CMMC or GRRs", () => {
    const cmmc = cmmcLevel2FrameworkProvider.getFramework().controls[0];
    assert.ok(cmmc);
    assert.deepEqual(visibleAuthoringParameters(cmmc), []);
    const grr = dodCloudIl4FrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "grr-1");
    assert.ok(grr);
    assert.deepEqual(visibleAuthoringParameters(grr), []);
  });
});

describe("parameterEditorMode", () => {
  it("uses catalog select UI rather than guessed datatypes", () => {
    const ac1 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-1");
    assert.ok(ac1);
    const param = ac1.parameters?.organizationDefined?.find(
      (entry) => entry.id === "ac-01_odp.03",
    );
    assert.ok(param?.select);
    const effective = resolveParameter({
      controlId: "ac-1",
      parameterId: param.id,
      catalog: param,
    });
    assert.equal(parameterEditorMode(effective), "selection");
    assert.equal(parameterPrompt(param), "one or more catalog choices");
  });

  it("keeps framework-authoritative values read-only", () => {
    const param = {
      id: "ac-07_odp.01",
      label: "number",
      description: "",
      altIdentifiers: [],
      aggregatedParameterIds: [],
    };
    const effective = resolveParameter({
      controlId: "ac-7",
      parameterId: param.id,
      catalog: param,
      framework: {
        controlId: "ac-7",
        parameterId: param.id,
        status: "baseline-inherited",
        mappingBasis: "pinned-overlay-mapping",
        values: ["3"],
        sources: [],
      },
    });
    assert.equal(parameterEditorMode(effective), "framework-authoritative");
  });
});

describe("nested catalog choice presentation", () => {
  it("does not present nested inserts as user-facing [nested parameter] copy", () => {
    const ac7 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-7");
    assert.ok(ac7);
    const parent = ac7.parameters?.organizationDefined?.find(
      (param) => param.id === "ac-07_odp.03",
    );
    assert.ok(parent?.select);
    const delay = parent.select.choices.find((choice) => choice.key === "2");
    assert.ok(delay);
    const visible = catalogChoiceVisibleText(delay);
    assert.equal(visible.includes("[nested parameter]"), false);
    assert.match(visible, /delay next logon prompt per:/i);
  });

  it("keeps nested project records when the parent choice is deselected", () => {
    const ac7 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-7");
    assert.ok(ac7);
    const parent = ac7.parameters?.organizationDefined?.find(
      (param) => param.id === "ac-07_odp.03",
    );
    assert.ok(parent);
    const records = withCatalogSelection(
      {
        "ac-07_odp.05": {
          controlId: "ac-7",
          parameterId: "ac-07_odp.05",
          intent: "organization-defined",
          body: { form: "assignment", values: ["exponential backoff"] },
        },
      },
      "ac-7",
      parent,
      ["2"],
    );
    const cleared = withCatalogSelection(records, "ac-7", parent, []);
    assert.equal(cleared["ac-07_odp.03"], undefined);
    assert.equal(
      cleared["ac-07_odp.05"]?.body?.form === "assignment"
        ? cleared["ac-07_odp.05"].body.values[0]
        : undefined,
      "exponential backoff",
    );
  });

  it("shows surrounding requirement context for a narrow insert", () => {
    const ac7 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-7");
    assert.ok(ac7);
    const number = ac7.parameters?.organizationDefined?.find(
      (param) => param.id === "ac-07_odp.01",
    );
    assert.ok(number);
    const context = parameterInsertContext(ac7, number);
    assert.ok(context);
    assert.match(context, /\[number\]/);
    assert.match(context, /consecutive invalid logon attempts/i);
  });
});

describe("parameterAuthoringSummary", () => {
  it("counts a simple unresolved control without inventing parameters", () => {
    const ac2 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-2.1");
    assert.ok(ac2);
    const resolved = resolveControlParameters(ac2, {});
    const summary = parameterAuthoringSummary(ac2, resolved, {});
    assert.ok(summary.total >= 1);
    assert.equal(summary.resolvedCount, 0);
    assert.equal(summary.unresolvedCount, summary.total);
    assert.equal(
      summary.caption,
      `${summary.resolvedCount} of ${summary.total} resolved · ${summary.unresolvedCount} need attention`,
    );
  });

  it("counts AC-7 nested parameters only after the parent choice is selected", () => {
    const ac7 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-7");
    assert.ok(ac7);
    const unresolved = parameterAuthoringSummary(
      ac7,
      resolveControlParameters(ac7, {}),
      {},
    );
    assert.equal(unresolved.total, 3);
    assert.equal(unresolved.resolvedCount, 0);

    const records = withCatalogSelection(
      {
        "ac-07_odp.01": {
          controlId: "ac-7",
          parameterId: "ac-07_odp.01",
          intent: "organization-defined",
          body: { form: "assignment", values: ["5"] },
        },
        "ac-07_odp.02": {
          controlId: "ac-7",
          parameterId: "ac-07_odp.02",
          intent: "organization-defined",
          body: { form: "assignment", values: ["15 minutes"] },
        },
      },
      "ac-7",
      ac7.parameters?.organizationDefined?.find((param) => param.id === "ac-07_odp.03") ??
        ac7.parameters!.organizationDefined![2],
      ["2"],
    );
    const partial = parameterAuthoringSummary(
      ac7,
      resolveControlParameters(ac7, records),
      records,
    );
    assert.equal(partial.total, 4);
    assert.equal(partial.resolvedCount, 3);
    assert.equal(partial.unresolvedCount, 1);

    const fully = withCatalogSelection(
      {
        ...records,
        "ac-07_odp.05": {
          controlId: "ac-7",
          parameterId: "ac-07_odp.05",
          intent: "organization-defined",
          body: { form: "assignment", values: ["exponential backoff"] },
        },
      },
      "ac-7",
      ac7.parameters?.organizationDefined?.find((param) => param.id === "ac-07_odp.03") ??
        ac7.parameters!.organizationDefined![2],
      ["2"],
    );
    const done = parameterAuthoringSummary(
      ac7,
      resolveControlParameters(ac7, fully),
      fully,
    );
    assert.equal(done.resolvedCount, 4);
    assert.equal(done.unresolvedCount, 0);
    assert.equal(done.caption, "4 of 4 resolved");
  });

  it("summarizes AC-1 as ODP-heavy without treating empty records as resolved", () => {
    const ac1 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-1");
    assert.ok(ac1);
    const summary = parameterAuthoringSummary(
      ac1,
      resolveControlParameters(ac1, {}),
      {},
    );
    assert.ok(summary.total >= 8);
    assert.equal(summary.resolvedCount, 0);
    assert.equal(summary.unresolvedCount, summary.total);
  });

  it("reports no authorable parameters for a catalog item without ODPs", () => {
    const control = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((item) => visibleAuthoringParameters(item).length === 0);
    assert.ok(control);
    const summary = parameterAuthoringSummary(
      control,
      resolveControlParameters(control, {}),
      {},
    );
    assert.equal(summary.total, 0);
    assert.equal(summary.caption, "None on this item");
  });

  it("does not treat IL4 DSPAV assertions as resolved", () => {
    const ma51 = dodCloudIl4FrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ma-5.1");
    assert.ok(ma51);
    const records = {
      "ma-05.01_odp": {
        controlId: "ma-5.1",
        parameterId: "ma-05.01_odp",
        intent: "dspav-assertion" as const,
        body: { form: "assignment" as const, values: ["escort-only"] },
        dspavSourceNote: "Restricted DSPAV",
      },
    };
    const summary = parameterAuthoringSummary(
      ma51,
      resolveControlParameters(ma51, records),
      records,
    );
    assert.ok(summary.total >= 1);
    assert.equal(summary.resolvedCount, 0);
  });
});

describe("parameterUsesCompactResolvedPresentation", () => {
  it("compacts resolved assignment rows but never selection or fail-closed rows", () => {
    assert.equal(
      parameterUsesCompactResolvedPresentation({
        substitutionKind: "value",
        nested: false,
        failClosed: false,
        mode: "assignment",
      }),
      true,
    );
    assert.equal(
      parameterUsesCompactResolvedPresentation({
        substitutionKind: "value",
        nested: false,
        failClosed: false,
        mode: "selection",
      }),
      false,
    );
    assert.equal(
      parameterUsesCompactResolvedPresentation({
        substitutionKind: "value",
        nested: true,
        failClosed: false,
        mode: "assignment",
      }),
      false,
    );
    assert.equal(
      parameterUsesCompactResolvedPresentation({
        substitutionKind: "value",
        nested: false,
        failClosed: true,
        mode: "authoritative-value-required",
      }),
      false,
    );
    assert.equal(
      parameterUsesCompactResolvedPresentation({
        substitutionKind: "unresolved",
        nested: false,
        failClosed: false,
        mode: "assignment",
      }),
      false,
    );
  });
});

describe("ODP section presentation rules", () => {
  it("does not open the ODP section because parameters are unresolved", () => {
    const ac1 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-1");
    assert.ok(ac1);
    const summary = parameterAuthoringSummary(
      ac1,
      resolveControlParameters(ac1, {}),
      {},
    );
    assert.ok(summary.unresolvedCount >= 8);
    assert.equal(parameterOdpSectionDefaultOpen(summary), false);
    assert.equal(parameterDetailsDefaultOpen(), false);
  });

  it("groups IL4 AC-1 unmapped overlay context at section scope", () => {
    const ac1 = dodCloudIl4FrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-1");
    assert.ok(ac1);
    const resolved = resolveControlParameters(ac1, {});
    const shared = sharedAuthorableEditorMode(ac1, resolved, {});
    assert.equal(shared, "control-level-unmapped");
    const notice = sharedParameterSectionNotice(shared);
    assert.ok(notice);
    assert.match(notice.title, /parameter-specific overlay assignments unavailable/i);
    assert.match(notice.body, /does not map/i);
    assert.equal(
      authorFacingStatusHint("control-level-unmapped", shared),
      null,
    );
  });

  it("does not attach IL4 overlay context to NIST Moderate AC-1", () => {
    const ac1 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-1");
    assert.ok(ac1);
    const resolved = resolveControlParameters(ac1, {});
    const shared = sharedAuthorableEditorMode(ac1, resolved, {});
    assert.notEqual(shared, "control-level-unmapped");
    assert.equal(sharedParameterSectionNotice(shared), null);
  });

  it("does not group mixed AC-7 assignment and selection states", () => {
    const ac7 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-7");
    assert.ok(ac7);
    const resolved = resolveControlParameters(ac7, {});
    assert.equal(sharedAuthorableEditorMode(ac7, resolved, {}), null);
    assert.equal(sharedParameterSectionNotice(null), null);
  });

  it("keeps DSPAV author-facing status unresolved and distinct from unmapped overlay", () => {
    const ma51 = dodCloudIl4FrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ma-5.1");
    assert.ok(ma51);
    const records = {
      "ma-05.01_odp": {
        controlId: "ma-5.1",
        parameterId: "ma-05.01_odp",
        intent: "dspav-assertion" as const,
        body: { form: "assignment" as const, values: ["escort-only"] },
        dspavSourceNote: "Restricted DSPAV",
      },
    };
    const resolved = resolveControlParameters(ma51, records);
    const target = resolved.find((row) => row.parameterId === "ma-05.01_odp");
    assert.ok(target);
    assert.equal(target.substitution.kind, "unresolved");
    assert.equal(authorFacingStatusLabel(target), "Unresolved");
    assert.equal(parameterEditorMode(target), "authoritative-value-required");
    const shared = sharedAuthorableEditorMode(ma51, resolved, records);
    if (shared === "authoritative-value-required") {
      const notice = sharedParameterSectionNotice(shared);
      assert.ok(notice);
      assert.notEqual(notice.mode, "control-level-unmapped");
    }
  });
});
