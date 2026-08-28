"use client";

import { useMemo, useState } from "react";
import type { Framework } from "@/data/framework";
import type { ControlImplementation } from "@/data/implementation";
import type { ProjectMetadata } from "@/data/project";
import {
  assembleProject,
  buildDomainValidationChecks,
  computeFamilyCompletion,
  computeOverallCompletion,
  firstIncompleteControlId,
  formatCompletionCount,
  lowestCompletionFamily,
  oscalValidationCheck,
  type OscalValidationState,
  type ValidationCheck,
} from "@/domain";
import {
  formatProjectRevisionLabel,
  formatSnapshotHistoryTitle,
  partitionSnapshotsForHistory,
} from "@/components/projectHistory/presentation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AbsoluteTimestamp } from "@/components/time/AbsoluteTimestamp";
import type { ControlsFocusRequest } from "@/components/workspace/presentation";
import { EvidenceOverviewCards } from "@/components/evidence/EvidenceOverviewCards";
import type { EvidenceAttentionFilter } from "@/components/workspace/presentation";
import type { ProjectEvidenceSummary } from "@/data/evidence";
import {
  projectToOscalSsp,
  validateOscalSspDocument,
} from "@/oscal";
import type { ProjectSnapshotSummary } from "@/persistence/types";
import {
  sentenceCase,
  oscalExportUnavailableCopy,
  type FrameworkItemTerms,
} from "@/components/framework/presentation";
import { formatControlIdDisplay } from "@/components/controlBrowser/presentation";
import { frameworkHasOscalSspExport } from "@/framework/nist-sp-800-53-rev5/identities";

export type ProjectOverviewProps = {
  framework: Framework;
  frameworkLabel: string;
  itemTerms?: FrameworkItemTerms;
  metadata: ProjectMetadata;
  implementations: Record<string, ControlImplementation>;
  revision: number;
  updatedAt: string;
  snapshots: ProjectSnapshotSummary[];
  evidenceSummary: ProjectEvidenceSummary | null;
  evidenceSummaryLoading?: boolean;
  onNavigate: (
    view: "controls" | "details" | "history",
    focus?: ControlsFocusRequest,
  ) => void;
  onNavigateEvidence: (attention: EvidenceAttentionFilter) => void;
};

