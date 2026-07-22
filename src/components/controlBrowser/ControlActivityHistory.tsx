"use client";

import { useEffect, useState, useTransition } from "react";
import { listControlActivitiesAction } from "@/app/actions/control-records";
import {
  formatControlActivitySummary,
  formatControlActivityTimestamp,
  type ControlActivity,
} from "@/data/control-activity";
import { SidebarCard } from "@/components/controlBrowser/SidebarCard";
import { Button } from "@/components/design-system/button/Button";
import { ScrollArea } from "@/components/design-system/layout/primitives";

const PAGE_SIZE = 50;

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
  const [hasMore, setHasMore] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    void listControlActivitiesAction(projectId, controlId, { limit: PAGE_SIZE })
      .then((rows) => {
        if (!cancelled) {
          setActivities(rows);
          setHasMore(rows.length === PAGE_SIZE);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setActivities([]);
          setHasMore(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, controlId]);

  function loadMore() {
    if (!activities || activities.length === 0) {
      return;
    }
    const beforeCreatedAt = activities[activities.length - 1]?.createdAt;
    startTransition(async () => {
      const rows = await listControlActivitiesAction(projectId, controlId, {
        limit: PAGE_SIZE,
        beforeCreatedAt,
      });
      setActivities((current) => [...(current ?? []), ...rows]);
      setHasMore(rows.length === PAGE_SIZE);
    });
  }

  return (
    <SidebarCard title="History" titleId="control-history-heading">
      {activities === null ? (
        <p className="text-sm text-text-muted" role="status">
          Loading…
        </p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-text-muted">No activity yet.</p>
      ) : (
        <ScrollArea>
          <ol className="space-y-2.5 pr-1">
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
          {hasMore ? (
            <div className="pt-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={pending}
                onClick={loadMore}
              >
                {pending ? "Loading…" : "Load older activity"}
              </Button>
            </div>
          ) : null}
        </ScrollArea>
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
