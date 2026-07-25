"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  evidenceStatusLabel,
  evidenceTypeLabel,
  type EvidenceSearchResult,
  type EvidenceType,
  type SearchEvidencePage,
  EVIDENCE_TYPES,
} from "@/data/evidence";
import { searchEvidenceAction } from "@/app/actions/evidence";
import {
  FormField,
  FormHint,
  FormLabel,
} from "@/components/design-system/form/FormField";
import { Stack } from "@/components/design-system/layout/primitives";

const SEARCH_DEBOUNCE_MS = 300;

export type EvidencePickerSearchFn = (input: {
  projectId: string;
  query: string;
  cursor: string | null;
  limit?: number;
  evidenceType?: EvidenceType;
  excludeLinkedToControlId?: string;
}) => Promise<
  | { ok: true; page: SearchEvidencePage }
  | { ok: false; message: string }
>;

async function defaultSearch(
  input: Parameters<EvidencePickerSearchFn>[0],
): Promise<ReturnType<EvidencePickerSearchFn>> {
  const result = await searchEvidenceAction({
    projectId: input.projectId,
    query: input.query,
    cursor: input.cursor,
    limit: input.limit,
    evidenceType: input.evidenceType,
    excludeLinkedToControlId: input.excludeLinkedToControlId,
    excludeArchived: true,
  });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  return { ok: true, page: result.page };
}