export function ProjectOverview({
  framework,
  frameworkLabel,
  itemTerms = { singular: "control", plural: "controls" },
  metadata,
  implementations,
  revision,
  updatedAt,
  snapshots,
  evidenceSummary,
  evidenceSummaryLoading = false,
  onNavigate,
  onNavigateEvidence,
}: ProjectOverviewProps) {
  const overall = useMemo(
    () => computeOverallCompletion(framework.controls, implementations),
    [framework.controls, implementations],
  );
  const families = useMemo(
    () => computeFamilyCompletion(framework.controls, implementations),
    [framework.controls, implementations],
  );
  const domainChecks = useMemo(
    () =>
      buildDomainValidationChecks({
        frameworkControls: framework.controls,
        metadata,
        implementations,
      }),
    [framework.controls, metadata, implementations],
  );

  const [oscalState, setOscalState] = useState<OscalValidationState>({
    status: "idle",
  });

  const oscalAvailable = frameworkHasOscalSspExport(framework.id);
  const itemsLabel = sentenceCase(itemTerms.plural);
  const itemSingular = itemTerms.singular;

  const oscalCheck = oscalAvailable ? oscalValidationCheck(oscalState) : null;
  const checks: ValidationCheck[] = oscalCheck
    ? [...domainChecks, oscalCheck]
    : domainChecks;

  const firstIncomplete = firstIncompleteControlId(
    framework.controls,
    implementations,
  );
  const weakestFamily = lowestCompletionFamily(families);
  const allComplete = overall.completed === overall.total && overall.total > 0;

  const recentVersions = useMemo(() => {
    const { namedVersions, automaticSnapshots } =
      partitionSnapshotsForHistory(snapshots);
    const combined = [...namedVersions, ...automaticSnapshots].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
    return combined.slice(0, 5);
  }, [snapshots]);

  const descriptionPreview = metadata.systemDescription.trim();
  const abbreviatedDescription =
    descriptionPreview.length > 220
      ? `${descriptionPreview.slice(0, 217)}…`
      : descriptionPreview;

  async function runOscalValidation() {
    setOscalState({ status: "running" });
    try {
      const project = assembleProject({
        metadata,
        frameworkId: framework.id,
        frameworkControls: framework.controls,
        implementations,
      });
      const document = projectToOscalSsp(project);
      const result = validateOscalSspDocument(document);
      setOscalState({
        status: "complete",
        ok: result.ok,
        detail: result.ok
          ? "OSCAL SSP valid"
          : result.message.split("\n")[0] ?? "OSCAL SSP validation failed",
        checkedAt: new Date().toISOString(),
      });
    } catch (error) {
      setOscalState({
        status: "complete",
        ok: false,
        detail:
          error instanceof Error
            ? error.message
            : "OSCAL SSP validation failed",
        checkedAt: new Date().toISOString(),
      });
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Overview
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            {metadata.systemName.trim() || "Untitled system"}
          </h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-muted">Organization</dt>
              <dd className="text-text-secondary">
                {metadata.organizationName.trim() || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Framework</dt>
              <dd className="text-text-secondary">{frameworkLabel}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Revision</dt>
              <dd className="control-id text-text-secondary">
                {formatProjectRevisionLabel(revision)}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Last updated</dt>
              <dd className="text-text-secondary">
                <AbsoluteTimestamp value={updatedAt} />
              </dd>
            </div>
          </dl>

          <div className="mt-5 max-w-md">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                Implementation completion
              </p>
              <p className="text-sm text-text-secondary">
                {formatCompletionCount(overall)} · {overall.percent}%
              </p>
            </div>
            <ProgressBar
              className="mt-2"
              size="md"
              progress={overall}
              label="Overall implementation completion"
            />
          </div>
        </header>

        <EvidenceOverviewCards
          summary={evidenceSummary}
          loading={evidenceSummaryLoading}
          onSelectAttention={onNavigateEvidence}
          itemTerms={itemTerms}
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="family-progress-heading">
            <h3
              id="family-progress-heading"
              className="text-sm font-semibold text-foreground"
            >
              Family progress
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">
              Select a family to open {itemsLabel} with that family expanded.
            </p>
            <ul className="mt-3 divide-y divide-border border border-border bg-surface">
              {families.map((family) => (
                <li key={family.family}>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate("controls", {
                        family: family.family,
                        controlId:
                          family.firstIncompleteControlId ?? undefined,
                      })
                    }
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
                  >
                    <span
                      className="control-id w-8 shrink-0 text-xs text-text-muted"
                      aria-hidden="true"
                    >
                      {family.abbreviation}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">
                        {family.family}
                      </span>
                      <span className="mt-1 block">
                        <ProgressBar
                          progress={{
                            completed: family.completed,
                            total: family.total,
                            percent: family.percent,
                          }}
                          label={`${family.family} completion`}
                        />
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-text-secondary">
                      {family.completed}/{family.total}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-8">
            <section aria-labelledby="validation-heading">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3
                    id="validation-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Validation
                  </h3>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {oscalAvailable
                      ? "Domain checks update live. OSCAL schema validation runs on demand."
                      : `Domain checks update live. ${oscalExportUnavailableCopy(framework.id)}`}
                  </p>
                </div>
                {oscalAvailable ? (
                <button
                  type="button"
                  className="btn"
                  disabled={oscalState.status === "running"}
                  onClick={() => void runOscalValidation()}
                >
                  {oscalState.status === "running"
                    ? "Validating…"
                    : oscalState.status === "complete"
                      ? "Refresh validation"
                      : "Run OSCAL validation"}
                </button>
                ) : null}
              </div>
              <ul className="mt-3 space-y-2 border border-border bg-surface p-3">
                {checks.map((check) => (
                  <li key={check.id} className="text-sm">
                    <ValidationCheckRow
                      check={check}
                      itemPlural={itemTerms.plural}
                      onOpenIncomplete={
                        check.controlIds && check.controlIds.length > 0
                          ? () =>
                              onNavigate("controls", {
                                controlId: check.controlIds![0],
                              })
                          : undefined
                      }
                    />
                  </li>
                ))}
                {oscalAvailable && oscalState.status === "idle" ? (
                  <li className="text-xs text-text-muted">
                    OSCAL SSP validity has not been checked in this session.
                  </li>
                ) : null}
              </ul>
            </section>

            <section aria-labelledby="continue-heading">
              <h3
                id="continue-heading"
                className="text-sm font-semibold text-foreground"
              >
                Continue authoring
              </h3>
              {allComplete ? (
                <div className="mt-2 border border-border bg-surface p-3 text-sm text-text-secondary">
                  <p>All configured {itemTerms.plural} contain implementation text.</p>
                  <p className="mt-2">
                    {oscalAvailable ? (
                      <>
                    <button
                      type="button"
                      className="text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      onClick={() => void runOscalValidation()}
                    >
                      Review or validate the project
                    </button>
                    {" · "}
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      onClick={() => onNavigate("controls")}
                    >
                      Open {itemsLabel}
                    </button>
                  </p>
                </div>
              ) : (
                <ul className="mt-2 space-y-2 border border-border bg-surface p-3 text-sm">
                  {firstIncomplete ? (
                    <li>
                      <button
                        type="button"
                        className="text-left text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        onClick={() =>
                          onNavigate("controls", {
                            controlId: firstIncomplete,
                          })
                        }
                      >
                        Continue with{" "}
                        <span className="control-id">
                          {formatControlIdDisplay(firstIncomplete)}
                        </span>
                      </button>
                      <span className="text-text-muted">
                        {" "}
                        (first incomplete {itemSingular})
                      </span>
                    </li>
                  ) : null}
                  {weakestFamily && weakestFamily.percent < 100 ? (
                    <li>
                      <button
                        type="button"
                        className="text-left text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        onClick={() =>
                          onNavigate("controls", {
                            family: weakestFamily.family,
                            controlId:
                              weakestFamily.firstIncompleteControlId ??
                              undefined,
                          })
                        }
                      >
                        {weakestFamily.family}
                      </button>
                      <span className="text-text-muted">
                        {" "}
                        — lowest completion ({weakestFamily.completed}/
                        {weakestFamily.total})
                      </span>
                    </li>
                  ) : null}
                  <li>
                    <button
                      type="button"
                      className="text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      onClick={() => onNavigate("controls")}
                    >
                      Open {itemsLabel}
                    </button>
                  </li>
                </ul>
              )}
            </section>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="recent-versions-heading">
            <div className="flex items-baseline justify-between gap-2">
              <h3
                id="recent-versions-heading"
                className="text-sm font-semibold text-foreground"
              >
                Recent versions
              </h3>
              <button
                type="button"
                className="text-xs text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                onClick={() => onNavigate("history")}
              >
                Full version history
              </button>
            </div>
            {recentVersions.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">
                No named versions or snapshots yet.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-border border border-border bg-surface">
                {recentVersions.map((snapshot) => (
                  <li
                    key={snapshot.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {formatSnapshotHistoryTitle(snapshot)}
                    </span>
                    <span className="text-xs text-text-muted">
                      <AbsoluteTimestamp value={snapshot.createdAt} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="details-summary-heading">
            <div className="flex items-baseline justify-between gap-2">
              <h3
                id="details-summary-heading"
                className="text-sm font-semibold text-foreground"
              >
                Project details
              </h3>
              <button
                type="button"
                className="text-xs text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                onClick={() => onNavigate("details")}
              >
                Edit details
              </button>
            </div>
            <dl className="mt-2 space-y-2 border border-border bg-surface p-3 text-sm">
              <div>
                <dt className="text-xs text-text-muted">System name</dt>
                <dd className="text-foreground">
                  {metadata.systemName.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Organization</dt>
                <dd className="text-foreground">
                  {metadata.organizationName.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Description</dt>
                <dd className="leading-relaxed text-text-secondary">
                  {abbreviatedDescription || "No system description yet."}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

function ValidationCheckRow({
  check,
  itemPlural,
  onOpenIncomplete,
}: {
  check: ValidationCheck;
  itemPlural: string;
  onOpenIncomplete?: () => void;
}) {
  const symbol = check.status === "pass" ? "✓" : "✕";
  return (
    <div>
      <p
        className={
          check.status === "pass" ? "text-success" : "text-danger"
        }
      >
        <span className="mr-1.5" aria-hidden="true">
          {symbol}
        </span>
        <span className="sr-only">
          {check.status === "pass" ? "Passed: " : "Failed: "}
        </span>
        <span className="text-foreground">{check.detail}</span>
      </p>
      {check.status === "fail" && onOpenIncomplete ? (
        <button
          type="button"
          className="mt-1 text-xs text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          onClick={onOpenIncomplete}
        >
          Open incomplete {itemPlural}
        </button>
      ) : null}
    </div>
  );
}
