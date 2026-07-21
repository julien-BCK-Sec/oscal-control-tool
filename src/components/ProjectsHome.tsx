"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  createProjectAction,
  deleteProjectAction,
  renameProjectAction,
} from "@/app/actions/projects";
import { LegacyMigrationBanner } from "@/components/LegacyMigrationBanner";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FRAMEWORK } from "@/data/framework";
import { formatCompletionCount, type CompletionProgress } from "@/domain";
import { formatSnapshotTimestamp } from "@/components/projectHistory/presentation";
import type { ProjectSummary } from "@/persistence/types";

export type ProjectListItem = ProjectSummary & {
  completion: CompletionProgress;
};

export type ProjectsHomeProps = {
  projects: ProjectListItem[];
};

export function ProjectsHome({ projects: initialProjects }: ProjectsHomeProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [name, setName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refreshList() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const project = await createProjectAction({ name });
      setName("");
      setShowCreate(false);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project.");
    }
  }

  async function handleRename(projectId: string, currentName: string) {
    const next = window.prompt("Rename project", currentName);
    if (next === null) {
      return;
    }
    const trimmed = next.trim();
    if (!trimmed || trimmed === currentName) {
      return;
    }
    const updated = await renameProjectAction(projectId, trimmed);
    if (!updated) {
      setError("Rename failed. Try again after reloading.");
      return;
    }
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              name: updated.name,
              updatedAt: updated.updatedAt,
              revision: updated.revision,
            }
          : project,
      ),
    );
    await refreshList();
  }

  async function handleDelete(projectId: string, projectName: string) {
    const confirmed = window.confirm(
      `Delete project “${projectName}”? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }
    await deleteProjectAction(projectId);
    setProjects((current) => current.filter((project) => project.id !== projectId));
    await refreshList();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto bg-background px-4 py-8 text-foreground sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-text-secondary">
            Local NIST SP 800-53 Rev. 5 Moderate documentation projects stored in
            SQLite on this machine.
          </p>
        </div>
        {!showCreate ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreate(true)}
          >
            New project
          </button>
        ) : null}
      </header>

      <LegacyMigrationBanner
        onImported={(projectId) => {
          router.push(`/projects/${projectId}`);
        }}
      />

      {showCreate ? (
        <form
          onSubmit={(event) => void handleCreate(event)}
          className="rounded-sm border border-border bg-surface p-4"
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[16rem] flex-1">
              <label htmlFor="new-project-name" className="label">
                New project name
              </label>
              <input
                id="new-project-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
                className="field mt-1.5"
              />
            </div>
            <button
              type="submit"
              disabled={pending || name.trim() === ""}
              className="btn btn-primary"
            >
              Create project
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowCreate(false);
                setName("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="recent-projects-heading">
        <h2
          id="recent-projects-heading"
          className="text-sm font-semibold text-foreground"
        >
          Recent projects
        </h2>
        {projects.length === 0 ? (
          <div className="mt-3 rounded-sm border border-dashed border-border-strong bg-surface px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              No projects yet
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Create a project to start documenting controls, or import a browser
              project if one is available above.
            </p>
            {!showCreate ? (
              <button
                type="button"
                className="btn btn-primary mt-4"
                onClick={() => setShowCreate(true)}
              >
                Create project
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectCard
                  project={project}
                  onRename={() => void handleRename(project.id, project.name)}
                  onDelete={() => void handleDelete(project.id, project.name)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ProjectCard({
  project,
  onRename,
  onDelete,
}: {
  project: ProjectListItem;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-sm border border-border bg-surface p-4 shadow-[var(--shadow-subtle)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            <Link
              href={`/projects/${project.id}`}
              className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {project.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-text-secondary">
            {project.organizationName.trim() || "No organization"}
          </p>
          <p className="mt-1 text-xs text-text-muted">{FRAMEWORK.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="btn btn-primary"
          >
            Open
          </Link>
          <button type="button" onClick={onRename} className="btn">
            Rename
          </button>
          <button type="button" onClick={onDelete} className="btn btn-danger">
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 max-w-sm">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="text-text-secondary">
            {formatCompletionCount(project.completion)} controls implemented
          </span>
          <span className="tabular-nums text-text-muted">
            {project.completion.percent}%
          </span>
        </div>
        <ProgressBar
          className="mt-1.5"
          progress={project.completion}
          label={`${project.name} completion`}
        />
      </div>

      <p className="mt-3 text-xs text-text-muted">
        <span className="control-id">Revision {project.revision}</span>
        <span className="mx-1.5" aria-hidden="true">
          ·
        </span>
        Updated {formatSnapshotTimestamp(project.updatedAt)}
      </p>
    </article>
  );
}
