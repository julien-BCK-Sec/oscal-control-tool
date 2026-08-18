import {
  isFrameworkControlId,
  isRegisteredFrameworkId,
} from "@/data/framework";

export const UNKNOWN_FRAMEWORK_CONTROL_MESSAGE =
  "Control is not part of this project's framework.";

export function parseRegisteredFrameworkId(value: string): string {
  const frameworkId = value.trim();
  if (!frameworkId) {
    throw new Error("frameworkId is required.");
  }
  if (!isRegisteredFrameworkId(frameworkId)) {
    throw new Error(`Unknown framework: ${frameworkId}`);
  }
  return frameworkId;
}

export function unknownFrameworkLoadError(frameworkId: string): {
  kind: "unknown-framework";
  frameworkId: string;
  message: string;
} {
  const id = frameworkId.trim();
  return {
    kind: "unknown-framework",
    frameworkId: id,
    message: `Unknown framework: ${id || "(empty)"}`,
  };
}

/**
 * Runtime framework identity is always `projects.framework_id`.
 * `project_json.project.frameworkId` is a compatibility copy only.
 * Divergence is logged and ignored; the database is not mutated on load.
 */
export function resolveAuthoritativeFrameworkId(input: {
  projectId: string;
  columnFrameworkId: string;
  documentFrameworkId: string;
}): string {
  const columnFrameworkId = input.columnFrameworkId.trim();
  const documentFrameworkId = input.documentFrameworkId.trim();
  if (documentFrameworkId !== columnFrameworkId) {
    console.warn(
      "Project document frameworkId diverged from projects.framework_id; using column value.",
      {
        projectId: input.projectId,
        columnFrameworkId,
        documentFrameworkId,
      },
    );
  }
  return columnFrameworkId;
}

export function invalidFrameworkControlIds(
  frameworkId: string,
  controlIds: readonly string[],
): string[] {
  return [
    ...new Set(
      controlIds
        .map((id) => id.trim())
        .filter((id) => id && !isFrameworkControlId(frameworkId, id)),
    ),
  ];
}
