CREATE TABLE `control_records` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`control_id` text NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`co_owner` text DEFAULT '' NOT NULL,
	`business_unit` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`review_due_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `control_records_project_id_idx` ON `control_records` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `control_records_project_control_uid` ON `control_records` (`project_id`,`control_id`);