CREATE TABLE "anti_memory_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"execution_run_id" uuid,
	"feedback_delta_id" uuid,
	"proposed_by" text NOT NULL,
	"key" text NOT NULL,
	"status" "memory_candidate_status" DEFAULT 'candidate' NOT NULL,
	"rejected_claim" text,
	"reason" text,
	"invalidated_by_source_claim_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"invalidated_by_source_claim_id" uuid,
	"applies_to" text,
	"may_revisit_when" text,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"owner" text NOT NULL,
	"confidence" integer NOT NULL,
	"source_lineage" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewer" text,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD COLUMN "created_from_candidate_id" uuid;--> statement-breakpoint
ALTER TABLE "anti_memory_candidates" ADD CONSTRAINT "anti_memory_candidates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anti_memory_candidates" ADD CONSTRAINT "anti_memory_candidates_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anti_memory_candidates" ADD CONSTRAINT "anti_memory_candidates_feedback_delta_id_feedback_deltas_id_fk" FOREIGN KEY ("feedback_delta_id") REFERENCES "public"."feedback_deltas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anti_memory_candidates" ADD CONSTRAINT "anti_memory_candidates_invalidated_by_source_claim_id_source_claims_id_fk" FOREIGN KEY ("invalidated_by_source_claim_id") REFERENCES "public"."source_claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anti_memory_candidates_project_id_idx" ON "anti_memory_candidates" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "anti_memory_candidates_execution_run_id_idx" ON "anti_memory_candidates" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "anti_memory_candidates_feedback_delta_id_idx" ON "anti_memory_candidates" USING btree ("feedback_delta_id");--> statement-breakpoint
CREATE INDEX "anti_memory_candidates_status_idx" ON "anti_memory_candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "anti_memory_candidates_key_idx" ON "anti_memory_candidates" USING btree ("key");--> statement-breakpoint
CREATE INDEX "anti_memory_candidates_valid_until_idx" ON "anti_memory_candidates" USING btree ("valid_until");--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD CONSTRAINT "anti_memory_records_created_from_candidate_id_anti_memory_candidates_id_fk" FOREIGN KEY ("created_from_candidate_id") REFERENCES "public"."anti_memory_candidates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anti_memory_records_created_from_candidate_id_idx" ON "anti_memory_records" USING btree ("created_from_candidate_id");