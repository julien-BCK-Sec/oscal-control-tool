/**
 * Evidence search / picker DTOs (Milestone 03C, extended in 03D).
 * Lightweight view models — not the full Evidence aggregate.
 */

import type { EvidenceFreshness } from "./freshness";
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
 * Dedicated search result DTO for the Evidence Picker and Evidence Browser.
 * Does not include control ID lists, storage keys, or version history.
 */
export type EvidenceSearchResult = {
  id: string;
  title: string;
  evidenceType: EvidenceType;
  owner: string;
  status: EvidenceStatus;
  updatedAt: string;
  collectionDate: string | null;
  reviewDueDate: string | null;
  freshness: EvidenceFreshness;
  linkedControlCount: number;
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
   * status is exactly "archived").
   */
  status?: EvidenceStatus;
  /** Optional evidence type filter. */
  evidenceType?: EvidenceType;
  /** Case-insensitive substring match on the free-text owner field. */
  owner?: string;
  /** Derived freshness filter (uses `asOfDate`). */
  freshness?: EvidenceFreshness;
  /** When set, filter by presence/absence of `current_version_id`. */
  hasCurrentVersion?: boolean;
  /**
   * When true, only Evidence with at least one control link.
   * When false, only unlinked Evidence.
   */
  linked?: boolean;
  /**
   * UTC calendar date used to derive freshness filters and result freshness.
   * Defaults to today (UTC) when omitted.
   */
  asOfDate?: string;
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
