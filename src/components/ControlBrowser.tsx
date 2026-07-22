"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FRAMEWORK, FRAMEWORK_CONTROLS } from "@/data/framework";
import {
  DEFAULT_CONTROL_IMPLEMENTATION,
  type ControlImplementation,
  type ImplementationStatus,
} from "@/data/implementation";
import {
  DEFAULT_CONTROL_RECORD_FIELDS,
  displayControlOwner,
  isControlOwnerUnassigned,
  resolveControlRecordFields,
  resolveControlReviewStatus,
  type ControlRecordFields,
  type ControlReviewStatus,
} from "@/data/control-record";
import {
  computeFamilyCompletion,
  computeOverallCompletion,
  formatCompletionCount,
  isImplementationComplete,
} from "@/domain";
import {
  buildControlTree,
  enhancementNumber,
  filterControlTree,
  formatControlIdDisplay,
  parentIdsWithEnhancements,
} from "@/components/controlBrowser/presentation";
import { ControlMetadataSection } from "@/components/controlBrowser/ControlMetadataSection";
import { ControlReviewSection } from "@/components/controlBrowser/ControlReviewSection";
import { ControlActivityHistory } from "@/components/controlBrowser/ControlActivityHistory";
import { ControlStatusBadge } from "@/components/controlBrowser/ControlStatusBadge";
import { ControlReviewStatusBadge } from "@/components/controlBrowser/ControlReviewStatusBadge";
import { splitRequirementSegments } from "@/components/controlBrowser/requirementText";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ControlsFocusRequest } from "@/components/workspace/presentation";

const STATUS_OPTIONS: { value: ImplementationStatus; label: string }[] = [
  { value: "not-started", label: "Not Started" },
  { value: "in-progress", label: "In Progress" },
  { value: "implemented", label: "Implemented" },
  { value: "not-applicable", label: "Not Applicable" },
];

function getImplementation(
  implementations: Record<string, ControlImplementation>,
  controlId: string,
): ControlImplementation {
  return implementations[controlId] ?? DEFAULT_CONTROL_IMPLEMENTATION;
}

