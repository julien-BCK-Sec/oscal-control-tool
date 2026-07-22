ALTER TABLE "projects" ADD COLUMN "organization_id" text;--> statement-breakpoint
CREATE INDEX "projects_organization_id_idx" ON "projects" USING btree ("organization_id");