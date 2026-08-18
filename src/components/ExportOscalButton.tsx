"use client";

import { useState } from "react";
import type { Framework } from "@/data/framework";
import type { ControlImplementation } from "@/data/implementation";
import type { ProjectMetadata } from "@/data/project";
import { assembleProject } from "@/domain";
import { frameworkHasOscalSspExport } from "@/framework/nist-sp-800-53-rev5/identities";
import {
  buildSspExportFilename,
  downloadJsonFile,
  projectToOscalSsp,
  validateOscalSspDocument,
} from "@/oscal";
import { HelpLink } from "@/components/help/HelpLink";

export type ExportOscalButtonProps = {
  framework: Framework;
  metadata: ProjectMetadata;
  implementations: Record<string, ControlImplementation>;
};

export function ExportOscalButton({
  framework,
  metadata,
  implementations,
}: ExportOscalButtonProps) {
  const [exportError, setExportError] = useState<string | null>(null);
  const oscalAvailable = frameworkHasOscalSspExport(framework.id);

  function handleExport() {
    setExportError(null);

    const project = assembleProject({
      metadata,
      frameworkId: framework.id,
      frameworkControls: framework.controls,
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

  if (!oscalAvailable) {
    return (
      <p className="max-w-md text-left text-xs leading-relaxed text-text-secondary">
        OSCAL SSP export is available for NIST SP 800-53 projects. No official
        CMMC / SP 800-171 Rev. 2 OSCAL profile is pinned.{" "}
        <HelpLink slug="oscal-export" hash="cmmc-projects-dont-have-this-button">
          Learn more
        </HelpLink>
      </p>
    );
  }

  return (
    <div className="flex max-w-md flex-col items-stretch gap-2 sm:items-end">
      <button type="button" onClick={handleExport} className="btn">
        Export OSCAL SSP
      </button>
      <p className="text-left text-xs sm:text-right">
        <HelpLink slug="oscal-export" hash="what-valid-means-here">
          What OSCAL export includes and what validation means
        </HelpLink>
      </p>
      {exportError ? (
        <p
          role="alert"
          className="whitespace-pre-wrap text-left text-xs leading-relaxed text-danger"
        >
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
