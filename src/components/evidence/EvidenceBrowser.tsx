"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  EVIDENCE_STATUSES,
  EVIDENCE_TYPES,
  evidenceStatusLabel,
  evidenceTypeLabel,
  type EvidenceStatus,
  type EvidenceType,
  type EvidenceWithControlIds,
} from "@/data/evidence";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import {
  archiveEvidenceAction,
  createEvidenceAction,
  deleteDraftEvidenceAction,
  listEvidenceAction,
  updateEvidenceAction,
} from "@/app/actions/evidence";
import {
  FormField,
  FormHint,
  FormLabel,
} from "@/components/design-system/form/FormField";
import {
  SectionHeader,
  Stack,
} from "@/components/design-system/layout/primitives";

export type EvidenceBrowserProps = {
  projectId: string;
  canEdit: boolean;
  canDelete: boolean;
};

type DraftForm = {
  title: string;
  description: string;
  owner: string;
  evidenceType: EvidenceType;
  status: Exclude<EvidenceStatus, "archived">;
  collectionDate: string;
  reviewDueDate: string;
};

const emptyDraft = (): DraftForm => ({
  title: "",
  description: "",
  owner: "",
  evidenceType: "document",
  status: "draft",
  collectionDate: "",
  reviewDueDate: "",
});

