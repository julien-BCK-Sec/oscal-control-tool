CREATE TABLE "workflow_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"workflow_rule_id" text NOT NULL,
	"triggering_event_id" text NOT NULL,
	"triggering_event_type" text NOT NULL,
	"correlation_id" text NOT NULL,
	"project_id" text,
	"control_id" text,
	"status" text NOT NULL,
	"conditions_matched" boolean NOT NULL,
	"duration_ms" integer NOT NULL,
	"error_message" text,
	"detail_json" text NOT NULL,
	"started_at" text NOT NULL,
	"finished_at" text NOT NULL,
	CONSTRAINT "workflow_executions_event_rule_uid" UNIQUE("triggering_event_id","workflow_rule_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"trigger_type" text NOT NULL,
	"conditions_json" text NOT NULL,
	"actions_json" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_rule_id_workflow_rules_id_fk" FOREIGN KEY ("workflow_rule_id") REFERENCES "public"."workflow_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_executions_org_started_idx" ON "workflow_executions" USING btree ("organization_id","started_at");--> statement-breakpoint
CREATE INDEX "workflow_executions_rule_started_idx" ON "workflow_executions" USING btree ("workflow_rule_id","started_at");--> statement-breakpoint
CREATE INDEX "workflow_rules_org_enabled_idx" ON "workflow_rules" USING btree ("organization_id","enabled");--> statement-breakpoint
CREATE INDEX "workflow_rules_org_trigger_idx" ON "workflow_rules" USING btree ("organization_id","trigger_type");