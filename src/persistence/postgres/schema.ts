import {
  index,
  integer,
  pgTable,
  text,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Better Auth identity + organization tables (ADR-015/017/018). Re-exported so
 * drizzle-kit (`drizzle-pg.config.ts`) and `getDb`/`openTestDb` include them in
 * the same PostgreSQL schema and migration set as the application tables.
 */
export * from "./auth-schema";

/**
 * PostgreSQL port of the SQLite schema (`src/persistence/sqlite/schema.ts`).
 * Column names, defaults, and semantics are identical. Timestamps remain
 * text ISO-8601 strings (not native `timestamp`) and `project_json` remains a
 * validated text document, matching the SQLite hybrid design.
 *
 * Hybrid project table: listable columns + validated project_json document.
 * Framework control text is never stored here.
 */
export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    organizationName: text("organization_name").notNull().default(""),
    /**
     * Owning organization (Milestone 1, ADR-016). Required on every project
     * (Work Package 3): the tenant boundary for all organization-scoped reads
     * and mutations. The SQLite-to-PostgreSQL migrator assigns it during the
     * one-shot cutover; the application derives it from the authenticated
     * organization context. Referential integrity to `organization` is
     * enforced in application repositories/services, not a hard DB foreign key
     * (projects and identity tables are migrated/bootstrapped independently).
     */
    organizationId: text("organization_id").notNull(),
    frameworkId: text("framework_id").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    revision: integer("revision").notNull().default(1),
    projectJson: text("project_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("projects_updated_at_idx").on(table.updatedAt),
    index("projects_organization_id_idx").on(table.organizationId),
  ],
);

/**
 * Automatic recovery snapshots, immutable named versions, and pre-restore
 * safety copies. Differentiated by snapshot_type.
 */
export const projectSnapshots = pgTable(
  "project_snapshots",
  {
    id: text("id").primaryKey().notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    snapshotType: text("snapshot_type").notNull(),
    name: text("name"),
    projectJson: text("project_json").notNull(),
    projectRevision: integer("project_revision").notNull(),
    contentFingerprint: text("content_fingerprint").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("project_snapshots_project_created_idx").on(
      table.projectId,
      table.createdAt,
    ),
  ],
);

/**
 * Application-level control management metadata.
 * Scoped to a project; references a framework control id (e.g. ac-2).
 * Never stored inside OSCAL documents or project_json implementations.
 */
export const controlRecords = pgTable(
  "control_records",
  {
    id: text("id").primaryKey().notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    controlId: text("control_id").notNull(),
    owner: text("owner").notNull().default(""),
    coOwner: text("co_owner").notNull().default(""),
    businessUnit: text("business_unit").notNull().default(""),
    implementationStatus: text("implementation_status")
      .notNull()
      .default("draft"),
    /** Review workflow only — independent of implementation_status. */
    reviewStatus: text("review_status").notNull().default("not_reviewed"),
    reviewDueDate: text("review_due_date"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    unique("control_records_project_control_uid").on(
      table.projectId,
      table.controlId,
    ),
    index("control_records_project_id_idx").on(table.projectId),
  ],
);

/**
 * Append-only activity stream for ControlRecord operational metadata.
 * Independent of named project_json versions / OSCAL document history.
 */
export const controlActivities = pgTable(
  "control_activities",
  {
    id: text("id").primaryKey().notNull(),
    controlRecordId: text("control_record_id")
      .notNull()
      .references(() => controlRecords.id, { onDelete: "cascade" }),
    activityType: text("activity_type").notNull(),
    actorId: text("actor_id"),
    actorDisplayName: text("actor_display_name"),
    fieldName: text("field_name"),
    previousValue: text("previous_value"),
    newValue: text("new_value"),
    metadataJson: text("metadata_json"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("control_activities_control_record_id_idx").on(
      table.controlRecordId,
    ),
    index("control_activities_created_at_idx").on(table.createdAt),
  ],
);

export type ProjectRow = typeof projects.$inferSelect;
export type ProjectSnapshotRow = typeof projectSnapshots.$inferSelect;
export type ControlRecordRow = typeof controlRecords.$inferSelect;
export type ControlActivityRow = typeof controlActivities.$inferSelect;
