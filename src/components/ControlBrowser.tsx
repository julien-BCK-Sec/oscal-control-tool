"use client";

import { useState, useSyncExternalStore } from "react";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import {
  DEFAULT_CONTROL_IMPLEMENTATION,
  getImplementationsServerSnapshot,
  getImplementationsSnapshot,
  replaceImplementations,
  subscribeToImplementations,
  type ControlImplementation,
  type ImplementationStatus,
} from "@/data/implementation";

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

export function ControlBrowser() {
  const [selectedId, setSelectedId] = useState(FRAMEWORK_CONTROLS[0].id);
  const implementations = useSyncExternalStore(
    subscribeToImplementations,
    getImplementationsSnapshot,
    getImplementationsServerSnapshot,
  );

  const selected =
    FRAMEWORK_CONTROLS.find((control) => control.id === selectedId) ??
    FRAMEWORK_CONTROLS[0];
  const implementation = getImplementation(implementations, selected.id);

  function updateImplementation(
    controlId: string,
    patch: Partial<ControlImplementation>,
  ) {
    const current = getImplementation(implementations, controlId);
    replaceImplementations({
      ...implementations,
      [controlId]: {
        ...current,
        ...patch,
      },
    });
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white text-zinc-900 md:flex-row">
      <aside
        className="flex max-h-52 w-full shrink-0 flex-col border-b border-zinc-200 bg-zinc-50 md:max-h-none md:w-64 md:border-b-0 md:border-r"
        aria-label="Controls"
      >
        <div className="border-b border-zinc-200 px-4 py-3">
          <h1 className="text-sm font-semibold tracking-tight text-zinc-900">
            Controls
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            NIST SP 800-53 Rev. 5 Moderate (MVP subset)
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Control list">
          <ul className="flex flex-col">
            {FRAMEWORK_CONTROLS.map((control) => {
              const isSelected = control.id === selected.id;
              return (
                <li key={control.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(control.id)}
                    aria-current={isSelected ? "true" : undefined}
                    className={`flex w-full flex-col gap-0.5 border-l-4 px-4 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900 ${
                      isSelected
                        ? "border-zinc-900 bg-white font-medium text-zinc-900 shadow-[inset_0_0_0_1px_rgb(228_228_231)]"
                        : "border-transparent text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <span
                      className={`font-mono text-xs uppercase tracking-wide ${
                        isSelected ? "text-zinc-700" : "text-zinc-500"
                      }`}
                    >
                      {control.id}
                    </span>
                    <span className="text-sm leading-snug">{control.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <p className="font-mono text-sm uppercase tracking-wide text-zinc-500">
          {selected.id}
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
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-700">
            {selected.statement}
          </p>
        </section>

        <section
          className="mt-8 max-w-2xl"
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
