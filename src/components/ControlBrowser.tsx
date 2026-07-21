"use client";

import { useState } from "react";
import { FRAMEWORK_CONTROLS } from "@/data/framework";

export function ControlBrowser() {
  const [selectedId, setSelectedId] = useState(FRAMEWORK_CONTROLS[0].id);
  const selected =
    FRAMEWORK_CONTROLS.find((control) => control.id === selectedId) ??
    FRAMEWORK_CONTROLS[0];

  return (
    <div className="flex min-h-full flex-1 bg-white text-zinc-900">
      <aside
        className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50"
        aria-label="Controls"
      >
        <div className="border-b border-zinc-200 px-4 py-3">
          <h1 className="text-sm font-semibold tracking-tight text-zinc-900">
            Controls
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">FedRAMP Moderate</p>
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
                    className={`flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900 ${
                      isSelected
                        ? "bg-white text-zinc-900"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">
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

      <main className="flex flex-1 flex-col overflow-y-auto px-8 py-8">
        <p className="font-mono text-sm uppercase tracking-wide text-zinc-500">
          {selected.id}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
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
      </main>
    </div>
  );
}
