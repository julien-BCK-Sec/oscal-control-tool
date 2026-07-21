import Link from "next/link";
import type { MouseEvent } from "react";
import type { CompletionProgress } from "@/domain";
import { formatCompletionCount } from "@/domain";
import type { AutosaveStatus } from "@/editor/history";
import { SaveStatus } from "@/components/ui/SaveStatus";
import { formatProjectRevisionLabel } from "@/components/projectHistory/presentation";
import {
  WORKSPACE_TABS,
  type WorkspaceTabId,
} from "@/components/workspace/presentation";

export type WorkspaceHeaderProps = {
  projectName: string;
  organizationName: string;
  revision: number;
  autosaveStatus: AutosaveStatus;
  autosaveMessage: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onNameChange: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onLeaveToProjects: (event: MouseEvent<HTMLAnchorElement>) => void;
  onReloadLatest?: () => void;
  activeTab: WorkspaceTabId;
  onTabChange: (tab: WorkspaceTabId) => void;
  completion?: CompletionProgress;
};

export function WorkspaceHeader({
  projectName,
  organizationName,
  revision,
  autosaveStatus,
  autosaveMessage,
  canUndo,
  canRedo,
  onNameChange,
  onUndo,
  onRedo,
  onLeaveToProjects,
  onReloadLatest,
  activeTab,
  onTabChange,
  completion,
}: WorkspaceHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted"
          >
            <Link
              href="/projects"
              onClick={(event) => onLeaveToProjects(event)}
              className="text-text-secondary underline-offset-2 hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              Projects
            </Link>
            <span aria-hidden="true">/</span>
            <span className="truncate text-text-secondary">
              {projectName.trim() || "Untitled project"}
            </span>
          </nav>

          <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <label htmlFor="project-display-name" className="sr-only">
              Project name
            </label>
            <input
              id="project-display-name"
              type="text"
              value={projectName}
              onChange={(event) => onNameChange(event.target.value)}
              className="min-w-0 max-w-full flex-1 border-0 bg-transparent p-0 text-lg font-semibold tracking-tight text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:max-w-xl"
            />
            {organizationName.trim() ? (
              <span className="hidden truncate text-sm text-text-secondary lg:inline">
                {organizationName}
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
            <span className="control-id text-text-secondary">
              {formatProjectRevisionLabel(revision)}
            </span>
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
            <SaveStatus status={autosaveStatus} message={autosaveMessage} />
            {completion ? (
              <>
                <span aria-hidden="true" className="text-border-strong">
                  ·
                </span>
                <span className="text-text-secondary">
                  {formatCompletionCount(completion)} implemented
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="btn"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="btn"
          >
            Redo
          </button>
          {autosaveStatus === "conflict" && onReloadLatest ? (
            <button
              type="button"
              onClick={onReloadLatest}
              className="btn btn-danger"
            >
              Reload latest
            </button>
          ) : null}
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Project workspace"
        className="flex flex-wrap gap-0 border-t border-border px-2 sm:px-4"
      >
        {WORKSPACE_TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={tab.tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={tab.panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={
                selected
                  ? "border-b-2 border-foreground px-3 py-2.5 text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
                  : "border-b-2 border-transparent px-3 py-2.5 text-sm text-text-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
