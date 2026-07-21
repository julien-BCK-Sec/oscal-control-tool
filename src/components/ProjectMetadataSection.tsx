"use client";

import { ExportOscalButton } from "@/components/ExportOscalButton";
import type { ControlImplementation } from "@/data/implementation";
import type { ProjectMetadata } from "@/data/project";

const fieldClassName =
  "mt-1.5 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

export type ProjectMetadataSectionProps = {
  metadata: ProjectMetadata;
  onMetadataChange: (next: ProjectMetadata) => void;
  implementations: Record<string, ControlImplementation>;
  projectName?: string;
};

export function ProjectMetadataSection({
  metadata,
  onMetadataChange,
  implementations,
  projectName,
}: ProjectMetadataSectionProps) {
  function updateMetadata(patch: Partial<ProjectMetadata>) {
    onMetadataChange({
      ...metadata,
      ...patch,
    });
  }

  return (
    <section
      className="shrink-0 border-b border-zinc-200 bg-white px-4 py-5 sm:px-8"
      aria-labelledby="project-metadata-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="project-metadata-heading"
            className="text-sm font-semibold tracking-tight text-zinc-900"
          >
            Project
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {projectName
              ? `Editing “${projectName}”. System and organization details for OSCAL export.`
              : "System and organization details for this documentation project."}
          </p>
        </div>
        <ExportOscalButton
          metadata={metadata}
          implementations={implementations}
        />
      </div>

      <div className="mt-4 grid max-w-3xl gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="project-system-name"
            className="block text-sm font-medium text-zinc-800"
          >
            System name
          </label>
          <input
            id="project-system-name"
            type="text"
            value={metadata.systemName}
            onChange={(event) =>
              updateMetadata({ systemName: event.target.value })
            }
            className={fieldClassName}
            autoComplete="organization"
          />
        </div>

        <div>
          <label
            htmlFor="project-organization-name"
            className="block text-sm font-medium text-zinc-800"
          >
            Organization name
          </label>
          <input
            id="project-organization-name"
            type="text"
            value={metadata.organizationName}
            onChange={(event) =>
              updateMetadata({ organizationName: event.target.value })
            }
            className={fieldClassName}
            autoComplete="organization"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="project-system-description"
            className="block text-sm font-medium text-zinc-800"
          >
            System description
          </label>
          <textarea
            id="project-system-description"
            value={metadata.systemDescription}
            onChange={(event) =>
              updateMetadata({ systemDescription: event.target.value })
            }
            rows={3}
            className={`${fieldClassName} resize-y leading-relaxed`}
          />
        </div>
      </div>
    </section>
  );
}
