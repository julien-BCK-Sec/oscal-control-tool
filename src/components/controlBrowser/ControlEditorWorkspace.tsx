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
import { DiscussionPanel } from "@/components/collaboration/DiscussionPanel";
import { AssignmentControls } from "@/components/collaboration/AssignmentControls";
import { useControlReviewTransition } from "@/components/controlBrowser/useControlReviewTransition";
import { splitRequirementSegments } from "@/components/controlBrowser/requirementText";
import {
  FormField,
  FormHint,
  FormLabel,
} from "@/components/design-system/form/FormField";
import {
  SectionHeader,
  SplitLayout,
} from "@/components/design-system/layout/primitives";

const STATUS_OPTIONS: { value: ImplementationStatus; label: string }[] = [
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "implemented", label: "Implemented" },
  { value: "not-applicable", label: "Not applicable" },
];

export type ControlEditorWorkspaceProps = {
  projectId: string;
  control: FrameworkControl;
  implementation: ControlImplementation;
  fields: ControlRecordFields;
  reviewStatus: ControlReviewStatus;
  narrativeComplete: boolean;
  activityRefreshToken: number;
  focusCommentId?: string | null;
  onFocusCommentHandled?: () => void;
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
  focusCommentId = null,
  onFocusCommentHandled,
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

  const main = (
    <>
      <CollapsibleRequirement controlId={control.id}>
        <p className="max-w-[var(--layout-content-max)] whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
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
        <SectionHeader
          title="Narrative"
          titleId="narrative-heading"
          description="Narrative completion is based on whether implementation text has been provided."
        />

        <FormField className="mt-4 max-w-xs">
          <FormLabel htmlFor="implementation-status">Narrative status</FormLabel>
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
          <FormHint>
            Tracks the completion of this implementation narrative, not the
            control’s governance status.
          </FormHint>
        </FormField>

        <FormField className="mt-4">
          <FormLabel htmlFor="implementation-narrative">Narrative</FormLabel>
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
        </FormField>
      </section>

      <EvidencePlaceholderCard />
    </>
  );

  const side = (
    <>
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
        omitPrimaryOnDesktop
      />
      <AssignmentControls
        projectId={projectId}
        controlId={control.id}
        refreshToken={activityRefreshToken}
        onActivity={onTransitionSuccess}
      />
      <DiscussionPanel
        projectId={projectId}
        controlId={control.id}
        refreshToken={activityRefreshToken}
        focusCommentId={focusCommentId}
        onFocusCommentHandled={onFocusCommentHandled}
        onActivity={onTransitionSuccess}
      />
      <ControlActivityHistory
        projectId={projectId}
        controlId={control.id}
        refreshToken={activityRefreshToken}
      />
    </>
  );

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
        <div className="px-4 py-4 sm:px-6 lg:py-5">
          <SplitLayout main={main} side={side} />
        </div>
      </div>
    </div>
  );
}
