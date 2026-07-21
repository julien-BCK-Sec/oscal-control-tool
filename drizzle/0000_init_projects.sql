CREATE TABLE `project_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`snapshot_type` text NOT NULL,
	`name` text,
	`project_json` text NOT NULL,
	`project_revision` integer NOT NULL,
	`content_fingerprint` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_snapshots_project_created_idx` ON `project_snapshots` (`project_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`organization_name` text DEFAULT '' NOT NULL,
	`framework_id` text NOT NULL,
	`schema_version` integer NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`project_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projects_updated_at_idx` ON `projects` (`updated_at`);