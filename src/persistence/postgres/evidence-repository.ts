import "server-only";

import { and, asc, desc, eq, exists, gt, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, not, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  decodeEvidenceSearchCursor,
  encodeEvidenceSearchCursor,
  escapeIlikePattern,
  EVIDENCE_DUE_SOON_DAYS,
  EVIDENCE_SEARCH_DEFAULT_LIMIT,
  EVIDENCE_SEARCH_MAX_LIMIT,
  addUtcDays,
  deriveEvidenceFreshness,
  isEvidenceFreshness,
  isEvidenceStatus,
  isEvidenceType,
  parseEvidenceDate,
  utcTodayIsoDate,
  type CreateEvidenceInput,
  type Evidence,
  type EvidenceControlLink,
  type EvidenceSearchResult,
  type EvidenceStatus,
  type EvidenceType,
  type EvidenceWithControlIds,
  type ListEvidenceOptions,
  type SearchEvidenceInput,
  type SearchEvidencePage,
  type UpdateEvidenceInput,
} from "@/data/evidence";
import type { EvidenceRepository } from "../evidence-repository";
import type { AppDatabase } from "./client";
import { evidence, evidenceControls, evidenceVersions, projects } from "./schema";

function nowIso(): string {
  return new Date().toISOString();
}

function toEvidence(row: typeof evidence.$inferSelect): Evidence {
  const evidenceType: EvidenceType = isEvidenceType(row.evidenceType)
    ? row.evidenceType
    : "other";
  const status: EvidenceStatus = isEvidenceStatus(row.status)
    ? row.status
    : "draft";
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    owner: row.owner,
    evidenceType,
    status,
    collectionDate: row.collectionDate,
    reviewDueDate: row.reviewDueDate,
    currentVersionId: row.currentVersionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toLink(row: typeof evidenceControls.$inferSelect): EvidenceControlLink {
  return {
    id: row.id,
    evidenceId: row.evidenceId,
    projectId: row.projectId,
    controlId: row.controlId,
    createdAt: row.createdAt,
  };
}

async function projectExists(
  db: AppDatabase,
  projectId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return rows.length > 0;
}

async function loadControlIds(
  db: AppDatabase,
  projectId: string,
  evidenceId: string,
): Promise<string[]> {
  const rows = await db
    .select({ controlId: evidenceControls.controlId })
    .from(evidenceControls)
    .where(
      and(
        eq(evidenceControls.projectId, projectId),
        eq(evidenceControls.evidenceId, evidenceId),
      ),
    )
    .orderBy(asc(evidenceControls.controlId));
  return rows.map((row) => row.controlId);
}

async function withControlIds(
  db: AppDatabase,
  row: Evidence,
): Promise<EvidenceWithControlIds> {
  const controlIds = await loadControlIds(db, row.projectId, row.id);
  return { ...row, controlIds };
}

export function createPostgresEvidenceRepository(
  db: AppDatabase,
): EvidenceRepository {
  return {
    async create(input: CreateEvidenceInput): Promise<EvidenceWithControlIds> {
      const projectId = input.projectId.trim();
      const title = input.title.trim();
      if (!projectId || !title) {
        throw new Error("projectId and title are required.");
      }
      if (!isEvidenceType(input.evidenceType)) {
        throw new Error("Invalid evidence type.");
      }
      const status: EvidenceStatus = input.status ?? "draft";
      if (!isEvidenceStatus(status) || status === "archived") {
        throw new Error("Invalid evidence status for create.");
      }
      if (!(await projectExists(db, projectId))) {
        throw new Error("Project not found.");
      }

      const id = randomUUID();
      const createdAt = nowIso();
      const controlIds = [
        ...new Set(
          (input.controlIds ?? [])
            .map((c) => c.trim())
            .filter((c) => c.length > 0),
        ),
      ];

      await db.transaction(async (tx) => {
        await tx.insert(evidence).values({
          id,
          projectId,
          title,
          description: input.description ?? "",
          owner: (input.owner ?? "").trim(),
          evidenceType: input.evidenceType,
          status,
          collectionDate: input.collectionDate ?? null,
          reviewDueDate: input.reviewDueDate ?? null,
          currentVersionId: null,
          createdAt,
          updatedAt: createdAt,
        });
        for (const controlId of controlIds) {
          await tx.insert(evidenceControls).values({
            id: randomUUID(),
            evidenceId: id,
            projectId,
            controlId,
            createdAt,
          });
        }
      });

      return {
        id,
        projectId,
        title,
        description: input.description ?? "",
        owner: (input.owner ?? "").trim(),
        evidenceType: input.evidenceType,
        status,
        collectionDate: input.collectionDate ?? null,
        reviewDueDate: input.reviewDueDate ?? null,
        currentVersionId: null,
        createdAt,
        updatedAt: createdAt,
        controlIds,
      };
    },

    async getById(projectId, evidenceId) {
      const rows = await db
        .select()
        .from(evidence)
        .where(
          and(eq(evidence.projectId, projectId), eq(evidence.id, evidenceId)),
        )
        .limit(1);
      if (!rows[0]) {
        return null;
      }
      return withControlIds(db, toEvidence(rows[0]));
    },

    async listByProject(projectId, options?: ListEvidenceOptions) {
      const includeArchived = options?.includeArchived === true;
      const controlId = options?.controlId?.trim();

      let evidenceIdsFilter: string[] | null = null;
      if (controlId) {
        const links = await db
          .select({ evidenceId: evidenceControls.evidenceId })
          .from(evidenceControls)
          .where(
            and(
              eq(evidenceControls.projectId, projectId),
              eq(evidenceControls.controlId, controlId),
            ),
          );
        evidenceIdsFilter = links.map((l) => l.evidenceId);
        if (evidenceIdsFilter.length === 0) {
          return [];
        }
      }

      const conditions = [eq(evidence.projectId, projectId)];
      if (!includeArchived) {
        conditions.push(ne(evidence.status, "archived"));
      }
      if (evidenceIdsFilter) {
        conditions.push(inArray(evidence.id, evidenceIdsFilter));
      }

      const rows = await db
        .select()
        .from(evidence)
        .where(and(...conditions))
        .orderBy(asc(evidence.title));

      const results: EvidenceWithControlIds[] = [];
      for (const row of rows) {
        results.push(await withControlIds(db, toEvidence(row)));
      }
      return results;
    },

    async search(input: SearchEvidenceInput): Promise<SearchEvidencePage> {
      const projectId = input.projectId.trim();
      if (!projectId) {
        return { items: [], nextCursor: null, hasMore: false };
      }

      const limitRaw = input.limit ?? EVIDENCE_SEARCH_DEFAULT_LIMIT;
      const limit = Math.min(
        Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : EVIDENCE_SEARCH_DEFAULT_LIMIT),
        EVIDENCE_SEARCH_MAX_LIMIT,
      );

      const conditions = [eq(evidence.projectId, projectId)];

      if (input.status) {
        if (!isEvidenceStatus(input.status)) {
          throw new Error("Invalid evidence status filter.");
        }
        conditions.push(eq(evidence.status, input.status));
      } else if (input.excludeArchived !== false) {
        conditions.push(ne(evidence.status, "archived"));
      }

      if (input.evidenceType) {
        if (!isEvidenceType(input.evidenceType)) {
          throw new Error("Invalid evidence type filter.");
        }
        conditions.push(eq(evidence.evidenceType, input.evidenceType));
      }

      const excludeControlId = input.excludeLinkedToControlId?.trim();
      if (excludeControlId) {
        conditions.push(
              not(
            exists(
              db
                .select({ id: evidenceControls.id })
                .from(evidenceControls)
                .where(
                  and(
                    eq(evidenceControls.projectId, projectId),
                    eq(evidenceControls.evidenceId, evidence.id),
                    eq(evidenceControls.controlId, excludeControlId),
                  ),
                ),
            ),
          ),
        );
      }

      const owner = input.owner?.trim() ?? "";
      if (owner) {
        conditions.push(ilike(evidence.owner, `%${escapeIlikePattern(owner)}%`));
      }

      if (input.hasCurrentVersion === true) {
        conditions.push(isNotNull(evidence.currentVersionId));
      } else if (input.hasCurrentVersion === false) {
        conditions.push(isNull(evidence.currentVersionId));
      }

      if (input.linked === true) {
        conditions.push(
          exists(
            db
              .select({ id: evidenceControls.id })
              .from(evidenceControls)
              .where(
                and(
                  eq(evidenceControls.projectId, projectId),
                  eq(evidenceControls.evidenceId, evidence.id),
                ),
              ),
          ),
        );
      } else if (input.linked === false) {
        conditions.push(
          not(
            exists(
              db
                .select({ id: evidenceControls.id })
                .from(evidenceControls)
                .where(
                  and(
                    eq(evidenceControls.projectId, projectId),
                    eq(evidenceControls.evidenceId, evidence.id),
                  ),
                ),
            ),
          ),
        );
      }

      const asOfParsed = parseEvidenceDate(input.asOfDate ?? utcTodayIsoDate());
      if (asOfParsed === null || asOfParsed === undefined) {
        throw new Error("Invalid asOfDate.");
      }
      const asOfDate = asOfParsed;
      const dueSoonEnd = addUtcDays(asOfDate, EVIDENCE_DUE_SOON_DAYS);
      if (dueSoonEnd === null) {
        throw new Error("Invalid asOfDate.");
      }

      if (input.freshness) {
        if (!isEvidenceFreshness(input.freshness)) {
          throw new Error("Invalid freshness filter.");
        }
        if (input.freshness === "no_review_date") {
          conditions.push(isNull(evidence.reviewDueDate));
        } else if (input.freshness === "overdue") {
          conditions.push(
            and(
              isNotNull(evidence.reviewDueDate),
              lt(evidence.reviewDueDate, asOfDate),
            )!,
          );
        } else if (input.freshness === "due_soon") {
          conditions.push(
            and(
              isNotNull(evidence.reviewDueDate),
              gte(evidence.reviewDueDate, asOfDate),
              lte(evidence.reviewDueDate, dueSoonEnd),
            )!,
          );
        } else {
          conditions.push(
            and(
              isNotNull(evidence.reviewDueDate),
              gt(evidence.reviewDueDate, dueSoonEnd),
            )!,
          );
        }
      }

      const query = input.query?.trim() ?? "";
      if (query) {
        const pattern = `%${escapeIlikePattern(query)}%`;
        conditions.push(
          or(
            ilike(evidence.title, pattern),
            ilike(evidence.description, pattern),
            ilike(evidence.owner, pattern),
            ilike(evidenceVersions.originalFilename, pattern),
          )!,
        );
      }

      const cursor = decodeEvidenceSearchCursor(input.cursor);
      if (input.cursor && input.cursor.trim() !== "" && !cursor) {
        throw new Error("Invalid search cursor.");
      }
      if (cursor) {
        conditions.push(
          or(
            lt(evidence.updatedAt, cursor.updatedAt),
            and(
              eq(evidence.updatedAt, cursor.updatedAt),
              lt(evidence.id, cursor.id),
            ),
          )!,
        );
      }

      const rows = await db
        .select({
          id: evidence.id,
          title: evidence.title,
          evidenceType: evidence.evidenceType,
          owner: evidence.owner,
          status: evidence.status,
          updatedAt: evidence.updatedAt,
          collectionDate: evidence.collectionDate,
          reviewDueDate: evidence.reviewDueDate,
          versionFilename: evidenceVersions.originalFilename,
          versionMimeType: evidenceVersions.mimeType,
          versionSizeBytes: evidenceVersions.sizeBytes,
          versionUploadedAt: evidenceVersions.uploadedAt,
        })
        .from(evidence)
        .leftJoin(
          evidenceVersions,
          eq(evidence.currentVersionId, evidenceVersions.id),
        )
        .where(and(...conditions))
        .orderBy(desc(evidence.updatedAt), desc(evidence.id))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const pageIds = pageRows.map((row) => row.id);
      const linkCounts = new Map<string, number>();
      if (pageIds.length > 0) {
        const linkRows = await db
          .select({
            evidenceId: evidenceControls.evidenceId,
            controlId: evidenceControls.controlId,
          })
          .from(evidenceControls)
          .where(
            and(
              eq(evidenceControls.projectId, projectId),
              inArray(evidenceControls.evidenceId, pageIds),
            ),
          );
        for (const link of linkRows) {
          linkCounts.set(
            link.evidenceId,
            (linkCounts.get(link.evidenceId) ?? 0) + 1,
          );
        }
      }
      const items: EvidenceSearchResult[] = pageRows.map((row) => {
        const evidenceType: EvidenceType = isEvidenceType(row.evidenceType)
          ? row.evidenceType
          : "other";
        const status: EvidenceStatus = isEvidenceStatus(row.status)
          ? row.status
          : "draft";
        return {
          id: row.id,
          title: row.title,
          evidenceType,
          owner: row.owner,
          status,
          updatedAt: row.updatedAt,
          collectionDate: row.collectionDate,
          reviewDueDate: row.reviewDueDate,
          freshness: deriveEvidenceFreshness(row.reviewDueDate, asOfDate),
          linkedControlCount: linkCounts.get(row.id) ?? 0,
          currentVersion:
            row.versionFilename &&
            row.versionMimeType &&
            typeof row.versionSizeBytes === "number" &&
            row.versionUploadedAt
              ? {
                  originalFilename: row.versionFilename,
                  mimeType: row.versionMimeType,
                  sizeBytes: row.versionSizeBytes,
                  uploadedAt: row.versionUploadedAt,
                }
              : null,
        };
      });

      const last = items[items.length - 1];
      const nextCursor =
        hasMore && last
          ? encodeEvidenceSearchCursor({
              updatedAt: last.updatedAt,
              id: last.id,
            })
          : null;

      return { items, nextCursor, hasMore };
    },

    async update(projectId, evidenceId, input: UpdateEvidenceInput) {
      const existing = await this.getById(projectId, evidenceId);
      if (!existing) {
        return null;
      }
      if (input.evidenceType !== undefined && !isEvidenceType(input.evidenceType)) {
        throw new Error("Invalid evidence type.");
      }
      if (input.status !== undefined && !isEvidenceStatus(input.status)) {
        throw new Error("Invalid evidence status.");
      }

      const updatedAt = nowIso();
      const next = {
        title: input.title !== undefined ? input.title.trim() : existing.title,
        description:
          input.description !== undefined
            ? input.description
            : existing.description,
        owner:
          input.owner !== undefined ? input.owner.trim() : existing.owner,
        evidenceType: input.evidenceType ?? existing.evidenceType,
        status: input.status ?? existing.status,
        collectionDate:
          input.collectionDate !== undefined
            ? input.collectionDate
            : existing.collectionDate,
        reviewDueDate:
          input.reviewDueDate !== undefined
            ? input.reviewDueDate
            : existing.reviewDueDate,
        updatedAt,
      };
      if (!next.title) {
        throw new Error("title is required.");
      }

      await db
        .update(evidence)
        .set(next)
        .where(
          and(eq(evidence.projectId, projectId), eq(evidence.id, evidenceId)),
        );

      return {
        ...existing,
        ...next,
        controlIds: existing.controlIds,
      };
    },

    async delete(projectId, evidenceId) {
      const existing = await this.getById(projectId, evidenceId);
      if (!existing) {
        return false;
      }
      await db
        .delete(evidence)
        .where(
          and(eq(evidence.projectId, projectId), eq(evidence.id, evidenceId)),
        );
      return true;
    },

    async listControlIds(projectId, evidenceId) {
      return loadControlIds(db, projectId, evidenceId);
    },

    async listLinksForControl(projectId, controlId) {
      const rows = await db
        .select()
        .from(evidenceControls)
        .where(
          and(
            eq(evidenceControls.projectId, projectId),
            eq(evidenceControls.controlId, controlId),
          ),
        )
        .orderBy(asc(evidenceControls.createdAt));
      return rows.map(toLink);
    },

    async associate(projectId, evidenceId, controlId) {
      const trimmedControlId = controlId.trim();
      if (!trimmedControlId) {
        throw new Error("controlId is required.");
      }
      const existing = await this.getById(projectId, evidenceId);
      if (!existing) {
        return null;
      }
      if (existing.controlIds.includes(trimmedControlId)) {
        const links = await this.listLinksForControl(projectId, trimmedControlId);
        return (
          links.find((link) => link.evidenceId === evidenceId) ?? {
            id: "",
            evidenceId,
            projectId,
            controlId: trimmedControlId,
            createdAt: existing.createdAt,
          }
        );
      }
      const id = randomUUID();
      const createdAt = nowIso();
      await db.insert(evidenceControls).values({
        id,
        evidenceId,
        projectId,
        controlId: trimmedControlId,
        createdAt,
      });
      return {
        id,
        evidenceId,
        projectId,
        controlId: trimmedControlId,
        createdAt,
      };
    },

    async dissociate(projectId, evidenceId, controlId) {
      const trimmed = controlId.trim();
      const existing = await this.getById(projectId, evidenceId);
      if (!existing || !existing.controlIds.includes(trimmed)) {
        return false;
      }
      await db
        .delete(evidenceControls)
        .where(
          and(
            eq(evidenceControls.projectId, projectId),
            eq(evidenceControls.evidenceId, evidenceId),
            eq(evidenceControls.controlId, trimmed),
          ),
        );
      return true;
    },
  };
}