export type EvidencePickerProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  /** When set, server excludes Evidence already linked to this control. */
  excludeLinkedToControlId?: string;
  title?: string;
  /** Emits when the user selects a result. Parent owns association. */
  onSelect: (evidenceId: string) => void;
  /** Emits when the user chooses Create New. Parent owns creation. */
  onCreateRequested: () => void;
  /** Optional injected search (defaults to searchEvidenceAction). */
  searchFn?: EvidencePickerSearchFn;
  /** Disable selection while parent is associating. */
  selecting?: boolean;
};

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KiB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MiB`;
}

export function EvidencePicker({
  open,
  onClose,
  projectId,
  excludeLinkedToControlId,
  title = "Link evidence",
  onSelect,
  onCreateRequested,
  searchFn = defaultSearch,
  selecting = false,
}: EvidencePickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const requestIdRef = useRef(0);
  const titleId = useId();
  const statusId = useId();
  const listId = useId();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<EvidenceType | "">("");
  const [items, setItems] = useState<EvidenceSearchResult[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query]);

  const runSearch = useCallback(
    async (mode: "replace" | "append", cursor: string | null) => {
      const requestId = ++requestIdRef.current;
      if (mode === "replace") {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const result = await searchFn({
          projectId,
          query: debouncedQuery,
          cursor,
          evidenceType: typeFilter || undefined,
          excludeLinkedToControlId,
        });
        if (requestId !== requestIdRef.current) {
          return;
        }
        if (!result.ok) {
          setError(result.message);
          if (mode === "replace") {
            setItems([]);
            setNextCursor(null);
            setHasMore(false);
          }
          return;
        }
        setItems((current) =>
          mode === "append"
            ? [...current, ...result.page.items]
            : result.page.items,
        );
        setNextCursor(result.page.nextCursor);
        setHasMore(result.page.hasMore);
        setActiveIndex(0);
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setError("Search failed. Try again.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [
      searchFn,
      projectId,
      debouncedQuery,
      typeFilter,
      excludeLinkedToControlId,
    ],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    void runSearch("replace", null);
  }, [open, debouncedQuery, typeFilter, runSearch]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open) {
      previouslyFocused.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      if (!dialog.open) {
        dialog.showModal();
      }
      window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    function handleClose() {
      onClose();
      const prior = previouslyFocused.current;
      if (prior && typeof prior.focus === "function") {
        window.setTimeout(() => prior.focus(), 0);
      }
    }
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
      setTypeFilter("");
      setItems([]);
      setNextCursor(null);
      setHasMore(false);
      setError(null);
      setActiveIndex(0);
      requestIdRef.current += 1;
    }
  }, [open]);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Escape") {
      // Native dialog already closes on Escape; ensure parent state syncs.
      return;
    }
    if (items.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && !selecting) {
      const item = items[activeIndex];
      if (item && document.activeElement?.getAttribute("role") === "option") {
        event.preventDefault();
        onSelect(item.id);
      }
    }
  }

  const statusMessage = loading
    ? "Searching evidence…"
    : error
      ? error
      : items.length === 0
        ? debouncedQuery
          ? "No evidence matches your search."
          : "No eligible evidence yet. Create new evidence to get started."
        : `${items.length} result${items.length === 1 ? "" : "s"}${hasMore ? ", more available" : ""}`;

  return (
    <dialog
      ref={dialogRef}
      className="evidence-picker-dialog w-[min(32rem,calc(100vw-2rem))] max-h-[min(36rem,calc(100vh-2rem))] rounded-sm border border-border bg-surface p-0 text-foreground shadow-lg open:flex open:flex-col"
      aria-labelledby={titleId}
      onKeyDown={handleDialogKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-sm font-semibold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onClose}
            aria-label="Close evidence picker"
          >
            Close
          </button>
        </div>
        <p className="mt-1 text-xs text-text-muted">
          Search project evidence and select a record to link. File versions are
          managed on the Evidence tab.
        </p>
      </div>

      <div className="space-y-3 border-b border-border px-4 py-3">
        <FormField>
          <FormLabel htmlFor={`${titleId}-search`}>Search</FormLabel>
          <input
            ref={searchInputRef}
            id={`${titleId}-search`}
            type="search"
            className="field mt-1"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title, owner, description, or filename"
            autoComplete="off"
            aria-controls={listId}
            aria-describedby={statusId}
          />
        </FormField>
        <FormField>
          <FormLabel htmlFor={`${titleId}-type`}>Type</FormLabel>
          <select
            id={`${titleId}-type`}
            className="field mt-1"
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as EvidenceType | "")
            }
          >
            <option value="">All types</option>
            {EVIDENCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {evidenceTypeLabel(type)}
              </option>
            ))}
          </select>
        </FormField>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onCreateRequested}
            disabled={selecting}
          >
            Create new evidence
          </button>
          {query ? (
            <button
              type="button"
              className="btn"
              onClick={() => setQuery("")}
              disabled={loading}
            >
              Clear search
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <p id={statusId} className="sr-only" aria-live="polite">
          {statusMessage}
        </p>
        {error ? (
          <div className="px-2 py-2" role="alert">
            <p className="text-sm text-danger">{error}</p>
            <button
              type="button"
              className="btn btn-sm mt-2"
              onClick={() => void runSearch("replace", null)}
            >
              Retry
            </button>
          </div>
        ) : null}

        {!error && loading ? (
          <p className="px-2 py-3 text-sm text-text-muted">Searching…</p>
        ) : null}

        {!error && !loading && items.length === 0 ? (
          <Stack gap="sm" className="px-2 py-3">
            <p className="text-sm text-text-muted">{statusMessage}</p>
            <FormHint>
              Create new evidence remains available when nothing matches.
            </FormHint>
          </Stack>
        ) : null}

        {!error && items.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            aria-label="Evidence search results"
            className="space-y-1"
          >
            {items.map((item, index) => {
              const selected = index === activeIndex;
              return (
                <li key={item.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`w-full rounded-sm px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                      selected
                        ? "bg-accent-muted text-foreground"
                        : "text-text-secondary hover:bg-surface-muted"
                    }`}
                    disabled={selecting}
                    onClick={() => onSelect(item.id)}
                    onFocus={() => setActiveIndex(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(item.id);
                      }
                    }}
                  >
                    <span className="block text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {evidenceTypeLabel(item.evidenceType)} ·{" "}
                      {evidenceStatusLabel(item.status)}
                      {item.owner.trim() ? ` · ${item.owner}` : ""}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {item.currentVersion
                        ? `${item.currentVersion.originalFilename} · ${formatBytes(item.currentVersion.sizeBytes)}`
                        : "No file uploaded yet"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {!error && hasMore ? (
          <div className="px-2 py-2">
            <button
              type="button"
              className="btn w-full"
              disabled={loadingMore || selecting}
              onClick={() => void runSearch("append", nextCursor)}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
