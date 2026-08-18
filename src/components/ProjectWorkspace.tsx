"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { ControlBrowser } from "@/components/ControlBrowser";
import { EvidenceBrowser } from "@/components/evidence/EvidenceBrowser";
import { ProjectMetadataSection } from "@/components/ProjectMetadataSection";
import { ProjectOverview } from "@/components/ProjectOverview";
import { AuthenticatedHeaderActions } from "@/components/auth/AuthenticatedHeaderActions";
import { ProductHeader } from "@/components/design-system/layout/AppShell";
import {
  createNamedVersionAction,
  createAutomaticSnapshotAction,
  listSnapshotsAction,
  restoreSnapshotAction,
  saveProjectAction,
} from "@/app/actions/projects";
import { upsertControlRecordsAction, listControlRecordsAction } from "@/app/actions/control-records";
import {
  getEvidenceCapabilitiesAction,
  getProjectEvidenceCoverageAction,
  type EvidenceCapabilities,
} from "@/app/actions/evidence";
import type { ProjectEvidenceCoverageResult } from "@/data/evidence";
import { notifyNotificationsChanged } from "@/components/collaboration/notifications-changed";
import type { ControlImplementation } from "@/data/implementation";
import {
  controlRecordsToFieldMap,
  controlRecordsToReviewStatusMap,
  DEFAULT_CONTROL_RECORD_FIELDS,
  type ControlRecord,
  type ControlRecordFields,
  type ControlReviewStatus,
} from "@/data/control-record";
import type { ProjectMetadata } from "@/data/project";
import type { Framework } from "@/data/framework";
import type { FrameworkDescriptor } from "@/data/framework/types";
import {
  frameworkItemTerms,
  type FrameworkItemTerms,
} from "@/components/framework/presentation";
import { computeOverallCompletion } from "@/domain";
import {
  AUTOSAVE_DEBOUNCE_MS,
  type AutosaveStatus,
  EditorHistory,
  cloneWorkingCopy,
  type EditorWorkingCopy,
  workingCopiesEqual,
} from "@/editor/history";
import { SnapshotHistoryPanel } from "@/components/projectHistory/SnapshotHistoryPanel";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import {
  DEFAULT_WORKSPACE_TAB,
  type ControlsFocusRequest,
  type EvidenceAttentionFilter,
  type WorkspaceTabId,
} from "@/components/workspace/presentation";
import type {
  ProjectSnapshotSummary,
  StoredProject,
} from "@/persistence/types";

export type ProjectWorkspaceProps = {
  initialProject: StoredProject;
  framework: Framework;
  frameworkDescriptor: FrameworkDescriptor;
  frameworkLabel: string;
  initialControlRecords: ControlRecord[];
  initialSnapshots: ProjectSnapshotSummary[];
  initialView?: WorkspaceTabId;
  /** Deep-link focus into Controls (notification / overview navigation). */
  initialFocus?: ControlsFocusRequest;
  initialEvidenceAttention?: EvidenceAttentionFilter;
};

type FlushSaveResult =
  | { ok: true }
  | { ok: false; reason: "conflict" | "error" };

function initialWorkingCopy(
  project: StoredProject,
  controlRecords: Record<string, ControlRecordFields>,
): EditorWorkingCopy {
  return {
    name: project.name,
    metadata: project.metadata,
    implementations: project.implementations,
    controlRecords,
  };
}

