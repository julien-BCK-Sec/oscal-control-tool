"use client";

import type { ControlImplementation, ImplementationStatus } from "@/data/implementation";
import type {
  ControlRecordFields,
  ControlReviewStatus,
} from "@/data/control-record";
import type { FrameworkControl } from "@/data/framework";
import type { FrameworkItemTerms } from "@/components/framework/presentation";
import { sentenceCase } from "@/components/framework/presentation";
import { OwnershipCard } from "@/components/controlBrowser/OwnershipCard";
import { ImplementationMetaCard } from "@/components/controlBrowser/ImplementationMetaCard";
import { ControlReviewSection } from "@/components/controlBrowser/ControlReviewSection";
import { ControlActivityHistory } from "@/components/controlBrowser/ControlActivityHistory";
import { ControlEditorHeader } from "@/components/controlBrowser/ControlEditorHeader";
import { CollapsibleRequirement } from "@/components/controlBrowser/CollapsibleRequirement";
import { ControlEvidencePanel } from "@/components/controlBrowser/ControlEvidencePanel";
import { OverlayMetadataPanel } from "@/components/controlBrowser/OverlayMetadataPanel";
import { HelpLink } from "@/components/help/HelpLink";
import { renderAuthoringRequirement } from "@/components/controlBrowser/authoringRequirement";
import type { AuthoringSegment } from "@/components/controlBrowser/authoringRequirement";
import {
  buildOverlayPresentation,
  frameworkItemSingular,
  isGeneralReadinessItem,
  statementReferenceChrome,
} from "@/components/controlBrowser/overlayPresentation";
import type { ControlEvidenceCoverage } from "@/data/evidence";
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
  evidenceCoverage?: ControlEvidenceCoverage | null;
  canEditEvidence?: boolean;
  itemTerms?: FrameworkItemTerms;
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
  evidenceCoverage = null,
  canEditEvidence = false,
  itemTerms = { singular: "control", plural: "controls" },
}: ControlEditorWorkspaceProps) {
  const overlay = buildOverlayPresentation(control);
  const authoring = renderAuthoringRequirement(control);
  const chrome = statementReferenceChrome(control, itemTerms, overlay);
  const itemSingular = frameworkItemSingular(control, itemTerms);
  const reviewTransition = useControlReviewTransition({
    projectId,
    controlId: control.id,
    reviewStatus,
    onReviewStatusChange,
    onTransitionSuccess,
    itemSingular,
  });

  function renderSourceStatement(text: string, keyPrefix: string) {
    return (
      <p className="max-w-[var(--layout-content-max)] whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
        {splitRequirementSegments(text).map((segment, index) =>
          segment.kind === "param" ? (
            <code
              key={`${keyPrefix}-param-${index}`}
              className="control-id rounded-sm bg-accent-muted px-1 py-0.5 text-[0.8em] text-accent"
            >
              {segment.value}
            </code>
          ) : (
            <span key={`${keyPrefix}-text-${index}`}>{segment.value}</span>
          ),
        )}
      </p>
    );
  }

  function renderAuthoringSegment(segment: AuthoringSegment, index: number) {
    if (segment.kind === "assigned") {
      return (
        <span key={`assigned-${index}`} className="font-medium text-foreground">
          {segment.value}
        </span>
      );
    }
    if (segment.kind === "odp") {
      return (
        <span
          key={`odp-${index}`}
          className="rounded-sm bg-surface px-1 py-0.5 text-text-secondary ring-1 ring-inset ring-border"
        >
          <span className="sr-only">Organization-defined parameter: </span>
          <span aria-hidden="true">[</span>
          {segment.label}
          <span aria-hidden="true">]</span>
        </span>
      );
    }
    return <span key={`text-${index}`}>{segment.value}</span>;
  }

  function renderAuthoringText() {
    return (
      <p className="max-w-[var(--layout-content-max)] whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
        {authoring.segments.map((segment, index) =>
          renderAuthoringSegment(segment, index),
        )}
      </p>
    );
  }

  const overlayHasExtra =
    overlay !== null &&
    (overlay.notices.length > 0 || overlay.layers.length > 0);
  const showHumanReadablePrimary =
    Boolean(overlay?.effectiveRequirement) ||
    (authoring.hasParamInserts && !isGeneralReadinessItem(control));
  const statementBody = renderSourceStatement(control.statement, "source");

  const main = (
    <>
      {overlay?.effectiveRequirement ? (
        <section
          aria-labelledby="effective-requirement-heading"
          className="min-w-0"
        >
          <SectionHeader
            title="Effective requirement"
            titleId="effective-requirement-heading"
            description="Known authoritative assignments are inserted for authoring. Unresolved organization-defined parameters use their catalog descriptions. The source statement is unchanged."
          />
          <div className="mt-2 border-l-2 border-accent bg-surface-secondary/50 px-4 py-3">
            {renderAuthoringText()}
            {overlay.effectiveRequirement.sourceLabel ? (
              <p className="mt-2 text-xs text-text-muted">
                Source: {overlay.effectiveRequirement.sourceLabel}
              </p>
            ) : null}
          </div>
          {overlayHasExtra ? null : (
            <p className="mt-2 text-xs">
              <HelpLink
                slug="dod-cloud-il4"
                hash="how-nist-fedramp-and-dod-layers-appear"
              >
                How Control Freak presents overlay requirements
              </HelpLink>
            </p>
          )}
        </section>
      ) : showHumanReadablePrimary ? (
        <section aria-labelledby="requirement-heading" className="min-w-0">
          <SectionHeader
            title="Requirement"
            titleId="requirement-heading"
            description="Organization-defined parameters are shown in human-readable form. The catalog source statement remains available."
          />
          <div className="mt-2 border-l-2 border-accent bg-surface-secondary/50 px-4 py-3">
            {renderAuthoringText()}
          </div>
        </section>
      ) : null}

      {chrome.collapsible ? (
        <CollapsibleRequirement
          controlId={control.id}
          heading={chrome.heading}
          headingId={
            showHumanReadablePrimary
              ? "source-statement-heading"
              : "requirement-heading"
          }
          storageKey={
            showHumanReadablePrimary
              ? "control-freak:source-statement-expanded"
              : "control-freak:requirement-expanded"
          }
          showHint={chrome.showHint}
          hideHint={chrome.hideHint}
        >
          {statementBody}
        </CollapsibleRequirement>
      ) : (
        <section aria-labelledby="requirement-heading" className="min-w-0">
          <SectionHeader title={chrome.heading} titleId="requirement-heading" />
          <div className="mt-2 border-l-2 border-border bg-surface-secondary/50 px-4 py-3">
            {statementBody}
          </div>
        </section>
      )}

      {overlay && overlayHasExtra ? (
        <OverlayMetadataPanel presentation={overlay} />
      ) : null}

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
            Tracks the completion of this implementation narrative, not this{" "}
            {itemSingular}’s governance status.
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
            placeholder={`Describe how this ${itemSingular} is implemented…`}
            className="field mt-1.5 min-h-[min(50vh,28rem)] resize-y text-[15px] leading-relaxed"
          />
        </FormField>
      </section>

      <ControlEvidencePanel
        projectId={projectId}
        controlId={control.id}
        refreshToken={activityRefreshToken}
        canEdit={canEditEvidence}
        coverage={evidenceCoverage}
        onActivity={onTransitionSuccess}
        itemSingular={itemSingular}
      />
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
        itemSingular={itemSingular}
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
        originId={control.originId}
        originCatalogLabel={
          itemTerms.singular === "requirement" ? "NIST SP 800-171" : undefined
        }
        itemKindLabel={
          isGeneralReadinessItem(control)
            ? sentenceCase("general readiness requirement")
            : undefined
        }
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
