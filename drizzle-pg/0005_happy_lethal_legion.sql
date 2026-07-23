CREATE TABLE "evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"evidence_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"collection_date" text,
	"review_due_date" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_controls" (
	"id" text PRIMARY KEY NOT NULL,
	"evidence_id" text NOT NULL,
	"project_id" text NOT NULL,
	"control_id" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "evidence_controls_evidence_control_uid" UNIQUE("evidence_id","control_id")
);
--> statement-breakpoint
ALTER TABLE "control_records" ADD COLUMN "evidence_requirement" text DEFAULT 'required' NOT NULL;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_controls" ADD CONSTRAINT "evidence_controls_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_controls" ADD CONSTRAINT "evidence_controls_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_project_id_idx" ON "evidence" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "evidence_project_status_idx" ON "evidence" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "evidence_controls_project_control_idx" ON "evidence_controls" USING btree ("project_id","control_id");--> statement-breakpoint
CREATE INDEX "evidence_controls_evidence_id_idx" ON "evidence_controls" USING btree ("evidence_id");