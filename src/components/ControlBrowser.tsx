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
import { ControlEditorWorkspace } from "@/components/controlBrowser/ControlEditorWorkspace";
import {
  ImplementationStatusBadge,
  ReviewStatusBadge,
} from "@/components/design-system/badge/statusMaps";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ControlsFocusRequest } from "@/components/workspace/presentation";

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
  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null);
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
    if (focusRequest.commentId) {
      setPendingCommentId(focusRequest.commentId);
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
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border text-[10px] font-medium leading-none ${
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
    const unassigned = isControlOwnerUnassigned(record.owner);
    return (
      <span className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
        <ImplementationStatusBadge
          status={record.implementationStatus}
          className="shrink-0"
        />
        <ReviewStatusBadge status={reviewStatus} className="shrink-0" />
        {!unassigned ? (
          <span className="min-w-0 truncate text-[11px] text-text-muted">
            {displayControlOwner(record.owner)}
          </span>
        ) : (
          <span className="sr-only">No owner assigned</span>
        )}
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

        <nav
          className="min-h-0 flex-1 overflow-y-auto py-2"
          aria-label="Control list"
        >
          {filteredTree.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-muted">No controls match.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {filteredTree.map((group) => {
                const familyExpanded = isFamilyExpanded(group.family);
                const progress = familyProgressByName.get(group.family);
                return (
                  <li key={group.family}>
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
                        className="flex min-w-0 flex-1 flex-col items-stretch gap-1 px-1 py-2.5 text-left hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-foreground">
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
                      <ul className="flex flex-col gap-0.5 pb-2">
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
                                    <span
                                      aria-hidden="true"
                                      className="text-[10px]"
                                    >
                                      {parentExpanded ? "▼" : "▶"}
                                    </span>
                                  </button>
                                ) : (
                                  <span
                                    className="w-7 shrink-0"
                                    aria-hidden="true"
                                  />
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
                                  className={`flex min-w-0 flex-1 items-start gap-2 border-l-[3px] px-2 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring ${
                                    parentSelected
                                      ? "border-accent bg-surface text-foreground"
                                      : "border-transparent text-text-secondary hover:bg-surface"
                                  }`}
                                >
                                  <span className="min-w-0 flex-1 overflow-hidden">
                                    <span
                                      className={`control-id block text-[11px] font-medium ${
                                        parentSelected
                                          ? "text-accent"
                                          : "text-text-muted"
                                      }`}
                                    >
                                      {formatControlIdDisplay(node.control.id)}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[13px] font-medium leading-snug text-foreground">
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
                                <ul className="mb-1 ml-7 flex flex-col gap-0.5 border-l border-border">
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
                                          className={`flex w-full items-start gap-2 border-l-[3px] px-2 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring ${
                                            enhancementSelected
                                              ? "border-accent bg-surface text-foreground"
                                              : "border-transparent text-text-secondary hover:bg-surface"
                                          }`}
                                        >
                                          <span className="min-w-0 flex-1 overflow-hidden">
                                            <span
                                              className={`control-id block text-[11px] font-medium ${
                                                enhancementSelected
                                                  ? "text-accent"
                                                  : "text-text-muted"
                                              }`}
                                            >
                                              {formatControlIdDisplay(
                                                enhancement.id,
                                              )}{" "}
                                              ({number})
                                            </span>
                                            <span className="mt-0.5 block truncate text-[13px] font-medium leading-snug text-foreground">
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

      <ControlEditorWorkspace
        key={selected.id}
        projectId={projectId}
        control={selected}
        implementation={implementation}
        fields={selectedRecord}
        reviewStatus={selectedReviewStatus}
        narrativeComplete={selectedComplete}
        activityRefreshToken={activityRefreshToken}
        focusCommentId={pendingCommentId}
        onFocusCommentHandled={() => setPendingCommentId(null)}
        onUpdateImplementation={(patch) =>
          updateImplementation(selected.id, patch)
        }
        onUpdateFields={(patch) => updateControlRecord(selected.id, patch)}
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
    </div>
  );
}
