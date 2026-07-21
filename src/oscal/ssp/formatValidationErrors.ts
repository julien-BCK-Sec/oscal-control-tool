import type { ErrorObject } from "ajv";

export type SspSchemaIssue = {
  /** JSON Pointer-ish path for diagnostics. */
  path: string;
  /** Human-readable summary suitable for UI. */
  message: string;
  /** Raw AJV keyword, when available. */
  keyword?: string;
};

export type SspSchemaValidationResult =
  | { ok: true }
  | {
      ok: false;
      /** Short message for end users. */
      message: string;
      /** Structured issues for UI lists. */
      issues: SspSchemaIssue[];
      /** Full AJV error objects for development diagnostics. */
      ajvErrors: ErrorObject[];
    };

function formatPath(instancePath: string): string {
  if (!instancePath || instancePath === "") {
    return "(document root)";
  }
  return instancePath.replace(/^\//, "").replace(/\//g, ".");
}

export function formatAjvErrors(errors: ErrorObject[] | null | undefined): {
  message: string;
  issues: SspSchemaIssue[];
} {
  const list = errors ?? [];
  const issues: SspSchemaIssue[] = list.map((error) => {
    const path = formatPath(error.instancePath);
    const detail = error.message ?? "failed schema validation";
    return {
      path,
      message: `${path}: ${detail}`,
      keyword: error.keyword,
    };
  });

  if (issues.length === 0) {
    return {
      message: "The OSCAL SSP document failed schema validation.",
      issues: [],
    };
  }

  const preview = issues
    .slice(0, 5)
    .map((issue) => `• ${issue.message}`)
    .join("\n");
  const remaining = issues.length - 5;
  const message =
    remaining > 0
      ? `OSCAL SSP schema validation failed:\n${preview}\n…and ${remaining} more issue(s).`
      : `OSCAL SSP schema validation failed:\n${preview}`;

  return { message, issues };
}
