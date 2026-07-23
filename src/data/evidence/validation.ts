import {
  isEvidenceRequirement,
  isEvidenceStatus,
  isEvidenceType,
} from "./defaults";
import type {
  CreateEvidenceInput,
  EvidenceStatus,
  EvidenceType,
  UpdateEvidenceInput,
} from "./types";

/** Accepts `YYYY-MM-DD` or null/empty → null. Rejects other shapes. */
export function parseEvidenceDate(
  value: unknown,
): string | null | undefined {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return undefined;
  }
  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return trimmed;
}

function normalizeTitle(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeOptionalText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value !== "string") {
    return fallback;
  }
  return value;
}

export type ParsedCreateEvidenceInput = {
  projectId: string;
  title: string;
  description: string;
  owner: string;
  evidenceType: EvidenceType;
  status: EvidenceStatus;
  collectionDate: string | null;
  reviewDueDate: string | null;
  controlIds: string[];
};

export function parseCreateEvidenceInput(
  value: unknown,
): ParsedCreateEvidenceInput | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.projectId !== "string" || record.projectId.trim() === "") {
    return null;
  }
  const title = normalizeTitle(record.title);
  if (!title) {
    return null;
  }
  if (!isEvidenceType(record.evidenceType)) {
    return null;
  }
  let status: EvidenceStatus = "draft";
  if (record.status !== undefined) {
    if (!isEvidenceStatus(record.status)) {
      return null;
    }
    status = record.status;
  }
  // Disallow creating directly as archived.
  if (status === "archived") {
    return null;
  }
  const collectionDate = parseEvidenceDate(record.collectionDate);
  if (collectionDate === undefined) {
    return null;
  }
  const reviewDueDate = parseEvidenceDate(record.reviewDueDate);
  if (reviewDueDate === undefined) {
    return null;
  }
  const controlIds: string[] = [];
  if (record.controlIds !== undefined) {
    if (!Array.isArray(record.controlIds)) {
      return null;
    }
    for (const id of record.controlIds) {
      if (typeof id !== "string" || id.trim() === "") {
        return null;
      }
      controlIds.push(id.trim());
    }
  }
  return {
    projectId: record.projectId.trim(),
    title,
    description: normalizeOptionalText(record.description),
    owner: normalizeOptionalText(record.owner).trim(),
    evidenceType: record.evidenceType,
    status,
    collectionDate,
    reviewDueDate,
    controlIds: [...new Set(controlIds)],
  };
}

export type ParsedUpdateEvidenceInput = {
  title?: string;
  description?: string;
  owner?: string;
  evidenceType?: EvidenceType;
  status?: EvidenceStatus;
  collectionDate?: string | null;
  reviewDueDate?: string | null;
};

export function parseUpdateEvidenceInput(
  value: unknown,
): ParsedUpdateEvidenceInput | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const out: ParsedUpdateEvidenceInput = {};

  if (record.title !== undefined) {
    const title = normalizeTitle(record.title);
    if (!title) {
      return null;
    }
    out.title = title;
  }
  if (record.description !== undefined) {
    if (typeof record.description !== "string") {
      return null;
    }
    out.description = record.description;
  }
  if (record.owner !== undefined) {
    if (typeof record.owner !== "string") {
      return null;
    }
    out.owner = record.owner.trim();
  }
  if (record.evidenceType !== undefined) {
    if (!isEvidenceType(record.evidenceType)) {
      return null;
    }
    out.evidenceType = record.evidenceType;
  }
  if (record.status !== undefined) {
    if (!isEvidenceStatus(record.status)) {
      return null;
    }
    out.status = record.status;
  }
  if (record.collectionDate !== undefined) {
    const collectionDate = parseEvidenceDate(record.collectionDate);
    if (collectionDate === undefined) {
      return null;
    }
    out.collectionDate = collectionDate;
  }
  if (record.reviewDueDate !== undefined) {
    const reviewDueDate = parseEvidenceDate(record.reviewDueDate);
    if (reviewDueDate === undefined) {
      return null;
    }
    out.reviewDueDate = reviewDueDate;
  }

  if (Object.keys(out).length === 0) {
    return null;
  }
  return out;
}

export function toCreateEvidenceInput(
  parsed: ParsedCreateEvidenceInput,
): CreateEvidenceInput {
  return {
    projectId: parsed.projectId,
    title: parsed.title,
    description: parsed.description,
    owner: parsed.owner,
    evidenceType: parsed.evidenceType,
    status: parsed.status,
    collectionDate: parsed.collectionDate,
    reviewDueDate: parsed.reviewDueDate,
    controlIds: parsed.controlIds,
  };
}

export function toUpdateEvidenceInput(
  parsed: ParsedUpdateEvidenceInput,
): UpdateEvidenceInput {
  return { ...parsed };
}

export { isEvidenceRequirement };
