"use client";

import { useEffect, useState } from "react";
import { listControlActivitiesAction } from "@/app/actions/control-records";
import {
  formatControlActivitySummary,
  formatControlActivityTimestamp,
  type ControlActivity,
} from "@/data/control-activity";

export type ControlActivityHistoryProps = {
  projectId: string;
  controlId: string;
  /** Bump after a successful metadata save so History remounts/reloads. */
  refreshToken?: number;
};

function ControlActivityHistoryBody({
  projectId,
  controlId,
}: {
  projectId: string;
  controlId: string;
}) {
  const [activities, setActivities] = useState<ControlActivity[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listControlActivitiesAction(projectId, controlId)
      .then((rows) => {
        if (!cancelled) {
          setActivities(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setActivities([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, controlId]);

  return (
    <section className="max-w-3xl" aria-labelledby="control-history-heading">
      <h3
        id="control-history-heading"
        className="text-xs font-medium uppercase tracking-wide text-text-muted"
      >
        History
      </h3>
      <p className="mt-1 text-xs text-text-muted">
        Operational activity for this control — independent of named project
        versions.
      </p>

      {activities === null ? (
        <p className="mt-3 text-sm text-text-muted" role="status">
          Loading history…
        </p>
      ) : activities.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">
          No activity yet. Changes to control metadata will appear here.
        </p>
      ) : (
        <ol className="mt-3 space-y-3 border-l border-border pl-3">
          {activities.map((activity) => (
            <li key={activity.id} className="relative">
              <span
                className="absolute -left-[0.85rem] top-1.5 h-2 w-2 rounded-full bg-border-strong"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground">
                {formatControlActivitySummary(activity)}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                <time dateTime={activity.createdAt}>
                  {formatControlActivityTimestamp(activity.createdAt)}
                </time>
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function ControlActivityHistory({
  projectId,
  controlId,
  refreshToken = 0,
}: ControlActivityHistoryProps) {
  return (
    <ControlActivityHistoryBody
      key={`${controlId}:${refreshToken}`}
      projectId={projectId}
      controlId={controlId}
    />
  );
}
