"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState, useTransition } from "react";
import {
  EVIDENCE_TYPES,
  deriveEvidenceFreshness,
  evidenceStatusLabel,
  evidenceTypeLabel,
  formatControlEvidenceCoverageCaption,
  utcTodayIsoDate,
  type ControlEvidenceCoverage,
  type EvidenceType,
  type EvidenceWithControlIds,
} from "@/data/evidence";
import {
  associateEvidenceAction,
  createEvidenceAction,
  dissociateEvidenceAction,
  listEvidenceAction,
} from "@/app/actions/evidence";
import { EvidencePicker } from "@/components/evidence/EvidencePicker";
import {
  EvidenceCoverageBadge,
  EvidenceFreshnessBadge,
} from "@/components/design-system/badge/statusMaps";
import {
  FormField,
  FormHint,
  FormLabel,
} from "@/components/design-system/form/FormField";
import { Stack } from "@/components/design-system/layout/primitives";
import { buildProjectEvidenceHref } from "@/components/workspace/presentation";

export type ControlEvidencePanelProps = {
  projectId: string;
  controlId: string;
  refreshToken: number;
  canEdit: boolean;
  coverage?: ControlEvidenceCoverage | null;
  onActivity?: () => void;
  itemSingular?: string;
};

export function ControlEvidencePanel({
  projectId,
  controlId,
  refreshToken,
  canEdit,
  coverage = null,
  onActivity,
  itemSingular = "control",
}: ControlEvidencePanelProps) {
  const [items, setItems] = useState<EvidenceWithControlIds[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("document");
  const createHeadingId = useId();

  const reload = useCallback(() => {
    startTransition(() => {
      void (async () => {
        const linked = await listEvidenceAction(projectId, {
          controlId,
          includeArchived: false,
        });
        setItems(linked);
      })();
    });
  }, [projectId, controlId]);

  useEffect(() => {
    reload();
  }, [reload, refreshToken]);

  function handleSelect(evidenceId: string) {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        const result = await associateEvidenceAction({
          projectId,
          evidenceId,
          controlId,
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setPickerOpen(false);
        setSuccess("Evidence linked.");
        reload();
        onActivity?.();
      })();
    });
  }

  function handleCreate() {
    setError(null);
    setSuccess(null);
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
        setPickerOpen(false);
        setSuccess("Evidence created and linked.");
        reload();
        onActivity?.();
      })();
    });
  }

  function handleDissociate(evidenceId: string) {
    setError(null);
    setSuccess(null);
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
        Logical evidence records linked to this {itemSingular}. Open a linked
        record from its title to inspect metadata, versions, and files on
        the project Evidence tab. Draft Evidence does not satisfy coverage;
        active Evidence without a file still does.
      </p>
      {coverage ? (
        <div className="mt-2">
          <EvidenceCoverageBadge
            state={coverage.coverageState}
            label={formatControlEvidenceCoverageCaption(coverage)}
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-2 text-xs text-text-secondary" role="status">
          {success}
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
                <p className="text-sm font-medium">
                  <Link
                    href={buildProjectEvidenceHref(projectId, item.id)}
                    scroll={false}
                    className="text-accent underline underline-offset-2 hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    aria-label={`View evidence: ${item.title}`}
                  >
                    {item.title}
                  </Link>
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                  <span>
                    {evidenceTypeLabel(item.evidenceType)} ·{" "}
                    {evidenceStatusLabel(item.status)}
                    {item.owner.trim() ? ` · ${item.owner}` : ""}
                    {item.currentVersionId
                      ? " · file attached"
                      : " · no file yet"}
                  </span>
                  <EvidenceFreshnessBadge
                    freshness={deriveEvidenceFreshness(
                      item.reviewDueDate,
                      utcTodayIsoDate(),
                    )}
                  />
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
          <button
            type="button"
            className="btn"
            disabled={pending}
            onClick={() => {
              setError(null);
              setSuccess(null);
              setPickerOpen(true);
            }}
          >
            Link evidence
          </button>
          <FormHint>
            Opens a searchable picker of eligible project evidence. Already
            linked and archived records are excluded.
          </FormHint>
        </Stack>
      ) : null}

      <EvidencePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        projectId={projectId}
        excludeLinkedToControlId={controlId}
        selecting={pending}
        onSelect={handleSelect}
        onCreateRequested={() => {
          setShowCreate(true);
          setPickerOpen(false);
        }}
      />

      {showCreate && canEdit ? (
        <div
          className="mt-3 rounded-sm border border-border bg-surface p-3"
          role="region"
          aria-labelledby={createHeadingId}
        >
          <h4
            id={createHeadingId}
            className="text-sm font-medium text-foreground"
          >
            Create new evidence
          </h4>
          <FormField className="mt-2">
            <FormLabel htmlFor={`new-evidence-title-${controlId}`}>
              Title
            </FormLabel>
            <input
              id={`new-evidence-title-${controlId}`}
              className="field mt-1"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={pending}
              autoFocus
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
          <FormHint className="mt-2">
            Creates active evidence and links it to this {itemSingular}.
          </FormHint>
        </div>
      ) : null}
    </section>
  );
}
