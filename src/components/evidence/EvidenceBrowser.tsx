"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  EVIDENCE_STATUSES,
  EVIDENCE_TYPES,
  evidenceFreshnessLabel,
  evidenceStatusLabel,
  evidenceTypeLabel,
  formatControlEvidenceCoverageCaption,
  type EvidenceSearchResult,
  type EvidenceStatus,
  type EvidenceType,
  type EvidenceWithControlIds,
  type ProjectEvidenceCoverageResult,
} from "@/data/evidence";
import type { Framework } from "@/data/framework";
import {
  archiveEvidenceAction,
  createEvidenceAction,
  deleteDraftEvidenceAction,
  getEvidenceAction,
  searchEvidenceAction,
  updateEvidenceAction,
} from "@/app/actions/evidence";
import { EvidenceVersionPanel } from "@/components/evidence/EvidenceVersionPanel";
import {
  EvidenceCoverageBadge,
  EvidenceFreshnessBadge,
} from "@/components/design-system/badge/statusMaps";
import {
  FormField,
  FormHint,
  FormLabel,
} from "@/components/design-system/form/FormField";
import {
  EmptyState,
  SectionHeader,
  Stack,
} from "@/components/design-system/layout/primitives";
import { formatControlIdDisplay } from "@/components/controlBrowser/presentation";
import type { EvidenceAttentionFilter } from "@/components/workspace/presentation";

