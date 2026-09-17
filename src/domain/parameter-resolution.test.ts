import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  FrameworkOrganizationDefinedParameter,
  FrameworkParameterResolution,
} from "@/data/framework/types";
import { resolveParameter } from "./parameter-resolution";

const catalog: FrameworkOrganizationDefinedParameter = {
  id: "ac-07_odp.01",
  label: "number",
  description: "the number",
  altIdentifiers: [],
  aggregatedParameterIds: [],
};

function framework(
  patch: Partial<FrameworkParameterResolution>,
): FrameworkParameterResolution {
  return {
    controlId: "ac-7",
    parameterId: "ac-07_odp.01",
    status: "csp-organization-defined",
    mappingBasis: "catalog-unassigned",
    values: [],
    sources: [],
    ...patch,
  };
}

describe("resolveParameter", () => {
  it("leaves catalog organization-defined unresolved without a project value", () => {
    const result = resolveParameter({
      controlId: "ac-7",
      parameterId: catalog.id,
      catalog,
      framework: framework({}),
    });
    assert.deepEqual(result.substitution, {
      kind: "unresolved",
      reason: "organization-defined",
    });
  });

  it("resolves a flexible project assignment for organization-defined ODPs", () => {
    const result = resolveParameter({
      controlId: "ac-7",
      parameterId: catalog.id,
      catalog,
      framework: framework({}),
      project: {
        controlId: "ac-7",
        parameterId: catalog.id,
        intent: "organization-defined",
        body: {
          form: "assignment",
          values: ["Immediately upon receipt of a validated termination event"],
        },
      },
    });
    assert.equal(result.substitution.kind, "value");
    if (result.substitution.kind === "value") {
      assert.equal(result.substitution.origin, "project");
      assert.equal(
        result.substitution.values[0],
        "Immediately upon receipt of a validated termination event",
      );
    }
  });

  it("keeps framework-authoritative values when a deviation is documented", () => {
    const result = resolveParameter({
      controlId: "ac-7",
      parameterId: catalog.id,
      catalog,
      framework: framework({
        status: "baseline-inherited",
        mappingBasis: "pinned-overlay-mapping",
        values: ["3"],
      }),
      project: {
        controlId: "ac-7",
        parameterId: catalog.id,
        intent: "documented-deviation",
        body: { form: "assignment", values: ["5"] },
      },
    });
    assert.equal(result.substitution.kind, "value");
    if (result.substitution.kind === "value") {
      assert.deepEqual(result.substitution.values, ["3"]);
      assert.equal(result.substitution.origin, "framework");
    }
    assert.equal(result.annotations[0]?.kind, "documented-deviation");
  });

  it("does not auto-accept may-use-baseline values", () => {
    const unresolved = resolveParameter({
      controlId: "au-5.1",
      parameterId: catalog.id,
      catalog,
      framework: framework({
        status: "may-use-baseline",
        mappingBasis: "pinned-overlay-mapping",
        values: ["within 24 hours"],
      }),
    });
    assert.deepEqual(unresolved.substitution, {
      kind: "unresolved",
      reason: "may-use-baseline",
    });
    const accepted = resolveParameter({
      controlId: "au-5.1",
      parameterId: catalog.id,
      catalog,
      framework: framework({
        status: "may-use-baseline",
        mappingBasis: "pinned-overlay-mapping",
        values: ["within 24 hours"],
      }),
      project: {
        controlId: "au-5.1",
        parameterId: catalog.id,
        intent: "accept-permitted-baseline",
      },
    });
    assert.equal(accepted.substitution.kind, "value");
    if (accepted.substitution.kind === "value") {
      assert.equal(accepted.substitution.origin, "accepted-baseline");
      assert.deepEqual(accepted.substitution.values, ["within 24 hours"]);
    }
  });

  it("keeps DSPAV assertions and conflict proceedings as annotations", () => {
    const dspav = resolveParameter({
      controlId: "ac-7",
      parameterId: catalog.id,
      catalog,
      framework: framework({
        status: "authoritative-value-required",
        mappingBasis: "pinned-overlay-mapping",
      }),
      project: {
        controlId: "ac-7",
        parameterId: catalog.id,
        intent: "dspav-assertion",
        body: { form: "assignment", values: ["3"] },
        dspavSourceNote: "Restricted DSPAV",
      },
    });
    assert.deepEqual(dspav.substitution, {
      kind: "unresolved",
      reason: "authoritative-value-required",
    });
    assert.equal(dspav.annotations[0]?.kind, "dspav-assertion");

    const conflict = resolveParameter({
      controlId: "ia-5.1",
      parameterId: catalog.id,
      catalog,
      framework: framework({
        status: "source-conflict",
        mappingBasis: "pinned-overlay-mapping",
      }),
      project: {
        controlId: "ia-5.1",
        parameterId: catalog.id,
        intent: "conflict-proceeding",
        notes: "Organization followed FedRAMP additional guidance.",
      },
    });
    assert.deepEqual(conflict.substitution, {
      kind: "unresolved",
      reason: "source-conflict",
    });
    assert.equal(conflict.annotations[0]?.kind, "conflict-proceeding");
  });

  it("does not substitute IL4 control-level overlay prose into inserts", () => {
    const result = resolveParameter({
      controlId: "ac-7",
      parameterId: catalog.id,
      catalog,
      framework: framework({
        status: "authoritative-value-required",
        mappingBasis: "control-level-unmapped",
        controlOverlaySummary: {
          status: "authoritative-value-required",
          effectiveAssignmentText: "three unsuccessful attempts",
          effectiveAssignmentSource: "dod-ssp-addendum-v1.2",
        },
      }),
      project: {
        controlId: "ac-7",
        parameterId: catalog.id,
        intent: "organization-defined",
        body: { form: "assignment", values: ["5"] },
      },
    });
    assert.equal(result.substitution.kind, "unresolved");
    if (result.substitution.kind === "unresolved") {
      assert.equal(result.substitution.reason, "authoritative-value-required");
    }
    assert.ok(
      result.annotations.some((annotation) => annotation.kind === "control-overlay-unmapped"),
    );
    assert.ok(
      result.annotations.some((annotation) => annotation.kind === "project-documentation"),
    );
  });

  it("maps catalog selection keys to choice text rather than guessing a datatype", () => {
    const selectCatalog: FrameworkOrganizationDefinedParameter = {
      ...catalog,
      id: "ac-01_odp.03",
      label: "",
      select: {
        howMany: "one-or-more",
        choices: [
          { key: "0", text: "organization-level", nestedParameterIds: [] },
          { key: "2", text: "system-level", nestedParameterIds: [] },
        ],
      },
    };
    const result = resolveParameter({
      controlId: "ac-1",
      parameterId: selectCatalog.id,
      catalog: selectCatalog,
      framework: framework({
        controlId: "ac-1",
        parameterId: selectCatalog.id,
      }),
      project: {
        controlId: "ac-1",
        parameterId: selectCatalog.id,
        intent: "organization-defined",
        body: {
          form: "selection",
          howMany: "one-or-more",
          selectedChoiceKeys: ["0", "2"],
        },
      },
    });
    assert.equal(result.substitution.kind, "value");
    if (result.substitution.kind === "value") {
      assert.deepEqual(result.substitution.values, [
        "organization-level",
        "system-level",
      ]);
    }
  });

  it("substitutes overlay-explicit values only when mapped to the parameter", () => {
    const result = resolveParameter({
      controlId: "sc-24",
      parameterId: catalog.id,
      catalog,
      framework: framework({
        status: "overlay-explicit",
        mappingBasis: "pinned-overlay-mapping",
        values: ["known secure state"],
      }),
    });
    assert.equal(result.substitution.kind, "value");
    if (result.substitution.kind === "value") {
      assert.equal(result.substitution.origin, "framework");
      assert.deepEqual(result.substitution.values, ["known secure state"]);
    }
  });

  it("preserves orphan project records without synthesizing them", () => {
    const result = resolveParameter({
      controlId: "ac-7",
      parameterId: "gone",
      project: {
        controlId: "ac-7",
        parameterId: "gone",
        intent: "organization-defined",
        body: { form: "assignment", values: ["kept"] },
      },
    });
    assert.deepEqual(result.substitution, {
      kind: "unresolved",
      reason: "orphan",
    });
    assert.equal(result.annotations[0]?.kind, "orphan");
  });
});
