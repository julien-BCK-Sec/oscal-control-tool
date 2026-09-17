import type { SspCompleteness } from "./types";

export function documented(text: string): SspCompleteness {
  return { kind: "documented", text };
}

export function notDocumented(fieldLabel: string): SspCompleteness {
  return { kind: "not-documented", fieldLabel };
}

export function incomplete(fieldLabel: string, partial = ""): SspCompleteness {
  return { kind: "incomplete", fieldLabel, partial };
}

export function fromOptionalText(
  value: string | undefined | null,
  fieldLabel: string,
): SspCompleteness {
  const trimmed = value?.trim() ?? "";
  return trimmed ? documented(trimmed) : notDocumented(fieldLabel);
}

export function placeholderFor(fieldLabel: string): string {
  return `[Not yet documented: ${fieldLabel}]`;
}

export function unresolvedOdpPlaceholder(
  parameterId: string,
  label: string,
): string {
  return `[Unresolved ODP: ${parameterId} — ${label}]`;
}

/**
 * Render completeness to document text. Placeholders are view/render only.
 */
export function completenessText(value: SspCompleteness): string {
  switch (value.kind) {
    case "documented":
      return value.text;
    case "not-documented":
      return placeholderFor(value.fieldLabel);
    case "incomplete":
      return value.partial.trim()
        ? value.partial
        : placeholderFor(value.fieldLabel);
    case "not-applicable":
      return value.text;
    case "unresolved-odp":
      return unresolvedOdpPlaceholder(value.parameterId, value.label);
    case "authoritative-value-required":
      return value.explanation;
    case "source-conflict":
      return value.explanation;
    case "conditional":
      return value.notes.trim()
        ? `Conditional: ${value.conditionLabel}. ${value.notes}`
        : `Conditional: ${value.conditionLabel}`;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
}

export const EMPTY_COLLECTION_COPY = {
  roles:
    "System roles have not been documented in Control Freak. An empty list is not a claim that none exist.",
  informationTypes:
    "Information types have not been documented in Control Freak. An empty list is not a claim that none exist.",
  interconnections:
    "Interconnections have not been documented in Control Freak. An empty list is not a claim that none exist.",
} as const;

export const COMPLETENESS_NOTICE_PARAGRAPHS = [
  "This document reflects information recorded in Control Freak at generation time.",
  "Missing information is identified with placeholders. Empty lists mean the information has not been documented, not that nothing exists.",
  "Framework selection identifies the documentation baseline. It is not evidence of certification, assessment, authorization, an Authority to Operate, or a DoD Provisional Authorization.",
  "Unresolved organization-defined parameters and conflicting framework sources remain unresolved.",
  "Linked Evidence records are documentation references. They have not been independently assessed or validated merely because they are linked.",
] as const;
