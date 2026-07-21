import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FrameworkControl } from "@/data/framework";
import type { ControlImplementation } from "@/data/implementation";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import {
  computeFamilyCompletion,
  computeOverallCompletion,
  firstIncompleteControlId,
  isImplementationComplete,
  lowestCompletionFamily,
} from "@/domain/completion";
import {
  analyzeImplementationCoverage,
  buildDomainValidationChecks,
  isDomainProjectValid,
  oscalValidationCheck,
} from "@/domain/projectValidation";

function control(
  partial: Pick<FrameworkControl, "id" | "title" | "family">,
): FrameworkControl {
  return {
    ...partial,
    statement: "statement",
    source: "test",
    sourceVersion: "1",
  };
}

function impl(narrative: string): ControlImplementation {
  return { status: "implemented", narrative };
}

describe("completion helpers", () => {
  const controls = [
    control({ id: "ac-1", title: "Policy", family: "Access Control" }),
    control({ id: "ac-2", title: "Accounts", family: "Access Control" }),
    control({ id: "au-2", title: "Logging", family: "Audit and Accountability" }),
  ];

  it("treats non-empty narrative as complete", () => {
    assert.equal(isImplementationComplete(impl("Done")), true);
    assert.equal(isImplementationComplete(impl("  ")), false);
    assert.equal(isImplementationComplete(impl("")), false);
    assert.equal(isImplementationComplete(undefined), false);
  });

  it("derives overall completion from framework controls and implementations", () => {
    const progress = computeOverallCompletion(controls, {
      "ac-1": impl("yes"),
      "ac-2": impl(""),
    });
    assert.equal(progress.total, 3);
    assert.equal(progress.completed, 1);
    assert.equal(progress.percent, 33);
  });

  it("derives the total from FrameworkProvider rather than a hardcoded constant", () => {
    const progress = computeOverallCompletion(FRAMEWORK_CONTROLS, {});
    assert.equal(progress.total, FRAMEWORK_CONTROLS.length);
    assert.ok(progress.total > 0);
    // Empty implementations → zero completed, regardless of baseline size.
    assert.equal(progress.completed, 0);
  });

  it("computes family counts matching framework order and data", () => {
    const families = computeFamilyCompletion(controls, {
      "ac-1": impl("yes"),
      "au-2": impl("yes"),
    });
    assert.deepEqual(
      families.map((family) => family.family),
      ["Access Control", "Audit and Accountability"],
    );
    assert.equal(families[0].completed, 1);
    assert.equal(families[0].total, 2);
    assert.equal(families[0].abbreviation, "AC");
    assert.equal(families[1].completed, 1);
    assert.equal(families[1].total, 1);
  });

  it("reflects incomplete implementations", () => {
    const families = computeFamilyCompletion(controls, {
      "ac-1": impl("yes"),
    });
    assert.equal(families[0].firstIncompleteControlId, "ac-2");
    assert.equal(firstIncompleteControlId(controls, { "ac-1": impl("yes") }), "ac-2");
    assert.equal(
      lowestCompletionFamily(families)?.family,
      "Audit and Accountability",
    );
  });

  it("reports full CGDS-style baseline coverage when all narratives exist", () => {
    const implementations: Record<string, ControlImplementation> = {};
    for (const frameworkControl of FRAMEWORK_CONTROLS) {
      implementations[frameworkControl.id] = impl(
        `Narrative for ${frameworkControl.id}`,
      );
    }
    const progress = computeOverallCompletion(
      FRAMEWORK_CONTROLS,
      implementations,
    );
    assert.equal(progress.completed, progress.total);
    assert.equal(progress.percent, 100);
    assert.equal(progress.total, FRAMEWORK_CONTROLS.length);
  });
});

describe("validation helpers", () => {
  const controls = [
    control({ id: "ac-1", title: "Policy", family: "Access Control" }),
    control({ id: "ac-2", title: "Accounts", family: "Access Control" }),
  ];

  it("distinguishes passed and failed domain checks", () => {
    const checks = buildDomainValidationChecks({
      frameworkControls: controls,
      metadata: {
        systemName: "Sys",
        organizationName: "Org",
        systemDescription: "Desc",
      },
      implementations: {
        "ac-1": impl("done"),
        "ac-2": impl(""),
        "xx-9": impl("unknown"),
      },
    });

    const byId = Object.fromEntries(checks.map((check) => [check.id, check]));
    assert.equal(byId["baseline-coverage"]?.status, "fail");
    assert.equal(byId["missing-implementations"]?.status, "fail");
    assert.equal(byId["unknown-control-ids"]?.status, "fail");
    assert.equal(byId["duplicate-control-ids"]?.status, "pass");
    assert.equal(byId["domain-project-valid"]?.status, "pass");
    assert.ok(byId["missing-implementations"]?.controlIds?.includes("ac-2"));
  });

  it("detects unknown identifiers via coverage analysis", () => {
    const coverage = analyzeImplementationCoverage(controls, {
      "ac-1": impl("a"),
      "zz-1": impl("b"),
    });
    assert.deepEqual(coverage.unknownIds, ["zz-1"]);
    assert.deepEqual(coverage.missingIds, ["ac-2"]);
  });

  it("does not claim OSCAL validity until validation has run", () => {
    assert.equal(oscalValidationCheck({ status: "idle" }), null);
    assert.equal(oscalValidationCheck({ status: "running" }), null);
    const passed = oscalValidationCheck({
      status: "complete",
      ok: true,
      detail: "OSCAL SSP valid",
      checkedAt: "2026-07-21T12:00:00.000Z",
    });
    assert.equal(passed?.status, "pass");
    assert.equal(passed?.id, "oscal-ssp-valid");
    const failed = oscalValidationCheck({
      status: "complete",
      ok: false,
      detail: "Schema mismatch",
      checkedAt: "2026-07-21T12:00:00.000Z",
    });
    assert.equal(failed?.status, "fail");
  });

  it("rejects invalid domain projects", () => {
    assert.equal(
      isDomainProjectValid({
        metadata: { systemName: "x" },
        implementations: {},
      }),
      false,
    );
    assert.equal(
      isDomainProjectValid({
        metadata: {
          systemName: "Sys",
          organizationName: "Org",
          systemDescription: "Desc",
        },
        implementations: { "ac-1": { status: "implemented", narrative: "ok" } },
      }),
      true,
    );
  });
});
