CREATE TABLE "control_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"control_record_id" text NOT NULL,
	"activity_type" text NOT NULL,
	"actor_id" text,
	"actor_display_name" text,
	"field_name" text,
	"previous_value" text,
	"new_value" text,
	"metadata_json" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "control_records" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"control_id" text NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"co_owner" text DEFAULT '' NOT NULL,
	"business_unit" text DEFAULT '' NOT NULL,
	"implementation_status" text DEFAULT 'draft' NOT NULL,
	"review_status" text DEFAULT 'not_reviewed' NOT NULL,
	"review_due_date" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "control_records_project_control_uid" UNIQUE("project_id","control_id")
);
--> statement-breakpoint
CREATE TABLE "project_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"snapshot_type" text NOT NULL,
	"name" text,
	"project_json" text NOT NULL,
	"project_revision" integer NOT NULL,
	"content_fingerprint" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_name" text DEFAULT '' NOT NULL,
	"framework_id" text NOT NULL,
	"schema_version" integer NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"project_json" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "control_activities" ADD CONSTRAINT "control_activities_control_record_id_control_records_id_fk" FOREIGN KEY ("control_record_id") REFERENCES "public"."control_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_records" ADD CONSTRAINT "control_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_snapshots" ADD CONSTRAINT "project_snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "control_activities_control_record_id_idx" ON "control_activities" USING btree ("control_record_id");--> statement-breakpoint
CREATE INDEX "control_activities_created_at_idx" ON "control_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "control_records_project_id_idx" ON "control_records" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_snapshots_project_created_idx" ON "project_snapshots" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");