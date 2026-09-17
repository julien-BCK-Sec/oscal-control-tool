import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cmmcLevel2FrameworkProvider,
  dodCloudIl4FrameworkProvider,
  nistModerateFrameworkProvider,
} from "@/data/framework";
import {
  parameterEditorMode,
  parameterPrompt,
  visibleAuthoringParameters,
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
