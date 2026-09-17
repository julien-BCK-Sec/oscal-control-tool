import { parseProjectParameterRecords } from "@/data/parameter";
import type { ProjectParameterRecords } from "@/data/parameter";
import { isControlImplementation } from "@/data/implementation";
import {
  createProjectMetadata,
  parseProjectMetadata,
  type ProjectMetadata,
  type ProjectMetadataInput,
} from "@/data/project";
import type { ControlImplementation } from "@/data/implementation";
import {
  PROJECT_DOCUMENT_SCHEMA_VERSION,
  type StoredProjectDocument,
  type StoredProjectDocumentV1,
  type StoredProjectDocumentV2,
  type StoredProjectDocumentV3,
} from "./types";

export type DocumentParseError =
  | { kind: "invalid-json"; message: string }
  | { kind: "invalid-shape"; message: string }
  | { kind: "unsupported-schema"; schemaVersion: number };

export type DocumentParseResult =
  | { ok: true; document: StoredProjectDocument }
  | { ok: false; error: DocumentParseError };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseImplementations(
  value: unknown,
): Record<string, ControlImplementation> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const implementations: Record<string, ControlImplementation> = {};
  for (const [controlId, entry] of Object.entries(value)) {
    if (typeof controlId !== "string" || controlId.trim() === "") {
      return null;
    }
    if (!isControlImplementation(entry)) {
      return null;
    }
    implementations[controlId] = {
      status: entry.status,
      narrative: entry.narrative,
    };
  }
  return implementations;
}

function parseProjectCore(project: unknown): {
  id: string;
  name: string;
  frameworkId: string;
  implementations: Record<string, ControlImplementation>;
} | null {
  if (!isRecord(project)) {
    return null;
  }
  if (
    !isNonEmptyString(project.id) ||
    !isNonEmptyString(project.name) ||
    !isNonEmptyString(project.frameworkId)
  ) {
    return null;
  }
  const implementations = parseImplementations(project.implementations);
  if (implementations === null) {
    return null;
  }
  return {
    id: project.id.trim(),
    name: project.name.trim(),
    frameworkId: project.frameworkId.trim(),
    implementations,
  };
}

function parseParameterRecords(value: unknown): ProjectParameterRecords | null {
  return parseProjectParameterRecords(value);
}

function toV3Document(
  core: {
    id: string;
    name: string;
    frameworkId: string;
    implementations: Record<string, ControlImplementation>;
  },
  metadata: ProjectMetadata,
  parameterRecords: ProjectParameterRecords,
): StoredProjectDocumentV3 {
  return {
    schemaVersion: 3,
    project: {
      ...core,
      metadata,
      parameterRecords,
    },
  };
}

function hasV1MetadataCore(value: unknown): value is {
  systemName: string;
  organizationName: string;
  systemDescription: string;
} {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.systemName === "string" &&
    typeof value.organizationName === "string" &&
    typeof value.systemDescription === "string"
  );
}

function migrateV1MetadataToV2(metadata: {
  systemName: string;
  organizationName: string;
  systemDescription: string;
}): ProjectMetadata {
  return createProjectMetadata({
    systemName: metadata.systemName,
    organizationName: metadata.organizationName,
    systemDescription: metadata.systemDescription,
  });
}

function parseV1(value: unknown): DocumentParseResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      error: { kind: "invalid-shape", message: "Document must be an object." },
    };
  }

  if (value.schemaVersion !== 1) {
    return {
      ok: false,
      error: {
        kind: "unsupported-schema",
        schemaVersion:
          typeof value.schemaVersion === "number" ? value.schemaVersion : -1,
      },
    };
  }

  const core = parseProjectCore(value.project);
  if (core === null) {
    return {
      ok: false,
      error: {
        kind: "invalid-shape",
        message: "Project id, name, and frameworkId are required.",
      },
    };
  }

  const project = value.project as Record<string, unknown>;
  if (!hasV1MetadataCore(project.metadata)) {
    return {
      ok: false,
      error: { kind: "invalid-shape", message: "Invalid project metadata." },
    };
  }

  const document = toV3Document(
    core,
    migrateV1MetadataToV2({
      systemName: project.metadata.systemName,
      organizationName: project.metadata.organizationName,
      systemDescription: project.metadata.systemDescription,
    }),
    {},
  );

  return { ok: true, document };
}

function parseV2(value: unknown): DocumentParseResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      error: { kind: "invalid-shape", message: "Document must be an object." },
    };
  }
  if (value.schemaVersion !== 2) {
    return {
      ok: false,
      error: {
        kind: "unsupported-schema",
        schemaVersion:
          typeof value.schemaVersion === "number" ? value.schemaVersion : -1,
      },
    };
  }

  const core = parseProjectCore(value.project);
  if (core === null) {
    return {
      ok: false,
      error: {
        kind: "invalid-shape",
        message: "Project id, name, and frameworkId are required.",
      },
    };
  }

  const project = value.project as Record<string, unknown>;
  const metadata = parseProjectMetadata(project.metadata);
  if (metadata === null) {
    return {
      ok: false,
      error: { kind: "invalid-shape", message: "Invalid project metadata." },
    };
  }

  return {
    ok: true,
    document: toV3Document(core, metadata, {}),
  };
}