export type EvidenceBrowserProps = {
  projectId: string;
  framework: Framework;
  canEdit: boolean;
  canDelete: boolean;
  canRead: boolean;
  attention: EvidenceAttentionFilter;
  coverage: ProjectEvidenceCoverageResult | null;
  onAttentionChange: (attention: EvidenceAttentionFilter) => void;
  onEvidenceChanged?: () => void;
  onOpenControl?: (controlId: string) => void;
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

const ATTENTION_OPTIONS: {
  id: EvidenceAttentionFilter;
  label: string;
}[] = [
  { id: "all", label: "All evidence" },
  { id: "missing", label: "Missing required" },
  { id: "due_soon", label: "Due soon" },
  { id: "overdue", label: "Overdue" },
  { id: "unlinked", label: "Unlinked" },
];

export function EvidenceBrowser({
  projectId,
  framework,
  canEdit,
  canDelete,
  canRead,
  attention,
  coverage,
  onAttentionChange,
  onEvidenceChanged,
  onOpenControl,
}: EvidenceBrowserProps) {
  const [items, setItems] = useState<EvidenceSearchResult[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EvidenceStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<EvidenceType | "">("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [hasFileFilter, setHasFileFilter] = useState<"any" | "yes" | "no">(
    "any",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] =
    useState<EvidenceWithControlIds | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<DraftForm>(emptyDraft);

  const controlTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const control of framework.controls) {
      map.set(control.id, control.title);
    }
    return map;
  }, [framework.controls]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const missingControls = useMemo(
    () =>
      (coverage?.controls ?? []).filter(
        (row) => row.coverageState === "required_missing",
      ),
    [coverage],
  );

  const searchMode = attention !== "missing";

  const loadPage = useCallback(
    (cursor: string | null, replace: boolean) => {
      if (!searchMode) {
        return;
      }
      startTransition(() => {
        void (async () => {
          const result = await searchEvidenceAction({
            projectId,
            query: debouncedQuery,
            cursor,
            status: statusFilter === "" ? undefined : statusFilter,
            evidenceType: typeFilter === "" ? undefined : typeFilter,
            owner: ownerFilter.trim() === "" ? undefined : ownerFilter,
            freshness:
              attention === "due_soon" || attention === "overdue"
                ? attention
                : undefined,
            linked: attention === "unlinked" ? false : undefined,
            hasCurrentVersion:
              hasFileFilter === "any" ? undefined : hasFileFilter === "yes",
            excludeArchived: includeArchived ? false : undefined,
          });
          if (!result.ok) {
            setError(result.message);
            return;
          }
          setError(null);
          setItems((current) =>
            replace ? result.page.items : [...current, ...result.page.items],
          );
          setNextCursor(result.page.nextCursor);
          setHasMore(result.page.hasMore);
          if (replace) {
            setSelectedId((currentId) => {
              if (
                currentId &&
                result.page.items.some((item) => item.id === currentId)
              ) {
                return currentId;
              }
              return result.page.items[0]?.id ?? null;
            });
          }
        })();
      });
    },
    [
      attention,
      debouncedQuery,
      hasFileFilter,
      includeArchived,
      ownerFilter,
      projectId,
      searchMode,
      statusFilter,
      typeFilter,
    ],
  );

  useEffect(() => {
    loadPage(null, true);
  }, [loadPage]);

  useEffect(() => {
    if (!selectedId || creating) {
      return;
    }
    const id = selectedId;
    let cancelled = false;
    startTransition(() => {
      void (async () => {
        const loaded = await getEvidenceAction(projectId, id);
        if (!cancelled) {
          setSelectedDetail(loaded);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [creating, projectId, selectedId]);

  const selected =
    creating || !selectedId || selectedDetail?.id !== selectedId
      ? null
      : selectedDetail;

  function notifyChanged() {
    onEvidenceChanged?.();
    loadPage(null, true);
  }

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
        notifyChanged();
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
            status:
              selected.status === "archived" ? "archived" : selected.status,
            collectionDate: selected.collectionDate,
            reviewDueDate: selected.reviewDueDate,
          },
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setSelectedDetail(result.evidence);
        notifyChanged();
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
        notifyChanged();
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
        notifyChanged();
      })();
    });
  }

  function patchSelected(patch: Partial<EvidenceWithControlIds>) {
    setSelectedDetail((current) =>
      current ? { ...current, ...patch } : current,
    );
  }

  if (!canRead) {
    return (
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-5 sm:px-6">
        <EmptyState
          title="Evidence is not available"
          description="You do not have permission to view Evidence in this project."
        />
      </div>
    );
  }

  const emptyCopy =
    attention === "due_soon"
      ? "No Evidence is due in the next 30 days."
      : attention === "overdue"
        ? "No Evidence is overdue."
        : attention === "unlinked"
          ? "This project has no unlinked Evidence."
          : attention === "missing"
            ? "No controls are missing required Evidence."
            : "No evidence matches the current filters.";

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 overflow-hidden px-4 py-5 sm:px-6">
      <SectionHeader
        title="Evidence"
        titleId="evidence-browser-heading"
        description="Search and filter project Evidence. Coverage counts active Evidence only; drafts are in-progress attention facts. Evidence coverage is not a compliance score."
      />

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {coverage ? (
        <p className="text-sm text-text-secondary">
          Required controls with Evidence: {coverage.summary.requiredWithEvidence}{" "}
          of {coverage.summary.requiredControls}
        </p>
      ) : null}

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Evidence attention views"
      >
        {ATTENTION_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={attention === option.id}
            className={`btn btn-sm ${
              attention === option.id ? "btn-primary" : ""
            }`}
            onClick={() => onAttentionChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {canEdit ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            onClick={() => {
              setCreating(true);
              setDraft(emptyDraft());
              onAttentionChange("all");
            }}
          >
            New evidence
          </button>
        ) : null}
        <a
          className="btn"
          href={`/api/projects/${projectId}/evidence/inventory`}
        >
          Download inventory CSV
        </a>
      </div>

      {searchMode ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField>
            <FormLabel htmlFor="evidence-search-query">Search</FormLabel>
            <input
              id="evidence-search-query"
              className="field mt-1"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Title, owner, or filename"
            />
          </FormField>
          <FormField>
            <FormLabel htmlFor="evidence-search-type">Type</FormLabel>
            <select
              id="evidence-search-type"
              className="field mt-1"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as EvidenceType | "")
              }
            >
              <option value="">Any type</option>
              {EVIDENCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {evidenceTypeLabel(type)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField>
            <FormLabel htmlFor="evidence-search-status">Status</FormLabel>
            <select
              id="evidence-search-status"
              className="field mt-1"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as EvidenceStatus | "")
              }
            >
              <option value="">Draft and active</option>
              {EVIDENCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {evidenceStatusLabel(status)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField>
            <FormLabel htmlFor="evidence-search-owner">Owner</FormLabel>
            <input
              id="evidence-search-owner"
              className="field mt-1"
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
            />
          </FormField>
          <FormField>
            <FormLabel htmlFor="evidence-search-file">Current file</FormLabel>
            <select
              id="evidence-search-file"
              className="field mt-1"
              value={hasFileFilter}
              onChange={(event) =>
                setHasFileFilter(event.target.value as "any" | "yes" | "no")
              }
            >
              <option value="any">Any</option>
              <option value="yes">Has current file</option>
              <option value="no">No current file</option>
            </select>
          </FormField>
          <label className="flex items-end gap-2 pb-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(event) => setIncludeArchived(event.target.checked)}
            />
            Include archived
          </label>
        </div>
      ) : null}

      {attention === "missing" ? (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-sm border border-border bg-surface">
          {missingControls.length === 0 ? (
            <EmptyState
              title="No missing required Evidence"
              description={emptyCopy}
            />
          ) : (
            <ul className="divide-y divide-border">
              {missingControls.map((row) => (
                <li key={row.controlId}>
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
                    onClick={() => onOpenControl?.(row.controlId)}
                  >
                    <span>
                      <span className="control-id font-medium text-foreground">
                        {formatControlIdDisplay(row.controlId)}
                      </span>
                      <span className="mt-0.5 block text-sm text-text-secondary">
                        {controlTitleById.get(row.controlId) ?? "Control"}
                      </span>
                    </span>
                    <EvidenceCoverageBadge
                      state={row.coverageState}
                      label={formatControlEvidenceCoverageCaption(row)}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(14rem,18rem)_1fr]">
          <aside className="min-h-0 overflow-y-auto rounded-sm border border-border bg-surface">
            <ul className="divide-y divide-border">
              {items.length === 0 ? (
                <li className="px-3 py-4">
                  <p className="text-sm text-text-muted">{emptyCopy}</p>
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
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                        <span>
                          {evidenceStatusLabel(item.status)} ·{" "}
                          {item.linkedControlCount} control
                          {item.linkedControlCount === 1 ? "" : "s"}
                        </span>
                        <EvidenceFreshnessBadge freshness={item.freshness} />
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            {hasMore ? (
              <div className="border-t border-border p-2">
                <button
                  type="button"
                  className="btn w-full"
                  disabled={pending || !nextCursor}
                  onClick={() => loadPage(nextCursor, false)}
                >
                  Load more
                </button>
              </div>
            ) : null}
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
                <p className="text-xs text-text-muted">
                  Freshness: {evidenceFreshnessLabel(
                    items.find((item) => item.id === selected.id)?.freshness ??
                      "no_review_date",
                  )}
                  {selected.currentVersionId
                    ? " · file attached"
                    : " · no file yet"}
                </p>
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
                        <li
                          key={controlId}
                          className="text-sm text-text-secondary"
                        >
                          <button
                            type="button"
                            className="text-left underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                            onClick={() => onOpenControl?.(controlId)}
                          >
                            <span className="control-id font-medium text-foreground">
                              {controlId.toUpperCase()}
                            </span>
                            {controlTitleById.get(controlId)
                              ? ` — ${controlTitleById.get(controlId)}`
                              : ""}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <FormHint className="mt-2">
                    Link or unlink controls from the control editor Evidence
                    section.
                  </FormHint>
                </div>

                <EvidenceVersionPanel
                  projectId={projectId}
                  evidenceId={selected.id}
                  currentVersionId={selected.currentVersionId}
                  canUpload={canEdit && selected.status !== "archived"}
                  onUploaded={notifyChanged}
                />
              </Stack>
            ) : (
              <p className="text-sm text-text-muted">
                Select evidence to view details, or create a new record.
              </p>
            )}
          </div>
        </div>
      )}
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
