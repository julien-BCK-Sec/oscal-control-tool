import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Hybrid project table: listable columns + validated project_json document.
 * Framework control text is never stored here.
 */
export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    organizationName: text("organization_name").notNull().default(""),
    frameworkId: text("framework_id").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    revision: integer("revision").notNull().default(1),
    projectJson: text("project_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("projects_updated_at_idx").on(table.updatedAt)],
);

/**
 * Automatic recovery snapshots, immutable named versions, and pre-restore
 * safety copies. Differentiated by snapshot_type.
 */
export const projectSnapshots = sqliteTable(
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

export type ProjectRow = typeof projects.$inferSelect;
export type ProjectSnapshotRow = typeof projectSnapshots.$inferSelect;
