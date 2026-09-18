import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dodCloudIl4FrameworkProvider,
  nistModerateFrameworkProvider,
} from "@/data/framework";
import type {
  FrameworkControl,
  FrameworkOrganizationDefinedParameter,
} from "@/data/framework/types";
import type {
  ProjectParameterRecord,
  ProjectParameterRecords,
} from "@/data/parameter";
import { resolveControlParameters } from "@/domain/parameter-resolution";
import { synthesizeControlStatement } from "./resolveStatement";

function assignment(
  controlId: string,
  parameterId: string,
  value: string,
): ProjectParameterRecord {
  return {
    controlId,
    parameterId,
    intent: "organization-defined",
    body: { form: "assignment", values: [value] },
  };
}

function selection(
  controlId: string,
  parameterId: string,
  howMany: "one" | "one-or-more",
  keys: string[],
): ProjectParameterRecord {
  return {
    controlId,
    parameterId,
    intent: "organization-defined",
    body: { form: "selection", howMany, selectedChoiceKeys: keys },
  };
}

function param(
  patch: Partial<FrameworkOrganizationDefinedParameter> & { id: string },
): FrameworkOrganizationDefinedParameter {
  return {
    label: "",
    description: "",
    altIdentifiers: [],
    aggregatedParameterIds: [],
    ...patch,
  };
}

function syntheticControl(
  statement: string,
  organizationDefined: FrameworkOrganizationDefinedParameter[],
): FrameworkControl {
  return {
    id: "x-1",
    title: "Example",
    family: "Example",
    statement,
    source: "test",
    sourceVersion: "1",
    parameters: {
      organizationDefined,
      parameterResolutions: organizationDefined.map((entry) => ({
        controlId: "x-1",
        parameterId: entry.id,
        status: "csp-organization-defined" as const,
        mappingBasis: "catalog-unassigned" as const,
        values: [],
        sources: [],
      })),
    },
  };
}

function synthesize(
  control: FrameworkControl,
  records: ProjectParameterRecords = {},
) {
  return synthesizeControlStatement(
    control,
    resolveControlParameters(control, records),
  );
}

function unresolvedIds(result: ReturnType<typeof synthesize>): string[] {
  return result.unresolvedParameters.map((row) => row.id);
}

