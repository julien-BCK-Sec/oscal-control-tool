"use client";

import { useEffect, useState, useTransition } from "react";
import type { Assignment, AssignmentRole } from "@/data/collaboration";
import {
  completeAssignmentAction,
  createAssignmentAction,
  listAssignmentsAction,
  removeAssignmentAction,
} from "@/app/actions/assignments";
import {
  listMentionCandidatesAction,
  type MentionCandidate,
} from "@/app/actions/mention-candidates";
import { Button } from "@/components/design-system/button/Button";
import { SidebarCard } from "@/components/controlBrowser/SidebarCard";
import {
  FormField,
  FormLabel,
} from "@/components/design-system/form/FormField";
import { Stack } from "@/components/design-system/layout/primitives";

export type AssignmentControlsProps = {
  projectId: string;
  controlId: string;
  refreshToken?: number;
  onActivity?: () => void;
};

const ROLE_OPTIONS: { value: AssignmentRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "reviewer", label: "Reviewer" },
];

export function AssignmentControls({
  projectId,
  controlId,
  refreshToken = 0,
  onActivity,
}: AssignmentControlsProps) {
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [members, setMembers] = useState<MentionCandidate[]>([]);
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [assignmentRole, setAssignmentRole] =
    useState<AssignmentRole>("owner");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reload() {
    startTransition(async () => {
      try {
        const [rows, candidates] = await Promise.all([
          listAssignmentsAction(projectId, controlId),
          listMentionCandidatesAction(projectId),
        ]);
        setAssignments(rows);
        setMembers(candidates);
        if (!assigneeUserId && candidates[0]) {
          setAssigneeUserId(candidates[0].userId);
        }
        setError(null);
      } catch {
        setError("Unable to load assignments.");
        setAssignments([]);
      }
    });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, controlId, refreshToken]);

  function memberLabel(userId: string): string {
    const member = members.find((m) => m.userId === userId);
    return member ? `${member.name} (${member.email})` : userId;
  }

  return (
    <SidebarCard title="Assignments" titleId="control-assignments-heading">
      <Stack gap="sm">
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {assignments === null ? (
          <p className="text-sm text-text-muted" role="status">
            Loading…
          </p>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-text-muted">No assignments yet.</p>
        ) : (
          <ul className="space-y-2">
            {assignments.map((assignment) => (
              <li
                key={assignment.id}
                className="rounded-md border border-border px-3 py-2"
              >
                <p className="text-sm text-text-primary">
                  <span className="font-medium capitalize">
                    {assignment.assignmentRole}
                  </span>
                  {": "}
                  {memberLabel(assignment.assigneeUserId)}
                  {assignment.completedAt ? " · Completed" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {!assignment.completedAt ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await completeAssignmentAction({
                            projectId,
                            assignmentId: assignment.id,
                          });
                          if (!result.ok) {
                            setError(result.message);
                            return;
                          }
                          onActivity?.();
                          reload();
                        });
                      }}
                    >
                      Complete
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await removeAssignmentAction({
                          projectId,
                          assignmentId: assignment.id,
                        });
                        if (!result.ok) {
                          setError(result.message);
                          return;
                        }
                        onActivity?.();
                        reload();
                      });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <FormField>
          <FormLabel htmlFor={`assignment-user-${controlId}`}>
            Assign to
          </FormLabel>
          <select
            id={`assignment-user-${controlId}`}
            className="field mt-1"
            value={assigneeUserId}
            disabled={pending || members.length === 0}
            onChange={(event) => setAssigneeUserId(event.target.value)}
          >
            {members.length === 0 ? (
              <option value="">No organization members</option>
            ) : (
              members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name} ({member.email})
                </option>
              ))
            )}
          </select>
        </FormField>

        <FormField>
          <FormLabel htmlFor={`assignment-role-${controlId}`}>Role</FormLabel>
          <select
            id={`assignment-role-${controlId}`}
            className="field mt-1"
            value={assignmentRole}
            disabled={pending}
            onChange={(event) =>
              setAssignmentRole(event.target.value as AssignmentRole)
            }
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={pending || !assigneeUserId}
          onClick={() => {
            startTransition(async () => {
              const result = await createAssignmentAction({
                projectId,
                controlId,
                assigneeUserId,
                assignmentRole,
              });
              if (!result.ok) {
                setError(result.message);
                return;
              }
              onActivity?.();
              reload();
            });
          }}
        >
          Assign
        </Button>
      </Stack>
    </SidebarCard>
  );
}
