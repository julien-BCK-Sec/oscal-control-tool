"use client";

import type { ReactNode } from "react";
import type { ProjectSnapshotSummary } from "@/persistence/types";
import {
  formatSnapshotHistorySecondary,
  formatSnapshotHistoryTitle,
  formatSnapshotTimestamp,
  isRestorableSnapshot,
  partitionSnapshotsForHistory,
} from "@/components/projectHistory/presentation";

export type SnapshotHistoryPanelProps = {
  snapshots: ProjectSnapshotSummary[];
  onRestore: (snapshotId: string) => void;
};

function HistoryRow({
  snapshot,
  onRestore,
  emphasis,
}: {
  snapshot: ProjectSnapshotSummary;
  onRestore: (snapshotId: string) => void;
  emphasis: "named" | "automatic" | "recovery";
}) {
  const rowClass =
    emphasis === "named"
      ? "border-amber-200 bg-amber-50"
      : emphasis === "recovery"
        ? "border-sky-200 bg-sky-50"
        : "border-zinc-200 bg-white";

  return (
    <li
      className={`flex items-center justify-between gap-3 rounded border px-3 py-2 text-sm ${rowClass}`}
    >
      <div className="min-w-0">
        <p className="font-medium text-zinc-900">
          {formatSnapshotHistoryTitle(snapshot)}
        </p>
        <p className="mt-0.5 text-xs text-zinc-600">
          {formatSnapshotTimestamp(snapshot.createdAt)}
        </p>
        <p className="text-xs text-zinc-500">
          {formatSnapshotHistorySecondary(snapshot)}
        </p>
      </div>
      {isRestorableSnapshot(snapshot) ? (
        <button
          type="button"
          onClick={() => onRestore(snapshot.id)}
          className="shrink-0 rounded border border-zinc-400 bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Restore
        </button>
      ) : null}
    </li>
  );
}

function Section({
  title,
  headingId,
  description,
  children,
  emptyLabel,
  isEmpty,
}: {
  title: string;
  headingId: string;
  description: string;
  children: ReactNode;
  emptyLabel: string;
  isEmpty: boolean;
}) {
  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="text-xs font-semibold uppercase tracking-wide text-zinc-600"
      >
        {title}
      </h3>
      <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      {isEmpty ? (
        <p className="mt-2 text-xs text-zinc-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-2 space-y-2">{children}</ul>
      )}
    </section>
  );
}

/**
 * Project history with Restore on each entry.
 * Snapshots must already be scoped to the open project by the caller.
 * Lists scroll with the surrounding page/tab rather than a tiny fixed viewport.
 */
export function SnapshotHistoryPanel({
  snapshots,
  onRestore,
}: SnapshotHistoryPanelProps) {
  const { namedVersions, automaticSnapshots, recoverySnapshots } =
    partitionSnapshotsForHistory(snapshots);

  return (
    <div role="region" aria-label="Project version history">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          Version history
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Named versions and automatic snapshots for this project. Restore
          replaces the working copy after saving a recovery snapshot. Project
          revision is a save counter, not a version name.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Named versions"
          headingId="named-versions-heading"
          description="User-created milestones (immutable)."
          emptyLabel="No named versions yet. Use Save Version above."
          isEmpty={namedVersions.length === 0}
        >
          {namedVersions.map((snapshot) => (
            <HistoryRow
              key={snapshot.id}
              snapshot={snapshot}
              onRestore={onRestore}
              emphasis="named"
            />
          ))}
        </Section>

        <Section
          title="Automatic snapshots"
          headingId="automatic-snapshots-heading"
          description="Periodic recovery points from editing."
          emptyLabel="No automatic snapshots yet."
          isEmpty={automaticSnapshots.length === 0}
        >
          {automaticSnapshots.map((snapshot) => (
            <HistoryRow
              key={snapshot.id}
              snapshot={snapshot}
              onRestore={onRestore}
              emphasis="automatic"
            />
          ))}
        </Section>

        <Section
          title="Recovery snapshots"
          headingId="recovery-snapshots-heading"
          description="Saved automatically before a restore."
          emptyLabel="No recovery snapshots yet."
          isEmpty={recoverySnapshots.length === 0}
        >
          {recoverySnapshots.map((snapshot) => (
            <HistoryRow
              key={snapshot.id}
              snapshot={snapshot}
              onRestore={onRestore}
              emphasis="recovery"
            />
          ))}
        </Section>
      </div>
    </div>
  );
}
