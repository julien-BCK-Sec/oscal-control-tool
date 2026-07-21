"use client";

import { useState } from "react";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import type { ControlImplementation } from "@/data/implementation";
import type { ProjectMetadata } from "@/data/project";
import { assembleProject } from "@/domain";
import {
  buildSspExportFilename,
  downloadJsonFile,
  projectToOscalSsp,
  validateOscalSspDocument,
} from "@/oscal";

export type ExportOscalButtonProps = {
  metadata: ProjectMetadata;
  implementations: Record<string, ControlImplementation>;
};

export function ExportOscalButton({
  metadata,
  implementations,
}: ExportOscalButtonProps) {
  const [exportError, setExportError] = useState<string | null>(null);

  function handleExport() {
    setExportError(null);

    const project = assembleProject({
      metadata,
      frameworkControls: FRAMEWORK_CONTROLS,
      implementations,
    });
    const oscalDocument = projectToOscalSsp(project);
    const validation = validateOscalSspDocument(oscalDocument);

    if (!validation.ok) {
      console.error("OSCAL SSP schema validation failed", validation.ajvErrors);
      setExportError(validation.message);
      return;
    }

    const filename = buildSspExportFilename(project.metadata.systemName);
    downloadJsonFile(filename, oscalDocument);
  }

  return (
    <div className="flex max-w-md flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleExport}
        className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        Export OSCAL SSP
      </button>
      {exportError ? (
        <p
          role="alert"
          className="whitespace-pre-wrap text-left text-xs leading-relaxed text-red-700"
        >
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
