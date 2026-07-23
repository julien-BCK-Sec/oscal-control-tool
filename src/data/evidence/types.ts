/**
 * Evidence domain types (Milestone 03A).
 *
 * Evidence is a project-scoped operational aggregate: a logical assertion that
 * may later have attached versions (files). It is never stored in OSCAL or
 * project_json. See ADR-024.
 */

/** Lifecycle of an Evidence record (not a file/version status). */
export const EVIDENCE_STATUSES = ["draft", "active", "archived"] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

/**
 * Closed catalog of evidence kinds for 03A. Stored as text; validated in app.
 * Extensible later without a schema rewrite.
 */
export const EVIDENCE_TYPES = [
  "document",
  "screenshot",
  "log",
  "policy",
  "attestation",
  "other",
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

/**
 * Whether a control implementation expects evidence.
 * Lives on ControlRecord, not on Evidence and not on the catalog control.
 */
export const EVIDENCE_REQUIREMENTS = [
  "required",
  "optional",
  "not_required",
] as const;
export type EvidenceRequirement = (typeof EVIDENCE_REQUIREMENTS)[number];

/**
 * Persisted Evidence row (application DTO, no Drizzle types).
 * Identity (`id`) is a stable UUID for the logical Evidence aggregate.
 * Future file uploads create Evidence Versions bound to this id — not new
 * Evidence rows (ADR-024).
 */
export type Evidence = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  /** Free-text owner label (same convention as ControlRecord.owner). */
  owner: string;
  evidenceType: EvidenceType;
  status: EvidenceStatus;
  /** ISO date `YYYY-MM-DD`, or null when unset. */
  collectionDate: string | null;
  /** ISO date `YYYY-MM-DD`, or null when unset. */
  reviewDueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Junction: Evidence ↔ framework control within a project. */
export type EvidenceControlLink = {
  id: string;
  evidenceId: string;
  projectId: string;
  /** Framework / OSCAL control identifier (e.g. `ac-2`). */
  controlId: string;
  createdAt: string;
};

export type EvidenceWithControlIds = Evidence & {
  controlIds: readonly string[];
};

export type CreateEvidenceInput = {
  projectId: string;
  title: string;
  description?: string;
  owner?: string;
  evidenceType: EvidenceType;
  status?: EvidenceStatus;
  collectionDate?: string | null;
  reviewDueDate?: string | null;
  /** Optional initial control associations. */
  controlIds?: readonly string[];
};

export type UpdateEvidenceInput = {
  title?: string;
  description?: string;
  owner?: string;
  evidenceType?: EvidenceType;
  status?: EvidenceStatus;
  collectionDate?: string | null;
  reviewDueDate?: string | null;
};

export type ListEvidenceOptions = {
  /** When false (default), omit archived evidence. */
  includeArchived?: boolean;
  /** Restrict to evidence linked to this control. */
  controlId?: string;
};
