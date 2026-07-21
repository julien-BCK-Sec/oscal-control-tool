"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import {
  DEFAULT_CONTROL_IMPLEMENTATION,
  type ControlImplementation,
  type ImplementationStatus,
} from "@/data/implementation";
import {
  buildControlTree,
  enhancementNumber,
  filterControlTree,
  formatControlIdDisplay,
  parentIdsWithEnhancements,
} from "@/components/controlBrowser/presentation";

const STATUS_OPTIONS: { value: ImplementationStatus; label: string }[] = [
  { value: "not-started", label: "Not Started" },
  { value: "in-progress", label: "In Progress" },
  { value: "implemented", label: "Implemented" },
  { value: "not-applicable", label: "Not Applicable" },
];

function getImplementation(
  implementations: Record<string, ControlImplementation>,
  controlId: string,
): ControlImplementation {
  return implementations[controlId] ?? DEFAULT_CONTROL_IMPLEMENTATION;
}

function statusBadge(status: ImplementationStatus): {
  symbol: string;
  label: string;
} {
  switch (status) {
    case "in-progress":
      return { symbol: "◐", label: "In Progress" };
    case "implemented":
      return { symbol: "✔", label: "Complete" };
    case "not-applicable":
      return { symbol: "–", label: "Not Applicable" };
    case "not-started":
    default:
      return { symbol: "○", label: "Not Started" };
  }
}

