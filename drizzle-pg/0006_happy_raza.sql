CREATE TABLE "evidence_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"evidence_id" text NOT NULL,
	"project_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"original_filename" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"uploaded_by_user_id" text NOT NULL,
	"uploaded_at" text NOT NULL,
	CONSTRAINT "evidence_versions_evidence_version_uid" UNIQUE("evidence_id","version_number"),
	CONSTRAINT "evidence_versions_storage_key_uid" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "current_version_id" text;--> statement-breakpoint
ALTER TABLE "evidence_versions" ADD CONSTRAINT "evidence_versions_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_versions" ADD CONSTRAINT "evidence_versions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_versions_evidence_id_idx" ON "evidence_versions" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "evidence_versions_project_id_idx" ON "evidence_versions" USING btree ("project_id");