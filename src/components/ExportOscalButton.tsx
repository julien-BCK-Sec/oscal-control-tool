"use client";

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
} from "@/oscal";
import { useSyncExternalStore } from "react";

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

  function handleExport() {
    const project = assembleProject({
      metadata,
      frameworkControls: FRAMEWORK_CONTROLS,
      implementations,
    });
    const oscalDocument = projectToOscalSsp(project);
    const filename = buildSspExportFilename(project.metadata.systemName);
    downloadJsonFile(filename, oscalDocument);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
    >
      Export OSCAL SSP
    </button>
  );
}