function toggleId(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

export type ControlBrowserProps = {
  implementations: Record<string, ControlImplementation>;
  onImplementationsChange: (
    next: Record<string, ControlImplementation>,
  ) => void;
};

export function ControlBrowser({
  implementations,
  onImplementationsChange,
}: ControlBrowserProps) {
  const fullTree = useMemo(() => buildControlTree(FRAMEWORK_CONTROLS), []);
  const defaultCollapsedParents = useMemo(
    () => new Set(parentIdsWithEnhancements(fullTree)),
    [fullTree],
  );

  const [selectedId, setSelectedId] = useState(FRAMEWORK_CONTROLS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedFamilies, setCollapsedFamilies] = useState(
    () => new Set<string>(),
  );
  const [collapsedParents, setCollapsedParents] = useState(
    () => new Set(defaultCollapsedParents),
  );
  const selectedItemRef = useRef<HTMLButtonElement | null>(null);

  const filteredTree = useMemo(
    () => filterControlTree(fullTree, searchQuery),
    [fullTree, searchQuery],
  );

  const isSearching = searchQuery.trim().length > 0;

  const selected =
    FRAMEWORK_CONTROLS.find((control) => control.id === selectedId) ??
    FRAMEWORK_CONTROLS[0];
  const implementation = getImplementation(implementations, selected.id);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedId]);

  function updateImplementation(
    controlId: string,
    patch: Partial<ControlImplementation>,
  ) {
    const current = getImplementation(implementations, controlId);
    onImplementationsChange({
      ...implementations,
      [controlId]: {
        ...current,
        ...patch,
      },
    });
  }

  function isFamilyExpanded(family: string): boolean {
    if (isSearching) {
      return true;
    }
    return !collapsedFamilies.has(family);
  }

  function isParentExpanded(parentId: string): boolean {
    if (isSearching) {
      return true;
    }
    return !collapsedParents.has(parentId);
  }

  function renderStatusBadge(controlId: string) {
    const status = getImplementation(implementations, controlId).status;
    const badge = statusBadge(status);
    return (
      <span
        className="shrink-0 font-mono text-[10px] leading-none text-zinc-400"
        title={badge.label}
        aria-label={badge.label}
      >
        {badge.symbol}
      </span>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white text-zinc-900 md:flex-row">
      <aside
        className="flex max-h-[40vh] w-full shrink-0 flex-col border-b border-zinc-200 bg-zinc-50 md:max-h-none md:h-full md:w-80 md:border-b-0 md:border-r lg:w-96"
        aria-label="Controls"
      >
        <div className="shrink-0 space-y-3 border-b border-zinc-200 px-3 py-3">
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-zinc-900">
              Controls
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              NIST SP 800-53 Rev. 5 Moderate
            </p>
          </div>
          <div>
            <label htmlFor="control-search" className="sr-only">
              Search controls
            </label>
            <input
              id="control-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by ID or title…"
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            />
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto py-2" aria-label="Control list">
          {filteredTree.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">No controls match.</p>
          ) : (
            <ul className="flex flex-col">
              {filteredTree.map((group) => {
                const familyExpanded = isFamilyExpanded(group.family);
                return (
                  <li key={group.family} className="mb-1">
                    <div className="flex items-stretch">
                      <button
                        type="button"
                        aria-expanded={familyExpanded}
                        onClick={() =>
                          setCollapsedFamilies((current) =>
                            toggleId(current, group.family),
                          )
                        }
                        className="flex w-8 shrink-0 items-center justify-center text-zinc-500 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900"
                        aria-label={
                          familyExpanded
                            ? `Collapse ${group.family}`
                            : `Expand ${group.family}`
                        }
                      >
                        <span aria-hidden="true" className="text-xs">
                          {familyExpanded ? "▼" : "▶"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedFamilies((current) =>
                            toggleId(current, group.family),
                          )
                        }
                        className="flex min-w-0 flex-1 items-center px-1 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900"
                      >
                        <span className="truncate">{group.family}</span>
                      </button>
                    </div>

                    {familyExpanded ? (
                      <ul className="pb-1">
                        {group.nodes.map((node) => {
                          const parentSelected =
                            node.control.id === selected.id;
                          const hasEnhancements =
                            node.enhancements.length > 0;
                          const parentExpanded = isParentExpanded(
                            node.control.id,
                          );

                          return (
                            <li key={node.control.id}>
                              <div className="flex items-stretch">
                                {hasEnhancements ? (
                                  <button
                                    type="button"
                                    aria-expanded={parentExpanded}
                                    onClick={() =>
                                      setCollapsedParents((current) =>
                                        toggleId(current, node.control.id),
                                      )
                                    }
                                    className="flex w-8 shrink-0 items-center justify-center text-zinc-500 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900"
                                    aria-label={
                                      parentExpanded
                                        ? `Collapse enhancements for ${formatControlIdDisplay(node.control.id)}`
                                        : `Expand enhancements for ${formatControlIdDisplay(node.control.id)}`
                                    }
                                  >
                                    <span aria-hidden="true" className="text-xs">
                                      {parentExpanded ? "▼" : "▶"}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="w-8 shrink-0" aria-hidden="true" />
                                )}
                                <button
                                  type="button"
                                  ref={
                                    parentSelected ? selectedItemRef : undefined
                                  }
                                  onClick={() => setSelectedId(node.control.id)}
                                  aria-current={
                                    parentSelected ? "true" : undefined
                                  }
                                  className={`flex min-w-0 flex-1 items-start gap-2 border-l-4 px-2 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900 ${
                                    parentSelected
                                      ? "border-zinc-900 bg-white font-medium text-zinc-900 shadow-[inset_0_0_0_1px_rgb(228_228_231)]"
                                      : "border-transparent text-zinc-700 hover:bg-zinc-100"
                                  }`}
                                >
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={`block font-mono text-xs tracking-wide ${
                                        parentSelected
                                          ? "text-zinc-800"
                                          : "text-zinc-500"
                                      }`}
                                    >
                                      {formatControlIdDisplay(node.control.id)}
                                    </span>
                                    <span className="block text-sm leading-snug">
                                      {node.control.title}
                                    </span>
                                  </span>
                                  {renderStatusBadge(node.control.id)}
                                </button>
                              </div>

                              {hasEnhancements && parentExpanded ? (
                                <ul className="mb-1 ml-8 border-l border-zinc-200">
                                  {node.enhancements.map((enhancement) => {
                                    const enhancementSelected =
                                      enhancement.id === selected.id;
                                    const number =
                                      enhancementNumber(enhancement.id) ?? "?";
                                    return (
                                      <li key={enhancement.id}>
                                        <button
                                          type="button"
                                          ref={
                                            enhancementSelected
                                              ? selectedItemRef
                                              : undefined
                                          }
                                          onClick={() =>
                                            setSelectedId(enhancement.id)
                                          }
                                          aria-current={
                                            enhancementSelected
                                              ? "true"
                                              : undefined
                                          }
                                          className={`flex w-full items-start gap-2 border-l-4 px-2 py-1.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900 ${
                                            enhancementSelected
                                              ? "border-zinc-900 bg-white font-medium text-zinc-900 shadow-[inset_0_0_0_1px_rgb(228_228_231)]"
                                              : "border-transparent text-zinc-700 hover:bg-zinc-100"
                                          }`}
                                        >
                                          <span className="min-w-0 flex-1">
                                            <span
                                              className={`font-mono text-xs ${
                                                enhancementSelected
                                                  ? "text-zinc-800"
                                                  : "text-zinc-500"
                                              }`}
                                            >
                                              ({number})
                                            </span>{" "}
                                            <span className="text-sm leading-snug">
                                              {enhancement.title}
                                            </span>
                                          </span>
                                          {renderStatusBadge(enhancement.id)}
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <p className="font-mono text-sm tracking-wide text-zinc-500">
          {formatControlIdDisplay(selected.id)}
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
          {selected.title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          <span className="font-medium text-zinc-800">Family:</span>{" "}
          {selected.family}
        </p>

        <section className="mt-8" aria-labelledby="requirement-heading">
          <h3
            id="requirement-heading"
            className="text-sm font-semibold text-zinc-900"
          >
            Requirement
          </h3>
          <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
            {selected.statement}
          </p>
        </section>

        <section
          className="mt-8 max-w-3xl"
          aria-labelledby="implementation-heading"
        >
          <h3
            id="implementation-heading"
            className="text-sm font-semibold text-zinc-900"
          >
            Implementation
          </h3>

          <div className="mt-4">
            <label
              htmlFor="implementation-status"
              className="block text-sm font-medium text-zinc-800"
            >
              Status
            </label>
            <select
              id="implementation-status"
              value={implementation.status}
              onChange={(event) =>
                updateImplementation(selected.id, {
                  status: event.target.value as ImplementationStatus,
                })
              }
              className="mt-1.5 w-full max-w-xs rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label
              htmlFor="implementation-narrative"
              className="block text-sm font-medium text-zinc-800"
            >
              Narrative
            </label>
            <textarea
              id="implementation-narrative"
              value={implementation.narrative}
              onChange={(event) =>
                updateImplementation(selected.id, {
                  narrative: event.target.value,
                })
              }
              rows={8}
              placeholder="Describe how this control is implemented…"
              className="mt-1.5 w-full resize-y rounded border border-zinc-300 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