export function EvidenceBrowser({
  projectId,
  canEdit,
  canDelete,
}: EvidenceBrowserProps) {
  const [items, setItems] = useState<EvidenceWithControlIds[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<DraftForm>(emptyDraft);

  const controlTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const control of FRAMEWORK_CONTROLS) {
      map.set(control.id, control.title);
    }
    return map;
  }, []);

  const reload = useCallback(() => {
    startTransition(() => {
      void (async () => {
        const listed = await listEvidenceAction(projectId, {
          includeArchived,
        });
        setItems(listed);
        setSelectedId((current) => {
          if (current && listed.some((item) => item.id === current)) {
            return current;
          }
          return listed[0]?.id ?? null;
        });
      })();
    });
  }, [projectId, includeArchived]);

  useEffect(() => {
    reload();
  }, [reload]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  function handleCreate() {
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = await createEvidenceAction({
          projectId,
          title: draft.title,
          description: draft.description,
          owner: draft.owner,
          evidenceType: draft.evidenceType,
          status: draft.status,
          collectionDate:
            draft.collectionDate.trim() === "" ? null : draft.collectionDate,
          reviewDueDate:
            draft.reviewDueDate.trim() === "" ? null : draft.reviewDueDate,
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setDraft(emptyDraft());
        setCreating(false);
        setSelectedId(result.evidence.id);
        reload();
      })();
    });
  }

  function handleSaveSelected() {
    if (!selected) {
      return;
    }
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = await updateEvidenceAction({
          projectId,
          evidenceId: selected.id,
          patch: {
            title: selected.title,
            description: selected.description,
            owner: selected.owner,
            evidenceType: selected.evidenceType,
            status: selected.status === "archived" ? "archived" : selected.status,
            collectionDate: selected.collectionDate,
            reviewDueDate: selected.reviewDueDate,
          },
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        reload();
      })();
    });
  }

  function handleArchive() {
    if (!selected) {
      return;
    }
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = await archiveEvidenceAction({
          projectId,
          evidenceId: selected.id,
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        reload();
      })();
    });
  }

  function handleDeleteDraft() {
    if (!selected) {
      return;
    }
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = await deleteDraftEvidenceAction({
          projectId,
          evidenceId: selected.id,
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setSelectedId(null);
        reload();
      })();
    });
  }

  function patchSelected(patch: Partial<EvidenceWithControlIds>) {
    if (!selectedId) {
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.id === selectedId ? { ...item, ...patch } : item,
      ),
    );
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 overflow-hidden px-4 py-5 sm:px-6">
      <SectionHeader
        title="Evidence"
        titleId="evidence-browser-heading"
        description="Project-scoped evidence records. Attach file versions in a later milestone."
      />

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
          />
          Include archived
        </label>
        {canEdit ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            onClick={() => {
              setCreating(true);
              setDraft(emptyDraft());
            }}
          >
            New evidence
          </button>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(14rem,18rem)_1fr]">
        <aside className="min-h-0 overflow-y-auto rounded-sm border border-border bg-surface">
          <ul className="divide-y divide-border">
            {items.length === 0 ? (
              <li className="px-3 py-4 text-sm text-text-muted">
                No evidence yet.
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2.5 text-left text-sm ${
                      item.id === selectedId
                        ? "bg-accent-muted text-foreground"
                        : "text-text-secondary hover:bg-surface-muted"
                    }`}
                    onClick={() => {
                      setCreating(false);
                      setSelectedId(item.id);
                    }}
                  >
                    <span className="block font-medium text-foreground">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {evidenceStatusLabel(item.status)} ·{" "}
                      {item.controlIds.length} control
                      {item.controlIds.length === 1 ? "" : "s"}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        <div className="min-h-0 overflow-y-auto rounded-sm border border-border bg-surface p-4 sm:p-5">
          {creating && canEdit ? (
            <Stack gap="md">
              <h3 className="text-sm font-semibold text-foreground">
                Create evidence
              </h3>
              <EvidenceFormFields
                value={draft}
                disabled={pending}
                onChange={setDraft}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={pending || draft.title.trim() === ""}
                  onClick={handleCreate}
                >
                  Create
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={pending}
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </button>
              </div>
            </Stack>
          ) : selected ? (
            <Stack gap="md">
              <h3 className="text-sm font-semibold text-foreground">
                {selected.title}
              </h3>
              {canEdit && selected.status !== "archived" ? (
                <>
                  <EvidenceFormFields
                    value={{
                      title: selected.title,
                      description: selected.description,
                      owner: selected.owner,
                      evidenceType: selected.evidenceType,
                      status: selected.status,
                      collectionDate: selected.collectionDate ?? "",
                      reviewDueDate: selected.reviewDueDate ?? "",
                    }}
                    disabled={pending}
                    onChange={(next) =>
                      patchSelected({
                        title: next.title,
                        description: next.description,
                        owner: next.owner,
                        evidenceType: next.evidenceType,
                        status: next.status,
                        collectionDate:
                          next.collectionDate.trim() === ""
                            ? null
                            : next.collectionDate,
                        reviewDueDate:
                          next.reviewDueDate.trim() === ""
                            ? null
                            : next.reviewDueDate,
                      })
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={pending}
                      onClick={handleSaveSelected}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={pending}
                      onClick={handleArchive}
                    >
                      Archive
                    </button>
                    {canDelete &&
                    selected.status === "draft" &&
                    selected.controlIds.length === 0 ? (
                      <button
                        type="button"
                        className="btn"
                        disabled={pending}
                        onClick={handleDeleteDraft}
                      >
                        Delete draft
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-text-muted">Status</dt>
                    <dd>{evidenceStatusLabel(selected.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Type</dt>
                    <dd>{evidenceTypeLabel(selected.evidenceType)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Description</dt>
                    <dd className="whitespace-pre-wrap text-text-secondary">
                      {selected.description.trim() || "None"}
                    </dd>
                  </div>
                </dl>
              )}

              <div>
                <h4 className="text-xs font-medium text-text-muted">
                  Linked controls
                </h4>
                {selected.controlIds.length === 0 ? (
                  <p className="mt-1 text-sm text-text-muted">
                    Not linked to any controls.
                  </p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {selected.controlIds.map((controlId) => (
                      <li key={controlId} className="text-sm text-text-secondary">
                        <span className="control-id font-medium text-foreground">
                          {controlId.toUpperCase()}
                        </span>
                        {controlTitleById.get(controlId)
                          ? ` — ${controlTitleById.get(controlId)}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                )}
                <FormHint className="mt-2">
                  Link or unlink controls from the control editor Evidence
                  section.
                </FormHint>
              </div>
            </Stack>
          ) : (
            <p className="text-sm text-text-muted">
              Select evidence to view details, or create a new record.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EvidenceFormFields({
  value,
  disabled,
  onChange,
}: {
  value: DraftForm;
  disabled: boolean;
  onChange: (next: DraftForm) => void;
}) {
  return (
    <Stack gap="sm">
      <FormField>
        <FormLabel htmlFor="evidence-title">Title</FormLabel>
        <input
          id="evidence-title"
          className="field mt-1"
          value={value.title}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, title: event.target.value })
          }
        />
      </FormField>
      <FormField>
        <FormLabel htmlFor="evidence-description">Description</FormLabel>
        <textarea
          id="evidence-description"
          className="field mt-1 min-h-24 resize-y"
          value={value.description}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, description: event.target.value })
          }
        />
      </FormField>
      <FormField>
        <FormLabel htmlFor="evidence-owner">Owner</FormLabel>
        <input
          id="evidence-owner"
          className="field mt-1"
          value={value.owner}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, owner: event.target.value })
          }
        />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField>
          <FormLabel htmlFor="evidence-type">Type</FormLabel>
          <select
            id="evidence-type"
            className="field mt-1"
            value={value.evidenceType}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...value,
                evidenceType: event.target.value as EvidenceType,
              })
            }
          >
            {EVIDENCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {evidenceTypeLabel(type)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField>
          <FormLabel htmlFor="evidence-status">Status</FormLabel>
          <select
            id="evidence-status"
            className="field mt-1"
            value={value.status}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...value,
                status: event.target.value as Exclude<
                  EvidenceStatus,
                  "archived"
                >,
              })
            }
          >
            {EVIDENCE_STATUSES.filter((status) => status !== "archived").map(
              (status) => (
                <option key={status} value={status}>
                  {evidenceStatusLabel(status)}
                </option>
              ),
            )}
          </select>
        </FormField>
        <FormField>
          <FormLabel htmlFor="evidence-collection-date">
            Collection date
          </FormLabel>
          <input
            id="evidence-collection-date"
            type="date"
            className="field mt-1"
            value={value.collectionDate}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, collectionDate: event.target.value })
            }
          />
        </FormField>
        <FormField>
          <FormLabel htmlFor="evidence-review-due">Review due date</FormLabel>
          <input
            id="evidence-review-due"
            type="date"
            className="field mt-1"
            value={value.reviewDueDate}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, reviewDueDate: event.target.value })
            }
          />
        </FormField>
      </div>
    </Stack>
  );
}
