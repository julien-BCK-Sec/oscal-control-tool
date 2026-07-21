import { isControlImplementation } from "@/data/implementation";
import {
  isProjectMetadata,
  type ProjectMetadata,
} from "@/data/project";
import type { ControlImplementation } from "@/data/implementation";
import {
  PROJECT_DOCUMENT_SCHEMA_VERSION,
  type StoredProjectDocument,
  type StoredProjectDocumentV1,
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

function parseV1(value: unknown): DocumentParseResult {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {
      ok: false,
      error: { kind: "invalid-shape", message: "Document must be an object." },
    };
  }

  const root = value as Record<string, unknown>;
  if (root.schemaVersion !== 1) {
    return {
      ok: false,
      error: {
        kind: "unsupported-schema",
        schemaVersion:
          typeof root.schemaVersion === "number" ? root.schemaVersion : -1,
      },
    };
  }

  const project = root.project;
  if (project === null || typeof project !== "object" || Array.isArray(project)) {
    return {
      ok: false,
      error: { kind: "invalid-shape", message: "Missing project object." },
    };
  }

  const p = project as Record<string, unknown>;
  if (
    !isNonEmptyString(p.id) ||
    !isNonEmptyString(p.name) ||
    !isNonEmptyString(p.frameworkId)
  ) {
    return {
      ok: false,
      error: {
        kind: "invalid-shape",
        message: "Project id, name, and frameworkId are required.",
      },
    };
  }

  if (!isProjectMetadata(p.metadata)) {
    return {
      ok: false,
      error: { kind: "invalid-shape", message: "Invalid project metadata." },
    };
  }

  const implementations = parseImplementations(p.implementations);
  if (implementations === null) {
    return {
      ok: false,
      error: {
        kind: "invalid-shape",
        message: "Invalid control implementations map.",
      },
    };
  }

  const document: StoredProjectDocumentV1 = {
    schemaVersion: 1,
    project: {
      id: p.id.trim(),
      name: p.name.trim(),
      frameworkId: p.frameworkId.trim(),
      metadata: {
        systemName: p.metadata.systemName,
        organizationName: p.metadata.organizationName,
        systemDescription: p.metadata.systemDescription,
      },
      implementations,
    },
  };

  return { ok: true, document };
}

/**
 * Migration chain entry point. Today only v1 exists; future versions
 * migrate step-by-step into the current schema.
 */
export function migrateProjectDocument(raw: unknown): DocumentParseResult {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      error: { kind: "invalid-shape", message: "Document must be an object." },
    };
  }

  const schemaVersion = (raw as Record<string, unknown>).schemaVersion;
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

  // Future: const v2 = migrateV1ToV2(...); return parseCurrent(v2);
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

export function buildStoredProjectDocumentV1(input: {
  id: string;
  name: string;
  frameworkId: string;
  metadata: ProjectMetadata;
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

export function serializeProjectDocument(
  document: StoredProjectDocument,
): string {
  return JSON.stringify(document);
}

/** Stable content fingerprint for snapshot deduplication (excludes timestamps). */
export function projectDocumentFingerprint(
  document: StoredProjectDocument,
): string {
  return JSON.stringify({
    schemaVersion: document.schemaVersion,
    project: document.project,
  });
}
