ALTER TABLE `control_records` RENAME COLUMN `status` TO `implementation_status`;--> statement-breakpoint
UPDATE `control_activities` SET `activity_type` = 'implementation_status_changed' WHERE `activity_type` = 'status_changed';--> statement-breakpoint
UPDATE `control_activities` SET `field_name` = 'implementationStatus' WHERE `field_name` = 'status' AND `activity_type` = 'implementation_status_changed';