export function ProjectWorkspace({
  initialProject,
  framework,
  frameworkDescriptor,
  frameworkLabel,
  initialControlRecords,
  initialSnapshots,
  initialView = DEFAULT_WORKSPACE_TAB,
  initialFocus,
  initialEvidenceAttention = "all",
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();

  const initialRecordsMap = useMemo(
    () => controlRecordsToFieldMap(initialControlRecords),
    [initialControlRecords],
  );
  const initialReviewStatusMap = useMemo(
    () => controlRecordsToReviewStatusMap(initialControlRecords),
    [initialControlRecords],
  );

  const [name, setName] = useState(initialProject.name);
  const [metadata, setMetadata] = useState(initialProject.metadata);
  const [implementations, setImplementations] = useState(
    initialProject.implementations,
  );
  const [controlRecords, setControlRecords] =
    useState<Record<string, ControlRecordFields>>(initialRecordsMap);
  const [controlReviewStatuses, setControlReviewStatuses] = useState<
    Record<string, ControlReviewStatus>
  >(initialReviewStatusMap);
  const [activityRefreshToken, setActivityRefreshToken] = useState(0);
  const [revision, setRevision] = useState(initialProject.revision);
  const [updatedAt, setUpdatedAt] = useState(initialProject.updatedAt);
  const projectId = initialProject.id;

  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("clean");
  const [autosaveMessage, setAutosaveMessage] = useState<string | null>(null);
  const [snapshots, setSnapshots] =
    useState<ProjectSnapshotSummary[]>(initialSnapshots);
  const [versionName, setVersionName] = useState("");
  const [versionMessage, setVersionMessage] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>(
    initialFocus?.controlId ? "controls" : initialView,
  );
  const [controlsFocus, setControlsFocus] =
    useState<ControlsFocusRequest | null>(initialFocus ?? null);
  const [evidenceAttention, setEvidenceAttention] =
    useState<EvidenceAttentionFilter>(initialEvidenceAttention);
  const [evidenceCoverage, setEvidenceCoverage] =
    useState<ProjectEvidenceCoverageResult | null>(null);
  const [evidenceCoverageLoading, setEvidenceCoverageLoading] = useState(true);
  const [evidenceCaps, setEvidenceCaps] = useState<EvidenceCapabilities>({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canAssociate: false,
    canArchive: false,
    canDelete: false,
  });
  const itemTerms: FrameworkItemTerms = frameworkItemTerms(frameworkDescriptor);

  const historyRef = useRef(
    new EditorHistory(initialWorkingCopy(initialProject, initialRecordsMap)),
  );
  const savedCopyRef = useRef(
    cloneWorkingCopy(initialWorkingCopy(initialProject, initialRecordsMap)),
  );
  const workingCopyRef = useRef(
    cloneWorkingCopy(initialWorkingCopy(initialProject, initialRecordsMap)),
  );
  const revisionRef = useRef(initialProject.revision);
  const autosaveStatusRef = useRef<AutosaveStatus>("clean");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingGroupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savePromiseRef = useRef<Promise<FlushSaveResult> | null>(null);
  const saveChainRef = useRef<Promise<unknown>>(Promise.resolve());
  const flushSaveRef = useRef<() => Promise<FlushSaveResult>>(async () => ({
    ok: true,
  }));
  const mountedRef = useRef(true);

  const completion = useMemo(
    () => computeOverallCompletion(framework.controls, implementations),
    [framework.controls, implementations],
  );

  const setStatus = useCallback((status: AutosaveStatus, message?: string | null) => {
    autosaveStatusRef.current = status;
    setAutosaveStatus(status);
    if (message !== undefined) {
      setAutosaveMessage(message);
    }
  }, []);

  const refreshSnapshots = useCallback(async () => {
    const next = await listSnapshotsAction(projectId);
    if (mountedRef.current) {
      setSnapshots(next);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [caps, nextCoverage] = await Promise.all([
        getEvidenceCapabilitiesAction(projectId),
        getProjectEvidenceCoverageAction(projectId),
      ]);
      if (cancelled) {
        return;
      }
      setEvidenceCaps(caps);
      setEvidenceCoverage(nextCoverage);
      setEvidenceCoverageLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, activityRefreshToken]);

  function readLatestWorkingCopy(): EditorWorkingCopy {
    return cloneWorkingCopy(workingCopyRef.current);
  }

  function isDirtyAgainstSaved(): boolean {
    return !workingCopiesEqual(workingCopyRef.current, savedCopyRef.current);
  }

  function syncHistoryFlags() {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }

  function applyWorkingCopyToState(copy: EditorWorkingCopy) {
    workingCopyRef.current = cloneWorkingCopy(copy);
    setName(copy.name);
    setMetadata(copy.metadata);
    setImplementations(copy.implementations);
    setControlRecords(copy.controlRecords);
  }

  function selectTab(tab: WorkspaceTabId, attention?: EvidenceAttentionFilter) {
    setActiveTab(tab);
    const params = new URLSearchParams();
    if (tab !== DEFAULT_WORKSPACE_TAB) {
      params.set("view", tab);
    }
    if (tab === "evidence") {
      const nextAttention = attention ?? "all";
      setEvidenceAttention(nextAttention);
      if (nextAttention !== "all") {
        params.set("attention", nextAttention);
      }
    }
    const query = params.toString();
    const href = query.length > 0 ? `${pathname}?${query}` : pathname;
    router.replace(href, { scroll: false });
  }

  function navigateFromOverview(
    view: "controls" | "details" | "history",
    focus?: ControlsFocusRequest,
  ) {
    if (view === "controls" && focus) {
      setControlsFocus(focus);
    }
    selectTab(view);
  }

  function navigateToEvidence(attention: EvidenceAttentionFilter) {
    selectTab("evidence", attention);
  }

  function navigateToControl(controlId: string) {
    setControlsFocus({ controlId });
    selectTab("controls");
  }

  async function flushSave(): Promise<FlushSaveResult> {
    const doSaveLoop = async (): Promise<FlushSaveResult> => {
      for (;;) {
        if (autosaveStatusRef.current === "conflict") {
          return { ok: false, reason: "conflict" };
        }

        const current = readLatestWorkingCopy();
        if (workingCopiesEqual(current, savedCopyRef.current)) {
          setStatus("saved", null);
          return { ok: true };
        }

        setStatus("saving", null);

        const projectDirty =
          current.name !== savedCopyRef.current.name ||
          JSON.stringify(current.metadata) !==
            JSON.stringify(savedCopyRef.current.metadata) ||
          JSON.stringify(current.implementations) !==
            JSON.stringify(savedCopyRef.current.implementations);
        const recordsDirty =
          JSON.stringify(current.controlRecords) !==
          JSON.stringify(savedCopyRef.current.controlRecords);

        try {
          let nextSaved = cloneWorkingCopy(savedCopyRef.current);

          if (projectDirty) {
            const result = await saveProjectAction({
              id: projectId,
              name: current.name,
              metadata: current.metadata,
              implementations: current.implementations,
              expectedRevision: revisionRef.current,
            });

            if (!result.ok) {
              if (result.reason === "conflict") {
                setStatus("conflict", result.message);
                return { ok: false, reason: "conflict" };
              }
              setStatus("error", result.message);
              return { ok: false, reason: "error" };
            }

            revisionRef.current = result.project.revision;
            if (mountedRef.current) {
              setRevision(result.project.revision);
              setUpdatedAt(result.project.updatedAt);
            }
            nextSaved = {
              ...nextSaved,
              name: result.project.name,
              metadata: result.project.metadata,
              implementations: result.project.implementations,
            };
            await refreshSnapshots();
          }

          if (recordsDirty) {
            const records = Object.entries(current.controlRecords).map(
              ([controlId, fields]) => ({
                controlId,
                ...fields,
              }),
            );
            const result = await upsertControlRecordsAction({
              projectId,
              records,
            });
            if (!result.ok) {
              setStatus("error", result.message);
              return { ok: false, reason: "error" };
            }
            nextSaved = {
              ...nextSaved,
              controlRecords: { ...current.controlRecords },
            };
            if (mountedRef.current) {
              setActivityRefreshToken((token) => token + 1);
            }
          }

          savedCopyRef.current = cloneWorkingCopy(nextSaved);

          if (isDirtyAgainstSaved()) {
            setStatus("dirty", null);
            continue;
          }

          setStatus("saved", null);
          return { ok: true };
        } catch (error) {
          setStatus(
            "error",
            error instanceof Error ? error.message : "Save failed.",
          );
          return { ok: false, reason: "error" };
        }
      }
    };

    const next: Promise<FlushSaveResult> = saveChainRef.current
      .catch(() => undefined)
      .then(() => doSaveLoop());
    saveChainRef.current = next.then(
      () => undefined,
      () => undefined,
    );
    savePromiseRef.current = next;
    try {
      return await next;
    } finally {
      if (savePromiseRef.current === next) {
        savePromiseRef.current = null;
      }
    }
  }

  flushSaveRef.current = flushSave;

  function scheduleAutosave() {
    if (isDirtyAgainstSaved()) {
      if (autosaveStatusRef.current !== "conflict") {
        setStatus("dirty", null);
      }
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void flushSaveRef.current();
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  function commitEdit(next: EditorWorkingCopy) {
    workingCopyRef.current = cloneWorkingCopy(next);

    if (typingGroupRef.current) {
      clearTimeout(typingGroupRef.current);
      setName(next.name);
      setMetadata(next.metadata);
      setImplementations(next.implementations);
      setControlRecords(next.controlRecords);
      typingGroupRef.current = setTimeout(() => {
        historyRef.current.push(next);
        syncHistoryFlags();
        typingGroupRef.current = null;
      }, 400);
    } else {
      historyRef.current.push(next);
      setName(next.name);
      setMetadata(next.metadata);
      setImplementations(next.implementations);
      setControlRecords(next.controlRecords);
      syncHistoryFlags();
      typingGroupRef.current = setTimeout(() => {
        typingGroupRef.current = null;
      }, 400);
    }
    scheduleAutosave();
  }

  function handleMetadataChange(next: ProjectMetadata) {
    commitEdit({
      name: workingCopyRef.current.name,
      metadata: next,
      implementations: workingCopyRef.current.implementations,
      controlRecords: workingCopyRef.current.controlRecords,
    });
  }

  function handleImplementationsChange(
    next: Record<string, ControlImplementation>,
  ) {
    commitEdit({
      name: workingCopyRef.current.name,
      metadata: workingCopyRef.current.metadata,
      implementations: next,
      controlRecords: workingCopyRef.current.controlRecords,
    });
  }

  function handleControlRecordsChange(
    next: Record<string, ControlRecordFields>,
  ) {
    commitEdit({
      name: workingCopyRef.current.name,
      metadata: workingCopyRef.current.metadata,
      implementations: workingCopyRef.current.implementations,
      controlRecords: next,
    });
  }

  /**
   * After collaboration mutations, workflows may have changed
   * implementationStatus / reviewDueDate in the database. Sync those fields
   * into client state without clobbering other local metadata edits.
   */
  async function syncWorkflowMutableControlFields(): Promise<void> {
    try {
      const records = await listControlRecordsAction(projectId);
      if (!mountedRef.current) {
        return;
      }
      setControlRecords((prev) => {
        const next: Record<string, ControlRecordFields> = { ...prev };
        for (const record of records) {
          const existing = next[record.controlId] ?? {
            ...DEFAULT_CONTROL_RECORD_FIELDS,
          };
          next[record.controlId] = {
            ...existing,
            implementationStatus: record.implementationStatus,
            reviewDueDate: record.reviewDueDate,
          };
        }
        workingCopyRef.current = {
          ...workingCopyRef.current,
          controlRecords: next,
        };
        // Keep saved baseline aligned for workflow-owned fields so autosave
        // does not immediately overwrite the server with stale values.
        const savedRecords = {
          ...savedCopyRef.current.controlRecords,
        };
        for (const record of records) {
          const existing = savedRecords[record.controlId] ?? {
            ...DEFAULT_CONTROL_RECORD_FIELDS,
          };
          savedRecords[record.controlId] = {
            ...existing,
            implementationStatus: record.implementationStatus,
            reviewDueDate: record.reviewDueDate,
          };
        }
        savedCopyRef.current = {
          ...savedCopyRef.current,
          controlRecords: savedRecords,
        };
        return next;
      });
    } catch {
      // Best-effort sync; user can still hard-refresh.
    }
  }

  function undo() {
    if (typingGroupRef.current) {
      clearTimeout(typingGroupRef.current);
      typingGroupRef.current = null;
      historyRef.current.push(readLatestWorkingCopy());
    }
    const previous = historyRef.current.undo();
    if (!previous) {
      return;
    }
    applyWorkingCopyToState(previous);
    syncHistoryFlags();
    scheduleAutosave();
  }

  function redo() {
    const next = historyRef.current.redo();
    if (!next) {
      return;
    }
    applyWorkingCopyToState(next);
    syncHistoryFlags();
    scheduleAutosave();
  }

  async function ensurePersistedForDestructiveAction(
    abortMessage: string,
  ): Promise<boolean> {
    if (autosaveStatusRef.current === "conflict") {
      setAutosaveMessage(abortMessage);
      return false;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const result = await flushSave();
    if (!result.ok) {
      setAutosaveMessage(
        result.reason === "conflict"
          ? abortMessage
          : "Save failed. Resolve the error before continuing.",
      );
      return false;
    }

    if (isDirtyAgainstSaved()) {
      setAutosaveMessage(abortMessage);
      return false;
    }

    return true;
  }

  async function reloadLatest() {
    const confirmed = window.confirm(
      "Reload the latest saved project from the database? Any unsaved local edits in this editor will be discarded.",
    );
    if (!confirmed) {
      return;
    }
    window.location.reload();
  }

  async function handleSaveVersion() {
    setVersionMessage(null);
    const ok = await ensurePersistedForDestructiveAction(
      "Resolve the save conflict or error before creating a version.",
    );
    if (!ok) {
      setVersionMessage(
        "Could not save the current project. Fix save issues before creating a named version.",
      );
      return;
    }

    const result = await createNamedVersionAction({
      projectId,
      name: versionName,
      expectedRevision: revisionRef.current,
    });
    if (!result.ok) {
      setVersionMessage(result.message);
      return;
    }
    setVersionName("");
    setVersionMessage(`Saved version “${result.snapshot.name}”.`);
    await refreshSnapshots();
  }

  async function handleRestore(snapshotId: string) {
    const confirmed = window.confirm(
      "Restore this snapshot? Your current saved state will be kept as a recovery snapshot first.",
    );
    if (!confirmed) {
      return;
    }

    const ok = await ensurePersistedForDestructiveAction(
      "Resolve the save conflict or error before restoring.",
    );
    if (!ok) {
      return;
    }

    const result = await restoreSnapshotAction({
      projectId,
      snapshotId,
      expectedRevision: revisionRef.current,
    });

    if (!result.ok) {
      if (result.reason === "conflict") {
        setStatus("conflict", result.message);
      } else {
        setAutosaveMessage(result.message);
      }
      return;
    }

    const copy: EditorWorkingCopy = {
      name: result.project.name,
      metadata: result.project.metadata,
      implementations: result.project.implementations,
      // Snapshots restore project_json only; ControlRecords stay as currently saved.
      controlRecords: savedCopyRef.current.controlRecords,
    };
    historyRef.current.replace(copy);
    applyWorkingCopyToState(copy);
    revisionRef.current = result.project.revision;
    setRevision(result.project.revision);
    setUpdatedAt(result.project.updatedAt);
    savedCopyRef.current = cloneWorkingCopy(copy);
    setStatus(
      "saved",
      "Snapshot restored. A pre-restore recovery snapshot was created.",
    );
    syncHistoryFlags();
    await refreshSnapshots();
  }

  async function handleForceAutomaticSnapshot() {
    const ok = await ensurePersistedForDestructiveAction(
      "Resolve the save conflict or error before creating a snapshot.",
    );
    if (!ok) {
      return;
    }
    await createAutomaticSnapshotAction(projectId);
    await refreshSnapshots();
  }

  async function leaveToProjects(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (isDirtyAgainstSaved() || savePromiseRef.current) {
      const result = await flushSave();
      if (!result.ok || isDirtyAgainstSaved()) {
        const leave = window.confirm(
          "Some changes could not be saved. Leave this project anyway and discard unsaved edits?",
        );
        if (!leave) {
          return;
        }
      }
    }

    router.push("/projects");
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (typingGroupRef.current) {
        clearTimeout(typingGroupRef.current);
        typingGroupRef.current = null;
      }
      void flushSaveRef.current();
    };
  }, []);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (isDirtyAgainstSaved() || savePromiseRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || event.key.toLowerCase() !== "z") {
        return;
      }
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      <ProductHeader
        context={
          <span className="hidden md:inline truncate">
            {name.trim() || "Untitled project"}
          </span>
        }
        actions={<AuthenticatedHeaderActions />}
      />
      <WorkspaceHeader
        projectName={name}
        organizationName={metadata.organizationName}
        frameworkLabel={frameworkLabel}
        itemPlural={itemTerms.plural}
        revision={revision}
        autosaveStatus={autosaveStatus}
        autosaveMessage={autosaveMessage}
        canUndo={canUndo}
        canRedo={canRedo}
        onNameChange={(nextName) =>
          commitEdit({
            name: nextName,
            metadata,
            implementations,
            controlRecords,
          })
        }
        onUndo={undo}
        onRedo={redo}
        onLeaveToProjects={(event) => void leaveToProjects(event)}
        onReloadLatest={() => void reloadLatest()}
        activeTab={activeTab}
        onTabChange={selectTab}
        completion={completion}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          id="workspace-panel-overview"
          role="tabpanel"
          aria-labelledby="workspace-tab-overview"
          hidden={activeTab !== "overview"}
          className={
            activeTab === "overview"
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "hidden"
          }
        >
          {activeTab === "overview" ? (
            <ProjectOverview
              framework={framework}
              frameworkLabel={frameworkLabel}
              itemTerms={itemTerms}
              metadata={metadata}
              implementations={implementations}
              revision={revision}
              updatedAt={updatedAt}
              snapshots={snapshots}
              evidenceSummary={evidenceCoverage?.summary ?? null}
              evidenceSummaryLoading={evidenceCoverageLoading}
              onNavigate={navigateFromOverview}
              onNavigateEvidence={navigateToEvidence}
            />
          ) : null}
        </div>

        <div
          id="workspace-panel-controls"
          role="tabpanel"
          aria-labelledby="workspace-tab-controls"
          hidden={activeTab !== "controls"}
          className={
            activeTab === "controls"
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "hidden"
          }
        >
          <ControlBrowser
            projectId={projectId}
            framework={framework}
            implementations={implementations}
            onImplementationsChange={handleImplementationsChange}
            controlRecords={controlRecords}
            onControlRecordsChange={handleControlRecordsChange}
            controlReviewStatuses={controlReviewStatuses}
            onControlReviewStatusesChange={setControlReviewStatuses}
            activityRefreshToken={activityRefreshToken}
            onActivityRefresh={() => {
              setActivityRefreshToken((token) => token + 1);
              notifyNotificationsChanged();
              void syncWorkflowMutableControlFields();
            }}
            focusRequest={controlsFocus}
            onFocusRequestHandled={() => setControlsFocus(null)}
            evidenceCoverageByControlId={
              evidenceCoverage
                ? Object.fromEntries(
                    evidenceCoverage.controls.map((row) => [
                      row.controlId,
                      row,
                    ]),
                  )
                : undefined
            }
            canEditEvidence={evidenceCaps.canAssociate}
            itemTerms={itemTerms}
          />
        </div>

        <div
          id="workspace-panel-evidence"
          role="tabpanel"
          aria-labelledby="workspace-tab-evidence"
          hidden={activeTab !== "evidence"}
          className={
            activeTab === "evidence"
              ? "flex min-h-0 flex-1 flex-col overflow-hidden bg-background"
              : "hidden"
          }
        >
          {activeTab === "evidence" ? (
            <EvidenceBrowser
              projectId={projectId}
              framework={framework}
              canEdit={evidenceCaps.canCreate || evidenceCaps.canUpdate}
              canDelete={evidenceCaps.canDelete}
              canRead={evidenceCaps.canRead}
              attention={evidenceAttention}
              coverage={evidenceCoverage}
              onAttentionChange={(next) => selectTab("evidence", next)}
              onEvidenceChanged={() => {
                setActivityRefreshToken((token) => token + 1);
              }}
              onOpenControl={navigateToControl}
              itemTerms={itemTerms}
            />
          ) : null}
        </div>

        <div
          id="workspace-panel-details"
          role="tabpanel"
          aria-labelledby="workspace-tab-details"
          hidden={activeTab !== "details"}
          className={
            activeTab === "details"
              ? "min-h-0 flex-1 overflow-y-auto bg-background px-4 py-5 sm:px-6"
              : "hidden"
          }
        >
          <div className="mx-auto max-w-3xl rounded-sm border border-border bg-surface p-4 sm:p-5">
            <ProjectMetadataSection
              framework={framework}
              metadata={metadata}
              onMetadataChange={handleMetadataChange}
              implementations={implementations}
              projectName={name}
            />
          </div>
        </div>

        <div
          id="workspace-panel-history"
          role="tabpanel"
          aria-labelledby="workspace-tab-history"
          hidden={activeTab !== "history"}
          className={
            activeTab === "history"
              ? "min-h-0 flex-1 overflow-y-auto bg-background px-4 py-5 sm:px-6"
              : "hidden"
          }
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <section
              aria-labelledby="save-version-heading"
              className="rounded-sm border border-border bg-surface p-4 sm:p-5"
            >
              <h2
                id="save-version-heading"
                className="text-sm font-semibold text-foreground"
              >
                Save a version
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Named versions are immutable milestones. Snapshot now creates an
                automatic recovery point when content has changed.
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="min-w-[12rem] flex-1">
                  <label htmlFor="named-version" className="label">
                    Version name
                  </label>
                  <input
                    id="named-version"
                    type="text"
                    value={versionName}
                    onChange={(event) => setVersionName(event.target.value)}
                    placeholder="e.g. Management Review"
                    className="field mt-1"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleSaveVersion()}
                  disabled={versionName.trim() === ""}
                  className="btn btn-primary"
                >
                  Save Version
                </button>
                <button
                  type="button"
                  onClick={() => void handleForceAutomaticSnapshot()}
                  className="btn"
                  title="Creates an automatic snapshot if content changed and the throttle allows it"
                >
                  Snapshot now
                </button>
              </div>
              {versionMessage ? (
                <p className="mt-2 text-xs text-text-secondary" role="status">
                  {versionMessage}
                </p>
              ) : null}
            </section>

            <div className="rounded-sm border border-border bg-surface p-4 sm:p-5">
              <SnapshotHistoryPanel
                snapshots={snapshots}
                onRestore={(snapshotId) => void handleRestore(snapshotId)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
