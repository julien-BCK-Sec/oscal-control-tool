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
import {
  createNamedVersionAction,
  createAutomaticSnapshotAction,
  listSnapshotsAction,
  restoreSnapshotAction,
  saveProjectAction,
} from "@/app/actions/projects";
import type { ControlImplementation } from "@/data/implementation";
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
  initialSnapshots: ProjectSnapshotSummary[];
  initialView?: WorkspaceTabId;
};

type FlushSaveResult =
  | { ok: true }
  | { ok: false; reason: "conflict" | "error" };

function initialWorkingCopy(project: StoredProject): EditorWorkingCopy {
  return {
    name: project.name,
    metadata: project.metadata,
    implementations: project.implementations,
  };
}

export function ProjectWorkspace({
  initialProject,
  initialSnapshots,
  initialView = DEFAULT_WORKSPACE_TAB,
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [name, setName] = useState(initialProject.name);
  const [metadata, setMetadata] = useState(initialProject.metadata);
  const [implementations, setImplementations] = useState(
    initialProject.implementations,
  );
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
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>(initialView);
  const [controlsFocus, setControlsFocus] =
    useState<ControlsFocusRequest | null>(null);

  const historyRef = useRef(new EditorHistory(initialWorkingCopy(initialProject)));
  const savedCopyRef = useRef(
    cloneWorkingCopy(initialWorkingCopy(initialProject)),
  );
  const workingCopyRef = useRef(
    cloneWorkingCopy(initialWorkingCopy(initialProject)),
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

        try {
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
          savedCopyRef.current = cloneWorkingCopy({
            name: result.project.name,
            metadata: result.project.metadata,
            implementations: result.project.implementations,
          });

          await refreshSnapshots();

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
    });
  }

  function handleImplementationsChange(
    next: Record<string, ControlImplementation>,
  ) {
    commitEdit({
      name: workingCopyRef.current.name,
      metadata: workingCopyRef.current.metadata,
      implementations: next,
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
            implementations={implementations}
            onImplementationsChange={handleImplementationsChange}
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