function parseV3(value: unknown): DocumentParseResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      error: { kind: "invalid-shape", message: "Document must be an object." },
    };
  }
  if (value.schemaVersion !== 3) {
    return {
      ok: false,
      error: {
        kind: "unsupported-schema",
        schemaVersion:
          typeof value.schemaVersion === "number" ? value.schemaVersion : -1,
      },
    };
  }

  const core = parseProjectCore(value.project);
  if (core === null) {
    return {
      ok: false,
      error: {
        kind: "invalid-shape",
        message: "Project id, name, and frameworkId are required.",
      },
    };
  }

  const project = value.project as Record<string, unknown>;
  const metadata = parseProjectMetadata(project.metadata);
  if (metadata === null) {
    return {
      ok: false,
      error: { kind: "invalid-shape", message: "Invalid project metadata." },
    };
  }
  const parameterRecords = parseParameterRecords(project.parameterRecords);
  if (parameterRecords === null) {
    return {
      ok: false,
      error: {
        kind: "invalid-shape",
        message: "Invalid project parameter records.",
      },
    };
  }

  return {
    ok: true,
    document: toV3Document(core, metadata, parameterRecords),
  };
}

/**
 * Migration chain: v1/v2 documents are upgraded in memory to v3 with empty
 * parameter records. Rows are not rewritten until the next save.
 * Values are never inferred from narratives or framework assignment text.
 */
export function migrateProjectDocument(raw: unknown): DocumentParseResult {
  if (!isRecord(raw)) {
    return {
      ok: false,
      error: { kind: "invalid-shape", message: "Document must be an object." },
    };
  }

  const schemaVersion = raw.schemaVersion;
  if (typeof schemaVersion !== "number" || !Number.isInteger(schemaVersion)) {
    return {
      ok: false,
      error: {
        kind: "invalid-shape",
        message: "Missing or invalid schemaVersion.",
      },
    };
  }

  if (schemaVersion > PROJECT_DOCUMENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: { kind: "unsupported-schema", schemaVersion },
    };
  }

  if (schemaVersion === 1) {
    return parseV1(raw);
  }

  if (schemaVersion === 2) {
    return parseV2(raw);
  }

  if (schemaVersion === 3) {
    return parseV3(raw);
  }

  return {
    ok: false,
    error: { kind: "unsupported-schema", schemaVersion },
  };
}

export function parseProjectDocumentJson(raw: string): DocumentParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      error: { kind: "invalid-json", message: "project_json is not valid JSON." },
    };
  }
  return migrateProjectDocument(parsed);
}

/** Historical helper for tests that must write pre-07A snapshot JSON. */
export function buildStoredProjectDocumentV1(input: {
  id: string;
  name: string;
  frameworkId: string;
  metadata: Pick<
    ProjectMetadata,
    "systemName" | "organizationName" | "systemDescription"
  >;
  implementations: Record<string, ControlImplementation>;
}): StoredProjectDocumentV1 {
  return {
    schemaVersion: 1,
    project: {
      id: input.id,
      name: input.name,
      frameworkId: input.frameworkId,
      metadata: {
        systemName: input.metadata.systemName,
        organizationName: input.metadata.organizationName,
        systemDescription: input.metadata.systemDescription,
      },
      implementations: { ...input.implementations },
    },
  };
}

export function buildStoredProjectDocumentV2(input: {
  id: string;
  name: string;
  frameworkId: string;
  metadata: ProjectMetadataInput;
  implementations: Record<string, ControlImplementation>;
}): StoredProjectDocumentV2 {
  const metadata = parseProjectMetadata(input.metadata);
  if (metadata === null) {
    throw new Error("Invalid project metadata.");
  }
  return {
    schemaVersion: 2,
    project: {
      id: input.id,
      name: input.name,
      frameworkId: input.frameworkId,
      metadata,
      implementations: { ...input.implementations },
    },
  };
}

export function buildStoredProjectDocument(input: {
  id: string;
  name: string;
  frameworkId: string;
  metadata: ProjectMetadataInput;
  implementations: Record<string, ControlImplementation>;
  parameterRecords?: ProjectParameterRecords;
}): StoredProjectDocumentV3 {
  const metadata = parseProjectMetadata(input.metadata);
  if (metadata === null) {
    throw new Error("Invalid project metadata.");
  }
  const parameterRecords = parseParameterRecords(input.parameterRecords ?? {});
  if (parameterRecords === null) {
    throw new Error("Invalid project parameter records.");
  }
  return {
    schemaVersion: 3,
    project: {
      id: input.id,
      name: input.name,
      frameworkId: input.frameworkId,
      metadata,
      implementations: { ...input.implementations },
      parameterRecords,
    },
  };
}

export function serializeProjectDocument(
  document:
    | StoredProjectDocument
    | StoredProjectDocumentV1
    | StoredProjectDocumentV2,
): string {
  return JSON.stringify(document);
}

/** Stable content fingerprint for snapshot deduplication (excludes timestamps). */
export function projectDocumentFingerprint(
  document:
    | StoredProjectDocument
    | StoredProjectDocumentV1
    | StoredProjectDocumentV2,
): string {
  return JSON.stringify({
    schemaVersion: document.schemaVersion,
    project: document.project,
  });
}
