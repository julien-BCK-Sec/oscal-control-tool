"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createProjectAction,
  deleteProjectAction,
  renameProjectAction,
} from "@/app/actions/projects";
import { LegacyMigrationBanner } from "@/components/LegacyMigrationBanner";
import type { ProjectSummary } from "@/persistence/types";

export type ProjectsHomeProps = {
  projects: ProjectSummary[];
};

export function ProjectsHome({ projects: initialProjects }: ProjectsHomeProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refreshList() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const project = await createProjectAction({ name });
      setName("");
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
          ? { ...project, name: updated.name, updatedAt: updated.updatedAt, revision: updated.revision }
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
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 overflow-y-auto px-4 py-10 sm:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Projects
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Database-backed NIST SP 800-53 Rev. 5 Moderate documentation projects.
          Data is stored locally in SQLite on this machine.
        </p>
      </header>

      <LegacyMigrationBanner
        onImported={(projectId) => {
          router.push(`/projects/${projectId}`);
        }}
      />

      <form
        onSubmit={(event) => void handleCreate(event)}
        className="flex flex-wrap items-end gap-3 border-b border-zinc-200 pb-8"
      >
        <div className="min-w-[16rem] flex-1">
          <label
            htmlFor="new-project-name"
            className="block text-sm font-medium text-zinc-800"
          >
            New project name
          </label>
          <input
            id="new-project-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-1.5 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={pending || name.trim() === ""}
          className="rounded border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-zinc-800 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Create project
        </button>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="recent-projects-heading">
        <h2
          id="recent-projects-heading"
          className="text-sm font-semibold text-zinc-900"
        >
          Recent projects
        </h2>
        {projects.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No projects yet. Create one to start documenting controls.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 border border-zinc-200">
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium text-zinc-900 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                  >
                    {project.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {project.organizationName
                      ? `${project.organizationName} · `
                      : null}
                    Updated {new Date(project.updatedAt).toLocaleString()} ·
                    rev {project.revision}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRename(project.id, project.name)}
                    className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(project.id, project.name)}
                    className="rounded border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
