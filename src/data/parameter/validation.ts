import type {
  AuthoredParameterBody,
  ProjectParameterIntent,
  ProjectParameterRecord,
  ProjectParameterRecords,
} from "./types";

const INTENTS = new Set<ProjectParameterIntent>([
  "organization-defined",
  "accept-permitted-baseline",
  "dspav-assertion",
  "documented-deviation",
  "conflict-proceeding",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const values: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") {
      return null;
    }
    const trimmed = entry.trim();
    if (trimmed) {
      values.push(trimmed);
    }
  }
  return values;
}

function parseBody(value: unknown): AuthoredParameterBody | null {
  if (!isRecord(value)) {
    return null;
  }
  if (value.form === "assignment") {
    const values = parseStringArray(value.values);
    if (values === null || values.length === 0) {
      return null;
    }
    return { form: "assignment", values };
  }
  if (value.form === "selection") {
    if (value.howMany !== "one" && value.howMany !== "one-or-more") {
      return null;
    }
    const selectedChoiceKeys = parseStringArray(value.selectedChoiceKeys);
    if (selectedChoiceKeys === null) {
      return null;
    }
    let nested: Record<string, AuthoredParameterBody> | undefined;
    if (value.nested !== undefined) {
      if (!isRecord(value.nested)) {
        return null;
      }
      nested = {};
      for (const [paramId, nestedBody] of Object.entries(value.nested)) {
        if (!paramId.trim()) {
          return null;
        }
        const parsed = parseBody(nestedBody);
        if (parsed === null) {
          return null;
        }
        nested[paramId] = parsed;
      }
    }
    return {
      form: "selection",
      howMany: value.howMany,
      selectedChoiceKeys,
      ...(nested ? { nested } : {}),
    };
  }
  return null;
}

export function parseProjectParameterRecord(
  value: unknown,
): ProjectParameterRecord | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.controlId !== "string" ||
    !value.controlId.trim() ||
    typeof value.parameterId !== "string" ||
    !value.parameterId.trim()
  ) {
    return null;
  }
  if (typeof value.intent !== "string" || !INTENTS.has(value.intent as ProjectParameterIntent)) {
    return null;
  }
  const record: ProjectParameterRecord = {
    controlId: value.controlId.trim(),
    parameterId: value.parameterId.trim(),
    intent: value.intent as ProjectParameterIntent,
  };
  if (value.body !== undefined) {
    const body = parseBody(value.body);
    if (body === null) {
      return null;
    }
    record.body = body;
  }
  if (value.notes !== undefined) {
    if (typeof value.notes !== "string") {
      return null;
    }
    record.notes = value.notes;
  }
  if (value.dspavSourceNote !== undefined) {
    if (typeof value.dspavSourceNote !== "string") {
      return null;
    }
    record.dspavSourceNote = value.dspavSourceNote;
  }
  return record;
}

/**
 * Parse persisted parameter records. Missing/undefined becomes {}.
 * Invalid shapes fail closed (null). Unknown parameter IDs are kept (orphans).
 */
export function parseProjectParameterRecords(
  value: unknown,
): ProjectParameterRecords | null {
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    return null;
  }
  const records: ProjectParameterRecords = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!key.trim()) {
      return null;
    }
    const parsed = parseProjectParameterRecord(entry);
    if (parsed === null) {
      return null;
    }
    if (parsed.parameterId !== key) {
      return null;
    }
    records[key] = parsed;
  }
  return records;
}

export function isProjectParameterRecords(
  value: unknown,
): value is ProjectParameterRecords {
  return parseProjectParameterRecords(value) !== null;
}
