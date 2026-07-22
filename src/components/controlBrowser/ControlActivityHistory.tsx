"use client";

import { useEffect, useState } from "react";
import { listControlActivitiesAction } from "@/app/actions/control-records";
import {
  formatControlActivitySummary,
  formatControlActivityTimestamp,
  type ControlActivity,
} from "@/data/control-activity";
import { SidebarCard } from "@/components/controlBrowser/SidebarCard";

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
    <SidebarCard title="History" titleId="control-history-heading">
      {activities === null ? (
        <p className="text-sm text-text-muted" role="status">
          Loading…
        </p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-text-muted">No activity yet.</p>
      ) : (
        <ol className="max-h-56 space-y-2.5 overflow-y-auto overscroll-contain pr-1">
          {activities.map((activity) => (
            <li key={activity.id} className="min-w-0">
              <p className="text-[13px] leading-snug text-foreground">
                {formatControlActivitySummary(activity)}
              </p>
              <p className="mt-0.5 text-[11px] text-text-muted">
                <time dateTime={activity.createdAt}>
                  {formatControlActivityTimestamp(activity.createdAt)}
                </time>
              </p>
            </li>
          ))}
        </ol>
      )}
    </SidebarCard>
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
