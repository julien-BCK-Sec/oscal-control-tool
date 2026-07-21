"use client";

import { useState, useSyncExternalStore } from "react";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import {
  getImplementationsServerSnapshot,
  getImplementationsSnapshot,
  subscribeToImplementations,
} from "@/data/implementation";
import {
  getProjectMetadataServerSnapshot,
  getProjectMetadataSnapshot,
  subscribeToProjectMetadata,
} from "@/data/project";
import { assembleProject } from "@/domain";
import {
  buildSspExportFilename,
  downloadJsonFile,
  projectToOscalSsp,
  validateOscalSspDocument,
} from "@/oscal";

export function ExportOscalButton() {
  const metadata = useSyncExternalStore(
    subscribeToProjectMetadata,
    getProjectMetadataSnapshot,
    getProjectMetadataServerSnapshot,
  );
  const implementations = useSyncExternalStore(
    subscribeToImplementations,
    getImplementationsSnapshot,
    getImplementationsServerSnapshot,
  );
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
      // Keep full AJV diagnostics available during development.
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
