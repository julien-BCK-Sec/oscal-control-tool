import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cmmcLevel2FrameworkProvider,
  dodCloudIl4FrameworkProvider,
  nistModerateFrameworkProvider,
} from "@/data/framework";
import {
  catalogChoiceVisibleText,
  parameterEditorMode,
  parameterInsertContext,
  parameterPrompt,
  visibleAuthoringParameters,
  withCatalogSelection,
} from "./parameter-authoring";
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
