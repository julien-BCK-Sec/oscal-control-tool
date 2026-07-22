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
import { signOut } from "@/auth/client";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/design-system/button/Button";
import {
  AppShell,
  PageContent,
  ProductHeader,
} from "@/components/design-system/layout/AppShell";
import { NotificationCenter } from "@/components/collaboration/NotificationCenter";
import { EmptyState } from "@/components/design-system/layout/primitives";
import {
  Card,
  CardContent,
} from "@/components/design-system/card/Card";
import { FRAMEWORK } from "@/data/framework";
import { formatCompletionCount, type CompletionProgress } from "@/domain";
import { formatSnapshotTimestamp } from "@/components/projectHistory/presentation";
import type { ProjectSummary } from "@/persistence/types";

export type ProjectListItem = ProjectSummary & {
  completion: CompletionProgress;
};

export type ProjectsHomeAccount = {
  name: string;
  email: string;
  organizationName: string;
  organizationId: string;
  canManageMembers: boolean;
};

export type ProjectsHomeProps = {
  projects: ProjectListItem[];
  /** When false, project creation controls are hidden (server still enforces). */
  canCreate?: boolean;
  account?: ProjectsHomeAccount;
};

export function ProjectsHome({
  projects: initialProjects,
  canCreate = true,
  account,
}: ProjectsHomeProps) {
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
    <AppShell header={<ProductHeader actions={<NotificationCenter />} />}>
      <PageContent narrow>
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
        <div className="flex flex-col items-end gap-2">
          {account ? (
            <AccountBar account={account} />
          ) : null}
          {canCreate && !showCreate ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowCreate(true)}
            >
              New project
            </Button>
          ) : null}
        </div>
      </header>

      <LegacyMigrationBanner
        onImported={(projectId) => {
          router.push(`/projects/${projectId}`);
        }}
      />

      {showCreate ? (
        <form
          onSubmit={(event) => void handleCreate(event)}
          className="rounded-md border border-border bg-surface p-4"
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
            <Button
              type="submit"
              variant="primary"
              disabled={pending || name.trim() === ""}
            >
              Create project
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setName("");
              }}
            >
              Cancel
            </Button>
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
          <EmptyState
            className="mt-3"
            title="No projects yet"
            description="Create a project to start documenting controls, or import a browser project if one is available above."
            action={
              canCreate && !showCreate ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setShowCreate(true)}
                >
                  Create project
                </Button>
              ) : null
            }
          />
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
      </PageContent>
    </AppShell>
  );
}

function AccountBar({ account }: { account: ProjectsHomeAccount }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-text-secondary">
      <span className="min-w-0 truncate">
        <span className="font-medium text-foreground">{account.name}</span>
        {" · "}
        {account.organizationName}
      </span>
      {account.canManageMembers ? (
        <Link
          href={`/organizations/${account.organizationId}/settings`}
          className="underline underline-offset-2 hover:text-foreground"
        >
          Team
        </Link>
      ) : null}
      <Button
        type="button"
        variant="default"
        onClick={() => {
          void signOut().then(() => router.push("/sign-in"));
        }}
      >
        Sign out
      </Button>
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
    <Card
      as="article"
      variant="surface"
    >
      <CardContent>
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
          <Link href={`/projects/${project.id}`} className="btn btn-primary">
            Open
          </Link>
          <Button type="button" onClick={onRename}>
            Rename
          </Button>
          <Button type="button" variant="danger" onClick={onDelete}>
            Delete
          </Button>
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
      </CardContent>
    </Card>
  );
}
