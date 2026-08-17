import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildControlEvidenceCoverage,
  deriveControlCoverageState,
  summarizeProjectEvidenceCoverage,
} from "./coverage";
import { isEvidenceMissing } from "./defaults";
import type { LinkedEvidenceFacts } from "./coverage";

describe("evidence coverage derivation", () => {
  it("maps requirement and active presence to coverage states", () => {
    assert.equal(deriveControlCoverageState("not_required", 0), "not_required");
    assert.equal(deriveControlCoverageState("not_required", 5), "not_required");
    assert.equal(deriveControlCoverageState("optional", 0), "optional_absent");
    assert.equal(deriveControlCoverageState("optional", 1), "optional_present");
    assert.equal(deriveControlCoverageState("required", 0), "required_missing");
    assert.equal(deriveControlCoverageState("required", 2), "required_present");
  });

  it("does not treat draft or archived Evidence as present", () => {
    const linked: LinkedEvidenceFacts[] = [
      {
        status: "draft",
        hasCurrentVersion: true,
        freshness: "current",
      },
      {
        status: "archived",
        hasCurrentVersion: true,
        freshness: "overdue",
      },
    ];
    const coverage = buildControlEvidenceCoverage({
      projectId: "p1",
      controlId: "ac-2",
      evidenceRequirement: "required",
      linked,
    });
    assert.equal(coverage.coverageState, "required_missing");
    assert.equal(coverage.activeEvidenceCount, 0);
    assert.equal(coverage.draftEvidenceCount, 1);
    assert.equal(coverage.dueSoonCount, 0);
    assert.equal(coverage.overdueCount, 0);
    assert.equal(isEvidenceMissing("required", coverage.activeEvidenceCount), true);
  });

  it("counts active metadata-only Evidence as present", () => {
    const coverage = buildControlEvidenceCoverage({
      projectId: "p1",
      controlId: "ac-2",
      evidenceRequirement: "required",
      linked: [
        {
          status: "active",
          hasCurrentVersion: false,
          freshness: "no_review_date",
        },
      ],
    });
    assert.equal(coverage.coverageState, "required_present");
    assert.equal(coverage.activeEvidenceCount, 1);
    assert.equal(coverage.evidenceWithCurrentVersionCount, 0);
    assert.equal(coverage.evidenceWithoutCurrentVersionCount, 1);
  });

  it("counts active Evidence with a current Version", () => {
    const coverage = buildControlEvidenceCoverage({
      projectId: "p1",
      controlId: "ac-3",
      evidenceRequirement: "required",
      linked: [
        {
          status: "active",
          hasCurrentVersion: true,
          freshness: "due_soon",
        },
        {
          status: "active",
          hasCurrentVersion: true,
          freshness: "overdue",
        },
      ],
    });
    assert.equal(coverage.coverageState, "required_present");
    assert.equal(coverage.activeEvidenceCount, 2);
    assert.equal(coverage.evidenceWithCurrentVersionCount, 2);
    assert.equal(coverage.dueSoonCount, 1);
    assert.equal(coverage.overdueCount, 1);
  });

  it("keeps optional absent distinct from not required", () => {
    const optional = buildControlEvidenceCoverage({
      projectId: "p1",
      controlId: "ac-4",
      evidenceRequirement: "optional",
      linked: [],
    });
    const notRequired = buildControlEvidenceCoverage({
      projectId: "p1",
      controlId: "ac-5",
      evidenceRequirement: "not_required",
      linked: [],
    });
    assert.equal(optional.coverageState, "optional_absent");
    assert.equal(notRequired.coverageState, "not_required");
  });

  it("summarizes required / optional / not-required controls without a percentage", () => {
    const controls = [
      buildControlEvidenceCoverage({
        projectId: "p1",
        controlId: "ac-1",
        evidenceRequirement: "required",
        linked: [],
      }),
      buildControlEvidenceCoverage({
        projectId: "p1",
        controlId: "ac-2",
        evidenceRequirement: "required",
        linked: [
          {
            status: "active",
            hasCurrentVersion: true,
            freshness: "current",
          },
        ],
      }),
      buildControlEvidenceCoverage({
        projectId: "p1",
        controlId: "ac-3",
        evidenceRequirement: "optional",
        linked: [],
      }),
      buildControlEvidenceCoverage({
        projectId: "p1",
        controlId: "ac-4",
        evidenceRequirement: "not_required",
        linked: [],
      }),
    ];
    const summary = summarizeProjectEvidenceCoverage({
      asOfDate: "2026-06-01",
      controls,
      dueSoonEvidence: 2,
      overdueEvidence: 1,
      unlinkedEvidence: 3,
      archivedEvidence: 4,
      draftEvidence: 5,
    });
    assert.equal(summary.totalControls, 4);
    assert.equal(summary.requiredControls, 2);
    assert.equal(summary.requiredWithEvidence, 1);
    assert.equal(summary.requiredMissingEvidence, 1);
    assert.equal(summary.optionalControls, 1);
    assert.equal(summary.notRequiredControls, 1);
    assert.equal(summary.dueSoonEvidence, 2);
    assert.equal(summary.draftEvidence, 5);
    assert.equal(
      Object.prototype.hasOwnProperty.call(summary, "percent"),
      false,
    );
  });
});
