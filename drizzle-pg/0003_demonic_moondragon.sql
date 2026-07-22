CREATE TABLE "assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"control_id" text NOT NULL,
	"assignee_user_id" text NOT NULL,
	"assignment_role" text NOT NULL,
	"assigned_by_user_id" text NOT NULL,
	"assigned_at" text NOT NULL,
	"completed_at" text
);
--> statement-breakpoint
CREATE TABLE "comment_mentions" (
	"id" text PRIMARY KEY NOT NULL,
	"comment_id" text NOT NULL,
	"mentioned_user_id" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "comment_mentions_comment_user_uid" UNIQUE("comment_id","mentioned_user_id")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"control_id" text NOT NULL,
	"parent_comment_id" text,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"deleted_at" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"recipient_user_id" text NOT NULL,
	"actor_user_id" text,
	"event_type" text NOT NULL,
	"related_object_type" text NOT NULL,
	"related_object_id" text NOT NULL,
	"project_id" text,
	"control_id" text,
	"summary" text NOT NULL,
	"read_at" text,
	"deleted_at" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_mentions" ADD CONSTRAINT "comment_mentions_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignments_org_project_control_idx" ON "assignments" USING btree ("organization_id","project_id","control_id");--> statement-breakpoint
CREATE INDEX "assignments_assignee_user_id_idx" ON "assignments" USING btree ("assignee_user_id");--> statement-breakpoint
CREATE INDEX "assignments_organization_id_idx" ON "assignments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "comment_mentions_mentioned_user_id_idx" ON "comment_mentions" USING btree ("mentioned_user_id");--> statement-breakpoint
CREATE INDEX "comments_org_project_control_idx" ON "comments" USING btree ("organization_id","project_id","control_id");--> statement-breakpoint
CREATE INDEX "comments_parent_comment_id_idx" ON "comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX "comments_organization_id_idx" ON "comments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notifications_recipient_created_idx" ON "notifications" USING btree ("recipient_user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_recipient_unread_idx" ON "notifications" USING btree ("recipient_user_id","read_at");--> statement-breakpoint
CREATE INDEX "notifications_organization_id_idx" ON "notifications" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_dedupe_uid" ON "notifications" USING btree ("recipient_user_id","event_type","related_object_id") WHERE "notifications"."deleted_at" is null;