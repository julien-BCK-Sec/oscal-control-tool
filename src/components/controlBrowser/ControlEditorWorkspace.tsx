"use client";

import type { ControlImplementation, ImplementationStatus } from "@/data/implementation";
import type {
  ControlRecordFields,
  ControlReviewStatus,
} from "@/data/control-record";
import type { FrameworkControl } from "@/data/framework";
import { OwnershipCard } from "@/components/controlBrowser/OwnershipCard";
import { ImplementationMetaCard } from "@/components/controlBrowser/ImplementationMetaCard";
import { ControlReviewSection } from "@/components/controlBrowser/ControlReviewSection";
import { ControlActivityHistory } from "@/components/controlBrowser/ControlActivityHistory";
import { ControlEditorHeader } from "@/components/controlBrowser/ControlEditorHeader";
import { CollapsibleRequirement } from "@/components/controlBrowser/CollapsibleRequirement";
import { EvidencePlaceholderCard } from "@/components/controlBrowser/EvidencePlaceholderCard";
import { useControlReviewTransition } from "@/components/controlBrowser/useControlReviewTransition";
import { splitRequirementSegments } from "@/components/controlBrowser/requirementText";

const STATUS_OPTIONS: { value: ImplementationStatus; label: string }[] = [
  { value: "not-started", label: "Not Started" },
  { value: "in-progress", label: "In Progress" },
  { value: "implemented", label: "Implemented" },
  { value: "not-applicable", label: "Not Applicable" },
];

export type ControlEditorWorkspaceProps = {
  projectId: string;
  control: FrameworkControl;
  implementation: ControlImplementation;
  fields: ControlRecordFields;
  reviewStatus: ControlReviewStatus;
  narrativeComplete: boolean;
  activityRefreshToken: number;
  onUpdateImplementation: (patch: Partial<ControlImplementation>) => void;
  onUpdateFields: (patch: Partial<ControlRecordFields>) => void;
  onReviewStatusChange: (next: ControlReviewStatus) => void;
  onTransitionSuccess: () => void;
};

/**
 * Selected-control workspace. Key by control.id in the parent so review
 * transition UI state resets when switching controls.
 */
export function ControlEditorWorkspace({
  projectId,
  control,
  implementation,
  fields,
  reviewStatus,
  narrativeComplete,
  activityRefreshToken,
  onUpdateImplementation,
  onUpdateFields,
  onReviewStatusChange,
  onTransitionSuccess,
}: ControlEditorWorkspaceProps) {
  const reviewTransition = useControlReviewTransition({
    projectId,
    controlId: control.id,
    reviewStatus,
    onReviewStatusChange,
    onTransitionSuccess,
  });

  const requirementSegments = splitRequirementSegments(control.statement);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <ControlEditorHeader
        controlId={control.id}
        title={control.title}
        family={control.family}
        fields={fields}
        reviewStatus={reviewStatus}
        narrativeComplete={narrativeComplete}
        primaryAction={reviewTransition.primaryAction}
        pending={reviewTransition.pending}
        pendingAction={reviewTransition.pendingAction}
        onPrimaryAction={(action) => void reviewTransition.runAction(action)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col gap-6 px-4 py-5 lg:flex-row lg:items-start lg:gap-8 lg:px-6 lg:py-6">
          <div className="min-w-0 flex-1 space-y-6 lg:basis-[70%]">
            <CollapsibleRequirement controlId={control.id}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                {requirementSegments.map((segment, index) =>
                  segment.kind === "param" ? (
                    <code
                      key={`param-${index}`}
                      className="control-id rounded-sm bg-accent-muted px-1 py-0.5 text-[0.8em] text-accent"
                      title={`Parameter: ${segment.name}`}
                    >
                      {segment.value}
                    </code>
                  ) : (
                    <span key={`text-${index}`}>{segment.value}</span>
                  ),
                )}
              </p>
            </CollapsibleRequirement>

            <section aria-labelledby="narrative-heading" className="min-w-0">
              <h3
                id="narrative-heading"
                className="text-sm font-semibold tracking-tight text-foreground"
              >
                Implementation narrative
              </h3>
              <p className="mt-1 text-xs text-text-muted">
                {narrativeComplete
                  ? "This control counts as complete (non-empty narrative)."
                  : "Add implementation text to mark this control complete."}
              </p>

              <div className="mt-4 max-w-xs">
                <label htmlFor="implementation-status" className="label">
                  Statement status
                </label>
                <select
                  id="implementation-status"
                  value={implementation.status}
                  onChange={(event) =>
                    onUpdateImplementation({
                      status: event.target.value as ImplementationStatus,
                    })
                  }
                  className="field mt-1.5"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label htmlFor="implementation-narrative" className="label">
                  Narrative
                </label>
                <textarea
                  id="implementation-narrative"
                  value={implementation.narrative}
                  onChange={(event) =>
                    onUpdateImplementation({
                      narrative: event.target.value,
                    })
                  }
                  placeholder="Describe how this control is implemented…"
                  className="field mt-1.5 min-h-[min(50vh,28rem)] resize-y text-[15px] leading-relaxed"
                />
              </div>
            </section>

            <EvidencePlaceholderCard />
          </div>

          <aside
            className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-4 lg:w-[min(100%,20rem)] lg:basis-[30%] lg:self-start"
            aria-label="Control operations"
          >
            <OwnershipCard
              controlId={control.id}
              fields={fields}
              onChange={onUpdateFields}
            />
            <ImplementationMetaCard
              controlId={control.id}
              fields={fields}
              onChange={onUpdateFields}
            />
            <ControlReviewSection
              reviewStatus={reviewStatus}
              actions={reviewTransition.actions}
              primaryAction={reviewTransition.primaryAction}
              pending={reviewTransition.pending}
              pendingAction={reviewTransition.pendingAction}
              error={reviewTransition.error}
              onAction={(action) => void reviewTransition.runAction(action)}
            />
            <ControlActivityHistory
              projectId={projectId}
              controlId={control.id}
              refreshToken={activityRefreshToken}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
