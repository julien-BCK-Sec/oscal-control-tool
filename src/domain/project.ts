import type { FrameworkControl } from "@/data/framework";
import type { ControlImplementation } from "@/data/implementation";
import type { ProjectMetadata } from "@/data/project";

/**
 * Complete application project as an internal domain model.
 * Combines the three application concerns without OSCAL structures.
 */
export type Project = {
  metadata: ProjectMetadata;
  /**
   * Application-facing framework controls included in the project.
   * Sourced from FrameworkProvider (NIST Moderate), not raw OSCAL.
   */
  frameworkControls: readonly FrameworkControl[];
  /** User-entered implementation data keyed by control ID. */
  implementations: Readonly<Record<string, ControlImplementation>>;
};

/** Inputs required to assemble a Project from current application state. */
export type AssembleProjectInput = {
  metadata: ProjectMetadata;
  frameworkControls: readonly FrameworkControl[];
  implementations: Readonly<Record<string, ControlImplementation>>;
};

/**
 * Pure function that assembles metadata, framework controls, and
 * implementation data into a single project object.
 */
export function assembleProject(input: AssembleProjectInput): Project {
  return {
    metadata: {
      systemName: input.metadata.systemName,
      organizationName: input.metadata.organizationName,
      systemDescription: input.metadata.systemDescription,
    },
    frameworkControls: input.frameworkControls,
    implementations: { ...input.implementations },
  };
}
