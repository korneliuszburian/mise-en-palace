CREATE TYPE "public"."reflection_status" AS ENUM('candidate', 'reviewed', 'rejected', 'superseded');--> statement-breakpoint
CREATE TABLE "reflection_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"execution_run_id" uuid,
	"task_contract_id" uuid,
	"status" "reflection_status" DEFAULT 'candidate' NOT NULL,
	"summary" text NOT NULL,
	"scope" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reflection_records" ADD CONSTRAINT "reflection_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reflection_records" ADD CONSTRAINT "reflection_records_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reflection_records" ADD CONSTRAINT "reflection_records_task_contract_id_task_contracts_id_fk" FOREIGN KEY ("task_contract_id") REFERENCES "public"."task_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reflection_records_project_id_idx" ON "reflection_records" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "reflection_records_execution_run_id_idx" ON "reflection_records" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "reflection_records_task_contract_id_idx" ON "reflection_records" USING btree ("task_contract_id");--> statement-breakpoint
CREATE INDEX "reflection_records_status_idx" ON "reflection_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reflection_records_created_at_idx" ON "reflection_records" USING btree ("created_at");