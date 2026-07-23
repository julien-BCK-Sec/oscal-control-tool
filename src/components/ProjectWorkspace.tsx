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
import { upsertControlRecordsAction } from "@/app/actions/control-records";
import type { ControlImplementation } from "@/data/implementation";
import {
  controlRecordsToFieldMap,
  controlRecordsToReviewStatusMap,
  type ControlRecord,
  type ControlRecordFields,
  type ControlReviewStatus,
} from "@/data/control-record";
import type { ProjectMetadata } from "@/data/project";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
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
  type WorkspaceTabId,
} from "@/components/workspace/presentation";
import type {
  ProjectSnapshotSummary,
  StoredProject,
} from "@/persistence/types";

export type ProjectWorkspaceProps = {
  initialProject: StoredProject;
  initialControlRecords: ControlRecord[];
  initialSnapshots: ProjectSnapshotSummary[];
  initialView?: WorkspaceTabId;
  /** Deep-link focus into Controls (notification / overview navigation). */
  initialFocus?: ControlsFocusRequest;
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
  initialControlRecords,
  initialSnapshots,
  initialView = DEFAULT_WORKSPACE_TAB,
  initialFocus,
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
  const frameworkId = initialProject.frameworkId;
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
    () => computeOverallCompletion(FRAMEWORK_CONTROLS, implementations),
    [implementations],
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

  function selectTab(tab: WorkspaceTabId) {
    setActiveTab(tab);
    const href =
      tab === DEFAULT_WORKSPACE_TAB ? pathname : `${pathname}?view=${tab}`;
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
              frameworkId,
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
              metadata={metadata}
              implementations={implementations}
              revision={revision}
              updatedAt={updatedAt}
              snapshots={snapshots}
              onNavigate={navigateFromOverview}
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
            implementations={implementations}
            onImplementationsChange={handleImplementationsChange}
            controlRecords={controlRecords}
            onControlRecordsChange={handleControlRecordsChange}
            controlReviewStatuses={controlReviewStatuses}
            onControlReviewStatusesChange={setControlReviewStatuses}
            activityRefreshToken={activityRefreshToken}
            onActivityRefresh={() =>
              setActivityRefreshToken((token) => token + 1)
            }
            focusRequest={controlsFocus}
            onFocusRequestHandled={() => setControlsFocus(null)}
          />
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
