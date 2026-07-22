CREATE TABLE `control_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`control_record_id` text NOT NULL,
	`activity_type` text NOT NULL,
	`actor_id` text,
	`actor_display_name` text,
	`field_name` text,
	`previous_value` text,
	`new_value` text,
	`metadata_json` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`control_record_id`) REFERENCES `control_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `control_activities_control_record_id_idx` ON `control_activities` (`control_record_id`);--> statement-breakpoint
CREATE INDEX `control_activities_created_at_idx` ON `control_activities` (`created_at`);