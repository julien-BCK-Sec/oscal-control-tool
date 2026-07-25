/**
 * Evidence search / picker DTOs (Milestone 03C).
 * Lightweight view models — not the full Evidence aggregate.
 */

import type { EvidenceStatus, EvidenceType } from "./types";

export const EVIDENCE_SEARCH_DEFAULT_LIMIT = 20;
export const EVIDENCE_SEARCH_MAX_LIMIT = 50;

/** Lightweight current-version summary for picker results (no storage key). */
export type EvidenceSearchCurrentVersion = {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

/**
 * Dedicated search result DTO for the Evidence Picker.
 * Does not include control IDs, storage keys, or version history.
 */
export type EvidenceSearchResult = {
  id: string;
  title: string;
  evidenceType: EvidenceType;
  owner: string;
  status: EvidenceStatus;
  updatedAt: string;
  currentVersion: EvidenceSearchCurrentVersion | null;
};

export type SearchEvidenceInput = {
  projectId: string;
  /** Free-text query (title, description, owner, current filename). */
  query?: string;
  /** Opaque keyset cursor from a previous page. */
  cursor?: string | null;
  /** Page size (default 20, max 50). */
  limit?: number;
  /**
   * Status filter. When omitted, excludes archived and returns draft + active.
   * Pass an explicit status to narrow further (never returns archived unless
   * status is exactly "archived", which 03C picker does not request).
   */
  status?: EvidenceStatus;
  /** Optional evidence type filter. */
  evidenceType?: EvidenceType;
  /** Exclude Evidence already linked to this control (picker linking flow). */
  excludeLinkedToControlId?: string;
  /**
   * When false, include archived. Default true for picker eligibility.
   * Ignored when `status` is set explicitly.
   */
  excludeArchived?: boolean;
};

export type SearchEvidencePage = {
  items: EvidenceSearchResult[];
  nextCursor: string | null;
  hasMore: boolean;
};