describe("synthesizeControlStatement unresolved reporting", () => {
  it("omits a simple resolved parameter from unresolved reporting", () => {
    const control = syntheticControl("Do {{ insert: param, x-1_odp.01 }}.", [
      param({ id: "x-1_odp.01", label: "action" }),
    ]);
    const result = synthesize(control, {
      "x-1_odp.01": assignment("x-1", "x-1_odp.01", "notify"),
    });
    assert.match(result.resolvedStatement, /Do notify\./);
    assert.deepEqual(unresolvedIds(result), []);
    assert.equal(
      result.parameterResolutions.find((row) => row.id === "x-1_odp.01")?.state,
      "project-resolved",
    );
  });

  it("reports a simple unresolved parameter", () => {
    const control = syntheticControl("Do {{ insert: param, x-1_odp.01 }}.", [
      param({ id: "x-1_odp.01", label: "action" }),
    ]);
    const result = synthesize(control);
    assert.match(
      result.resolvedStatement,
      /\[Unresolved ODP: x-1_odp\.01 — action\]/,
    );
    assert.deepEqual(unresolvedIds(result), ["x-1_odp.01"]);
  });

  it("reports a partially resolved AC-7-style control from the same walk", () => {
    const ac7 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-7");
    assert.ok(ac7);
    const result = synthesize(ac7, {
      "ac-07_odp.01": assignment("ac-7", "ac-07_odp.01", "5"),
      "ac-07_odp.02": assignment("ac-7", "ac-07_odp.02", "15 minutes"),
      "ac-07_odp.03": selection("ac-7", "ac-07_odp.03", "one-or-more", ["2"]),
    });
    assert.match(result.resolvedStatement, /limit of 5 consecutive invalid logon/);
    assert.match(result.resolvedStatement, /during a 15 minutes/);
    assert.match(result.resolvedStatement, /delay next logon prompt per/);
    assert.match(
      result.resolvedStatement,
      /\[Unresolved ODP: ac-07_odp\.05 — delay algorithm\]/,
    );
    assert.doesNotMatch(ac7.statement, /15 minutes/);
    assert.deepEqual(unresolvedIds(result), ["ac-07_odp.05"]);
    assert.equal(
      result.parameterResolutions.find((row) => row.id === "ac-07_odp.01")?.state,
      "project-resolved",
    );
    assert.equal(
      result.parameterResolutions.find((row) => row.id === "ac-07_odp.03")?.state,
      "project-resolved",
    );
  });

  it("reports an unresolved nested parameter for a selected choice", () => {
    const control = syntheticControl(
      "Automatically {{ insert: param, x-1_odp.parent }}.",
      [
        param({
          id: "x-1_odp.parent",
          select: {
            howMany: "one",
            choices: [
              {
                key: "0",
                text: "delay next logon prompt per {{ insert: param, x-1_odp.nested }}",
                nestedParameterIds: ["x-1_odp.nested"],
              },
            ],
          },
        }),
        param({ id: "x-1_odp.nested", label: "delay algorithm" }),
      ],
    );
    const result = synthesize(control, {
      "x-1_odp.parent": selection("x-1", "x-1_odp.parent", "one", ["0"]),
    });
    assert.match(result.resolvedStatement, /delay next logon prompt per/);
    assert.match(
      result.resolvedStatement,
      /\[Unresolved ODP: x-1_odp\.nested — delay algorithm\]/,
    );
    assert.deepEqual(unresolvedIds(result), ["x-1_odp.nested"]);
    assert.equal(
      unresolvedIds(result).includes("x-1_odp.parent"),
      false,
    );
  });

  it("omits a resolved nested parameter from unresolved reporting", () => {
    const control = syntheticControl(
      "Automatically {{ insert: param, x-1_odp.parent }}.",
      [
        param({
          id: "x-1_odp.parent",
          select: {
            howMany: "one",
            choices: [
              {
                key: "0",
                text: "delay next logon prompt per {{ insert: param, x-1_odp.nested }}",
                nestedParameterIds: ["x-1_odp.nested"],
              },
            ],
          },
        }),
        param({ id: "x-1_odp.nested", label: "delay algorithm" }),
      ],
    );
    const result = synthesize(control, {
      "x-1_odp.parent": selection("x-1", "x-1_odp.parent", "one", ["0"]),
      "x-1_odp.nested": assignment("x-1", "x-1_odp.nested", "exponential backoff"),
    });
    assert.match(result.resolvedStatement, /exponential backoff/);
    assert.deepEqual(unresolvedIds(result), []);
  });

  it("reports mixed nested resolution across multiple selected choices", () => {
    const control = syntheticControl(
      "Automatically {{ insert: param, x-1_odp.parent }}.",
      [
        param({
          id: "x-1_odp.parent",
          select: {
            howMany: "one-or-more",
            choices: [
              {
                key: "0",
                text: "lock the account or node for {{ insert: param, x-1_odp.lock }}",
                nestedParameterIds: ["x-1_odp.lock"],
              },
              {
                key: "1",
                text: "delay next logon prompt per {{ insert: param, x-1_odp.delay }}",
                nestedParameterIds: ["x-1_odp.delay"],
              },
            ],
          },
        }),
        param({ id: "x-1_odp.lock", label: "time period" }),
        param({ id: "x-1_odp.delay", label: "delay algorithm" }),
      ],
    );
    const result = synthesize(control, {
      "x-1_odp.parent": selection("x-1", "x-1_odp.parent", "one-or-more", [
        "0",
        "1",
      ]),
      "x-1_odp.lock": assignment("x-1", "x-1_odp.lock", "30 minutes"),
    });
    assert.match(result.resolvedStatement, /lock the account or node for 30 minutes/);
    assert.match(
      result.resolvedStatement,
      /\[Unresolved ODP: x-1_odp\.delay — delay algorithm\]/,
    );
    assert.deepEqual(unresolvedIds(result), ["x-1_odp.delay"]);
    assert.equal(unresolvedIds(result).includes("x-1_odp.lock"), false);
    assert.equal(unresolvedIds(result).includes("x-1_odp.parent"), false);
  });

  it("produces no false unresolved entries for a fully resolved control", () => {
    const ac7 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-7");
    assert.ok(ac7);
    const result = synthesize(ac7, {
      "ac-07_odp.01": assignment("ac-7", "ac-07_odp.01", "5"),
      "ac-07_odp.02": assignment("ac-7", "ac-07_odp.02", "15 minutes"),
      "ac-07_odp.03": selection("ac-7", "ac-07_odp.03", "one-or-more", ["1"]),
    });
    assert.match(
      result.resolvedStatement,
      /lock the account or node until released by an administrator/,
    );
    assert.doesNotMatch(result.resolvedStatement, /Unresolved ODP/);
    assert.deepEqual(unresolvedIds(result), []);
  });

  it("keeps a fully unresolved control fail-closed", () => {
    const ac7 = nistModerateFrameworkProvider
      .getFramework()
      .controls.find((control) => control.id === "ac-7");
    assert.ok(ac7);
    const result = synthesize(ac7);
    assert.match(result.resolvedStatement, /Unresolved ODP: ac-07_odp\.01/);
    assert.match(result.resolvedStatement, /Unresolved ODP: ac-07_odp\.02/);
    assert.match(result.resolvedStatement, /Unresolved ODP: ac-07_odp\.03/);
    assert.equal(unresolvedIds(result).includes("ac-07_odp.05"), false);
    assert.deepEqual(unresolvedIds(result), [
      "ac-07_odp.01",
      "ac-07_odp.02",
      "ac-07_odp.03",
    ]);
  });

  it("does not treat DSPAV assertions or conflict notes as substitution winners", () => {
    const il4 = dodCloudIl4FrameworkProvider.getFramework();
    const dspavControl = il4.controls.find((control) => control.id === "ma-5.1");
    assert.ok(dspavControl);
    const dspav = synthesize(dspavControl, {
      "ma-05.01_odp": {
        controlId: "ma-5.1",
        parameterId: "ma-05.01_odp",
        intent: "dspav-assertion",
        body: { form: "assignment", values: ["escort-only"] },
        dspavSourceNote: "Restricted DSPAV",
      },
    });
    assert.doesNotMatch(dspav.resolvedStatement, /escort-only/);
    assert.ok(dspav.unresolvedParameters.length > 0);
    assert.equal(
      dspav.parameterResolutions.every((row) => row.state === "unresolved"),
      true,
    );

    const conflictControl = il4.controls.find((control) => control.id === "ia-5.1");
    assert.ok(conflictControl);
    const conflict = synthesize(conflictControl, {
      "ia-05.01_odp.01": {
        controlId: "ia-5.1",
        parameterId: "ia-05.01_odp.01",
        intent: "conflict-proceeding",
        notes: "Proceeded using FedRAMP additional guidance.",
      },
    });
    assert.ok(
      conflict.parameterResolutions.some(
        (row) =>
          row.id === "ia-05.01_odp.01" &&
          row.state === "unresolved" &&
          row.unresolvedReason === "source-conflict",
      ),
    );
  });
});
