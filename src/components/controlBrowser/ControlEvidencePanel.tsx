"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  EVIDENCE_TYPES,
  evidenceStatusLabel,
  evidenceTypeLabel,
  type EvidenceType,
  type EvidenceWithControlIds,
} from "@/data/evidence";
import {
  associateEvidenceAction,
  createEvidenceAction,
  dissociateEvidenceAction,
  listEvidenceAction,
} from "@/app/actions/evidence";
import {
  FormField,
  FormHint,
  FormLabel,
} from "@/components/design-system/form/FormField";
import { Stack } from "@/components/design-system/layout/primitives";

export type ControlEvidencePanelProps = {
  projectId: string;
  controlId: string;
  refreshToken: number;
  canEdit: boolean;
  onActivity?: () => void;
};

export function ControlEvidencePanel({
  projectId,
  controlId,
  refreshToken,
  canEdit,
  onActivity,
}: ControlEvidencePanelProps) {
  const [items, setItems] = useState<EvidenceWithControlIds[]>([]);
  const [available, setAvailable] = useState<EvidenceWithControlIds[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("document");
  const [linkEvidenceId, setLinkEvidenceId] = useState("");

  const reload = useCallback(() => {
    startTransition(() => {
      void (async () => {
        const [linked, all] = await Promise.all([
          listEvidenceAction(projectId, { controlId, includeArchived: false }),
          listEvidenceAction(projectId, { includeArchived: false }),
        ]);
        setItems(linked);
        setAvailable(
          all.filter((item) => !item.controlIds.includes(controlId)),
        );
      })();
    });
  }, [projectId, controlId]);

  useEffect(() => {
    reload();
  }, [reload, refreshToken]);

  function handleCreate() {
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = await createEvidenceAction({
          projectId,
          title,
          evidenceType,
          status: "active",
          controlIds: [controlId],
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setTitle("");
        setShowCreate(false);
        reload();
        onActivity?.();
      })();
    });
  }

  function handleAssociate() {
    if (!linkEvidenceId) {
      return;
    }
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = await associateEvidenceAction({
          projectId,
          evidenceId: linkEvidenceId,
          controlId,
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setLinkEvidenceId("");
        reload();
        onActivity?.();
      })();
    });
  }

  function handleDissociate(evidenceId: string) {
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = await dissociateEvidenceAction({
          projectId,
          evidenceId,
          controlId,
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        reload();
        onActivity?.();
      })();
    });
  }

  return (
    <section
      aria-labelledby="control-evidence-heading"
      className="max-w-[var(--layout-content-max)] py-1"
    >
      <h3
        id="control-evidence-heading"
        className="text-xs font-medium text-text-muted"
      >
        Evidence
      </h3>
      <p className="mt-1 text-xs text-text-muted">
        Logical evidence records linked to this control. File uploads come in a
        later release.
      </p>

      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-3 space-y-2">
        {items.length === 0 ? (
          <li className="text-xs text-text-muted">No evidence linked yet.</li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-sm border border-border bg-surface px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {evidenceTypeLabel(item.evidenceType)} ·{" "}
                  {evidenceStatusLabel(item.status)}
                  {item.owner.trim() ? ` · ${item.owner}` : ""}
                </p>
              </div>
              {canEdit ? (
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={pending}
                  onClick={() => handleDissociate(item.id)}
                >
                  Unlink
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>

      {canEdit ? (
        <Stack gap="sm" className="mt-3">
          {available.length > 0 ? (
            <div className="flex flex-wrap items-end gap-2">
              <FormField className="min-w-[12rem] flex-1">
                <FormLabel htmlFor={`link-evidence-${controlId}`}>
                  Link existing evidence
                </FormLabel>
                <select
                  id={`link-evidence-${controlId}`}
                  className="field mt-1"
                  value={linkEvidenceId}
                  onChange={(event) => setLinkEvidenceId(event.target.value)}
                  disabled={pending}
                >
                  <option value="">Select evidence…</option>
                  {available.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </FormField>
              <button
                type="button"
                className="btn"
                disabled={pending || !linkEvidenceId}
                onClick={handleAssociate}
              >
                Link
              </button>
            </div>
          ) : null}

          {showCreate ? (
            <div className="rounded-sm border border-border bg-surface p-3">
              <FormField>
                <FormLabel htmlFor={`new-evidence-title-${controlId}`}>
                  Title
                </FormLabel>
                <input
                  id={`new-evidence-title-${controlId}`}
                  className="field mt-1"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={pending}
                />
              </FormField>
              <FormField className="mt-2">
                <FormLabel htmlFor={`new-evidence-type-${controlId}`}>
                  Type
                </FormLabel>
                <select
                  id={`new-evidence-type-${controlId}`}
                  className="field mt-1"
                  value={evidenceType}
                  onChange={(event) =>
                    setEvidenceType(event.target.value as EvidenceType)
                  }
                  disabled={pending}
                >
                  {EVIDENCE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {evidenceTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </FormField>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={pending || title.trim() === ""}
                  onClick={handleCreate}
                >
                  Create and link
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={pending}
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn"
              disabled={pending}
              onClick={() => setShowCreate(true)}
            >
              Add evidence
            </button>
          )}
          <FormHint>
            Creating evidence here marks it active and links it to this control.
          </FormHint>
        </Stack>
      ) : null}
    </section>
  );
}