function toggleId(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

export type ControlBrowserProps = {
  projectId: string;
  implementations: Record<string, ControlImplementation>;
  onImplementationsChange: (
    next: Record<string, ControlImplementation>,
  ) => void;
  controlRecords: Record<string, ControlRecordFields>;
  onControlRecordsChange: (next: Record<string, ControlRecordFields>) => void;
  controlReviewStatuses: Record<string, ControlReviewStatus>;
  onControlReviewStatusesChange: (
    next: Record<string, ControlReviewStatus>,
  ) => void;
  /** Bumped after ControlRecord autosave / review transition so History reloads. */
  activityRefreshToken?: number;
  onActivityRefresh?: () => void;
  /** Optional focus when navigating from Overview. */
  focusRequest?: ControlsFocusRequest | null;
  onFocusRequestHandled?: () => void;
};

export function ControlBrowser({
  projectId,
  implementations,
  onImplementationsChange,
  controlRecords,
  onControlRecordsChange,
  controlReviewStatuses,
  onControlReviewStatusesChange,
  activityRefreshToken = 0,
  onActivityRefresh,
  focusRequest = null,
  onFocusRequestHandled,
}: ControlBrowserProps) {
  const fullTree = useMemo(() => buildControlTree(FRAMEWORK_CONTROLS), []);
  const defaultCollapsedParents = useMemo(
    () => new Set(parentIdsWithEnhancements(fullTree)),
    [fullTree],
  );
  const allFamilyNames = useMemo(
    () => fullTree.map((group) => group.family),
    [fullTree],
  );

  const [selectedId, setSelectedId] = useState(FRAMEWORK_CONTROLS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedFamilies, setCollapsedFamilies] = useState(
    () => new Set<string>(),
  );
  const [collapsedParents, setCollapsedParents] = useState(
    () => new Set(defaultCollapsedParents),
  );
  const [appliedFocus, setAppliedFocus] =
    useState<ControlsFocusRequest | null>(null);
  const selectedItemRef = useRef<HTMLButtonElement | null>(null);

  // Apply Overview → Controls focus during render (preferred over an effect).
  if (focusRequest && focusRequest !== appliedFocus) {
    setAppliedFocus(focusRequest);
    if (focusRequest.family) {
      const nextFamilies = new Set(collapsedFamilies);
      nextFamilies.delete(focusRequest.family);
      setCollapsedFamilies(nextFamilies);
    }
    if (focusRequest.controlId) {
      setSelectedId(focusRequest.controlId);
      const parentMatch = /^([a-z]+-\d+)\.\d+$/i.exec(focusRequest.controlId);
      if (parentMatch) {
        const nextParents = new Set(collapsedParents);
        nextParents.delete(parentMatch[1].toLowerCase());
        setCollapsedParents(nextParents);
      }
    }
  }

  useEffect(() => {
    if (focusRequest && focusRequest === appliedFocus) {
      onFocusRequestHandled?.();
    }
  }, [focusRequest, appliedFocus, onFocusRequestHandled]);

  const filteredTree = useMemo(
    () => filterControlTree(fullTree, searchQuery),
    [fullTree, searchQuery],
  );

  const overall = useMemo(
    () => computeOverallCompletion(FRAMEWORK_CONTROLS, implementations),
    [implementations],
  );
  const familyProgress = useMemo(
    () => computeFamilyCompletion(FRAMEWORK_CONTROLS, implementations),
    [implementations],
  );
  const familyProgressByName = useMemo(() => {
    const map = new Map(
      familyProgress.map((entry) => [entry.family, entry]),
    );
    return map;
  }, [familyProgress]);

  const isSearching = searchQuery.trim().length > 0;

  const selected =
    FRAMEWORK_CONTROLS.find((control) => control.id === selectedId) ??
    FRAMEWORK_CONTROLS[0];
  const implementation = getImplementation(implementations, selected.id);
  const selectedComplete = isImplementationComplete(implementation);
  const selectedRecord = resolveControlRecordFields(
    controlRecords,
    selected.id,
  );
  const selectedReviewStatus = resolveControlReviewStatus(
    controlReviewStatuses,
    selected.id,
  );
  const requirementSegments = splitRequirementSegments(selected.statement);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedId]);

  function updateImplementation(
    controlId: string,
    patch: Partial<ControlImplementation>,
  ) {
    const current = getImplementation(implementations, controlId);
    onImplementationsChange({
      ...implementations,
      [controlId]: {
        ...current,
        ...patch,
      },
    });
  }

  function updateControlRecord(
    controlId: string,
    patch: Partial<ControlRecordFields>,
  ) {
    const current = resolveControlRecordFields(controlRecords, controlId);
    onControlRecordsChange({
      ...controlRecords,
      [controlId]: {
        ...DEFAULT_CONTROL_RECORD_FIELDS,
        ...current,
        ...patch,
      },
    });
  }

  function isFamilyExpanded(family: string): boolean {
    if (isSearching) {
      return true;
    }
    return !collapsedFamilies.has(family);
  }

  function isParentExpanded(parentId: string): boolean {
    if (isSearching) {
      return true;
    }
    return !collapsedParents.has(parentId);
  }

  function expandAllFamilies() {
    setCollapsedFamilies(new Set());
  }

  function collapseAllFamilies() {
    setCollapsedFamilies(new Set(allFamilyNames));
  }

  function renderCompletionMark(controlId: string, isSelected: boolean) {
    const complete = isImplementationComplete(
      getImplementation(implementations, controlId),
    );
    return (
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border text-[10px] font-medium leading-none ${
          complete
            ? "border-success/40 bg-success-muted text-success"
            : isSelected
              ? "border-border-strong bg-surface text-text-muted"
              : "border-border bg-surface-secondary text-text-muted"
        }`}
        title={complete ? "Complete" : "Incomplete"}
        aria-label={complete ? "Complete" : "Incomplete"}
      >
        {complete ? "✓" : "·"}
      </span>
    );
  }

  function renderListMeta(controlId: string) {
    const record = resolveControlRecordFields(controlRecords, controlId);
    const reviewStatus = resolveControlReviewStatus(
      controlReviewStatuses,
      controlId,
    );
    const ownerLabel = displayControlOwner(record.owner);
    const unassigned = isControlOwnerUnassigned(record.owner);
    return (
      <span className="mt-1 flex flex-wrap items-center gap-1.5">
        <ControlStatusBadge
          implementationStatus={record.implementationStatus}
        />
        <ControlReviewStatusBadge reviewStatus={reviewStatus} />
        <span
          className={`text-[11px] ${
            unassigned ? "text-warning" : "text-text-muted"
          }`}
        >
          {ownerLabel}
        </span>
        {unassigned ? (
          <span className="sr-only">No owner assigned</span>
        ) : null}
      </span>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface text-foreground md:flex-row">
      <aside
        className="flex max-h-[42vh] w-full shrink-0 flex-col border-b border-border bg-surface-secondary md:max-h-none md:h-full md:w-80 md:border-b-0 md:border-r lg:w-[22rem]"
        aria-label="Controls"
      >
        <div className="shrink-0 space-y-3 border-b border-border px-3 py-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Controls
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">{FRAMEWORK.title}</p>
            <div className="mt-2">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-text-secondary">
                  {formatCompletionCount(overall)} completed
                </span>
                <span className="tabular-nums text-text-muted">
                  {overall.percent}%
                </span>
              </div>
              <ProgressBar
                className="mt-1.5"
                progress={overall}
                label="Overall control completion"
              />
            </div>
          </div>
          <div>
            <label htmlFor="control-search" className="sr-only">
              Search controls
            </label>
            <input
              id="control-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by ID or title…"
              className="field"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={expandAllFamilies}
              className="btn flex-1 px-2 py-1 text-xs"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAllFamilies}
              className="btn flex-1 px-2 py-1 text-xs"
            >
              Collapse all
            </button>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto py-1.5" aria-label="Control list">
          {filteredTree.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-muted">No controls match.</p>
          ) : (
            <ul className="flex flex-col">
              {filteredTree.map((group) => {
                const familyExpanded = isFamilyExpanded(group.family);
                const progress = familyProgressByName.get(group.family);
                return (
                  <li key={group.family} className="mb-0.5">
                    <div className="flex items-stretch">
                      <button
                        type="button"
                        aria-expanded={familyExpanded}
                        onClick={() =>
                          setCollapsedFamilies((current) =>
                            toggleId(current, group.family),
                          )
                        }
                        className="flex w-7 shrink-0 items-center justify-center text-text-muted hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
                        aria-label={
                          familyExpanded
                            ? `Collapse ${group.family}`
                            : `Expand ${group.family}`
                        }
                      >
                        <span aria-hidden="true" className="text-[10px]">
                          {familyExpanded ? "▼" : "▶"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedFamilies((current) =>
                            toggleId(current, group.family),
                          )
                        }
                        className="flex min-w-0 flex-1 flex-col items-stretch gap-1 px-1 py-2 text-left hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-xs font-medium text-foreground">
                            {group.family}
                          </span>
                          {progress ? (
                            <span className="control-id shrink-0 text-[10px] text-text-muted">
                              {progress.abbreviation}
                            </span>
                          ) : null}
                        </span>
                        {progress ? (
                          <span className="flex items-center gap-2">
                            <ProgressBar
                              className="min-w-0 flex-1"
                              progress={{
                                completed: progress.completed,
                                total: progress.total,
                                percent: progress.percent,
                              }}
                              label={`${group.family} completion`}
                            />
                            <span className="shrink-0 text-[10px] tabular-nums text-text-muted">
                              {progress.completed}/{progress.total}
                            </span>
                          </span>
                        ) : null}
                      </button>
                    </div>

                    {familyExpanded ? (
                      <ul className="pb-1">
                        {group.nodes.map((node) => {
                          const parentSelected =
                            node.control.id === selected.id;
                          const hasEnhancements =
                            node.enhancements.length > 0;
                          const parentExpanded = isParentExpanded(
                            node.control.id,
                          );

                          return (
                            <li key={node.control.id}>
                              <div className="flex items-stretch">
                                {hasEnhancements ? (
                                  <button
                                    type="button"
                                    aria-expanded={parentExpanded}
                                    onClick={() =>
                                      setCollapsedParents((current) =>
                                        toggleId(current, node.control.id),
                                      )
                                    }
                                    className="flex w-7 shrink-0 items-center justify-center text-text-muted hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
                                    aria-label={
                                      parentExpanded
                                        ? `Collapse enhancements for ${formatControlIdDisplay(node.control.id)}`
                                        : `Expand enhancements for ${formatControlIdDisplay(node.control.id)}`
                                    }
                                  >
                                    <span aria-hidden="true" className="text-[10px]">
                                      {parentExpanded ? "▼" : "▶"}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="w-7 shrink-0" aria-hidden="true" />
                                )}
                                <button
                                  type="button"
                                  ref={
                                    parentSelected ? selectedItemRef : undefined
                                  }
                                  onClick={() => setSelectedId(node.control.id)}
                                  aria-current={
                                    parentSelected ? "true" : undefined
                                  }
                                  className={`flex min-w-0 flex-1 items-start gap-2 border-l-[3px] px-2 py-1.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring ${
                                    parentSelected
                                      ? "border-accent bg-surface text-foreground"
                                      : "border-transparent text-text-secondary hover:bg-surface"
                                  }`}
                                >
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={`control-id block text-xs ${
                                        parentSelected
                                          ? "text-accent"
                                          : "text-text-muted"
                                      }`}
                                    >
                                      {formatControlIdDisplay(node.control.id)}
                                    </span>
                                    <span className="block text-[13px] leading-snug">
                                      {node.control.title}
                                    </span>
                                    {renderListMeta(node.control.id)}
                                  </span>
                                  {renderCompletionMark(
                                    node.control.id,
                                    parentSelected,
                                  )}
                                </button>
                              </div>

                              {hasEnhancements && parentExpanded ? (
                                <ul className="mb-1 ml-7 border-l border-border">
                                  {node.enhancements.map((enhancement) => {
                                    const enhancementSelected =
                                      enhancement.id === selected.id;
                                    const number =
                                      enhancementNumber(enhancement.id) ?? "?";
                                    return (
                                      <li key={enhancement.id}>
                                        <button
                                          type="button"
                                          ref={
                                            enhancementSelected
                                              ? selectedItemRef
                                              : undefined
                                          }
                                          onClick={() =>
                                            setSelectedId(enhancement.id)
                                          }
                                          aria-current={
                                            enhancementSelected
                                              ? "true"
                                              : undefined
                                          }
                                          className={`flex w-full items-start gap-2 border-l-[3px] px-2 py-1.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring ${
                                            enhancementSelected
                                              ? "border-accent bg-surface text-foreground"
                                              : "border-transparent text-text-secondary hover:bg-surface"
                                          }`}
                                        >
                                          <span className="min-w-0 flex-1">
                                            <span
                                              className={`control-id text-xs ${
                                                enhancementSelected
                                                  ? "text-accent"
                                                  : "text-text-muted"
                                              }`}
                                            >
                                              ({number})
                                            </span>{" "}
                                            <span className="text-[13px] leading-snug">
                                              {enhancement.title}
                                            </span>
                                            {renderListMeta(enhancement.id)}
                                          </span>
                                          {renderCompletionMark(
                                            enhancement.id,
                                            enhancementSelected,
                                          )}
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="border-b border-border bg-surface px-4 py-5 sm:px-8">
          <p className="control-id text-sm text-accent">
            {formatControlIdDisplay(selected.id)}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            {selected.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
            <span>{selected.family}</span>
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
            <span
              className={
                selectedComplete
                  ? "font-medium text-success"
                  : "font-medium text-warning"
              }
            >
              <span aria-hidden="true">{selectedComplete ? "✓ " : "○ "}</span>
              {selectedComplete ? "Complete" : "Incomplete"}
            </span>
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
            <ControlStatusBadge
              implementationStatus={selectedRecord.implementationStatus}
            />
            <ControlReviewStatusBadge reviewStatus={selectedReviewStatus} />
            <span
              className={
                isControlOwnerUnassigned(selectedRecord.owner)
                  ? "text-warning"
                  : undefined
              }
            >
              {displayControlOwner(selectedRecord.owner)}
            </span>
          </div>
          {isControlOwnerUnassigned(selectedRecord.owner) ? (
            <p className="mt-2 text-xs text-warning" role="status">
              No owner assigned
            </p>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-6 px-4 py-5 sm:px-8">
          <section aria-labelledby="requirement-heading">
            <h3
              id="requirement-heading"
              className="text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              Requirement
            </h3>
            <div className="mt-2 max-w-3xl border-l-2 border-border bg-surface-secondary/60 px-4 py-3">
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
            </div>
          </section>

          <ControlMetadataSection
            controlId={selected.id}
            fields={selectedRecord}
            onChange={(patch) => updateControlRecord(selected.id, patch)}
          />

          <ControlReviewSection
            projectId={projectId}
            controlId={selected.id}
            reviewStatus={selectedReviewStatus}
            onReviewStatusChange={(next) => {
              onControlReviewStatusesChange({
                ...controlReviewStatuses,
                [selected.id]: next,
              });
            }}
            onTransitionSuccess={() => {
              onActivityRefresh?.();
            }}
          />

          <ControlActivityHistory
            projectId={projectId}
            controlId={selected.id}
            refreshToken={activityRefreshToken}
          />

          <section
            className="max-w-3xl"
            aria-labelledby="implementation-heading"
          >
            <h3
              id="implementation-heading"
              className="text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              Implementation
            </h3>

            <div className="mt-3">
              <label htmlFor="implementation-status" className="label">
                Implementation status
              </label>
              <select
                id="implementation-status"
                value={implementation.status}
                onChange={(event) =>
                  updateImplementation(selected.id, {
                    status: event.target.value as ImplementationStatus,
                  })
                }
                className="field mt-1.5 max-w-xs"
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
                  updateImplementation(selected.id, {
                    narrative: event.target.value,
                  })
                }
                placeholder="Describe how this control is implemented…"
                className="field mt-1.5 min-h-[min(40vh,20rem)] resize-y leading-relaxed"
              />
              <p className="mt-1.5 text-xs text-text-muted">
                {selectedComplete
                  ? "This control counts as complete (non-empty narrative)."
                  : "Add implementation text to mark this control complete."}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
