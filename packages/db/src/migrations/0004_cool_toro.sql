CREATE TYPE "public"."memory_application_outcome" AS ENUM('helped', 'hurt', 'neutral', 'stale');--> statement-breakpoint
CREATE TYPE "public"."memory_feedback_event_type" AS ENUM('strengthened', 'demoted', 'invalidated', 'corrected', 'stale_detected');--> statement-breakpoint
ALTER TYPE "public"."memory_candidate_status" ADD VALUE 'proposed' BEFORE 'candidate';--> statement-breakpoint
ALTER TYPE "public"."memory_candidate_status" ADD VALUE 'superseded';--> statement-breakpoint
ALTER TYPE "public"."memory_record_status" ADD VALUE 'deprecated' BEFORE 'stale';--> statement-breakpoint
ALTER TABLE "memory_applications" ALTER COLUMN "outcome" SET DATA TYPE "public"."memory_application_outcome" USING "outcome"::"public"."memory_application_outcome";--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD COLUMN "execution_run_id" uuid;--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD COLUMN "rejected_claim" text;--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD COLUMN "invalidated_by_source_claim_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD COLUMN "invalidated_by_source_claim_id" uuid;--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD COLUMN "applies_to" text;--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD COLUMN "may_revisit_when" text;--> statement-breakpoint
ALTER TABLE "memory_applications" ADD COLUMN "execution_run_id" uuid;--> statement-breakpoint
ALTER TABLE "memory_applications" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD COLUMN "execution_run_id" uuid;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD COLUMN "feedback_delta_id" uuid;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD COLUMN "invalidation_rule" text;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD COLUMN "source_claim_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD COLUMN "reviewer" text;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD COLUMN "valid_from" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD COLUMN "valid_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "memory_feedback_events" ADD COLUMN "execution_run_id" uuid;--> statement-breakpoint
ALTER TABLE "memory_feedback_events" ADD COLUMN "event_type" "memory_feedback_event_type";--> statement-breakpoint
ALTER TABLE "memory_feedback_events" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "memory_feedback_events" ADD COLUMN "evidence_ref" text;--> statement-breakpoint
ALTER TABLE "memory_record_versions" ADD COLUMN "created_from_candidate_id" uuid;--> statement-breakpoint
ALTER TABLE "memory_record_versions" ADD COLUMN "invalidation_rule" text;--> statement-breakpoint
ALTER TABLE "memory_record_versions" ADD COLUMN "valid_from" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_record_versions" ADD COLUMN "valid_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "memory_records" ADD COLUMN "current_version_id" uuid;--> statement-breakpoint
ALTER TABLE "memory_records" ADD COLUMN "invalidation_rule" text;--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD CONSTRAINT "anti_memory_records_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD CONSTRAINT "anti_memory_records_invalidated_by_source_claim_id_source_claims_id_fk" FOREIGN KEY ("invalidated_by_source_claim_id") REFERENCES "public"."source_claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_applications" ADD CONSTRAINT "memory_applications_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_feedback_delta_id_feedback_deltas_id_fk" FOREIGN KEY ("feedback_delta_id") REFERENCES "public"."feedback_deltas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_feedback_events" ADD CONSTRAINT "memory_feedback_events_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_record_versions" ADD CONSTRAINT "memory_record_versions_created_from_candidate_id_memory_candidates_id_fk" FOREIGN KEY ("created_from_candidate_id") REFERENCES "public"."memory_candidates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anti_memory_records_execution_run_id_idx" ON "anti_memory_records" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "anti_memory_records_invalidated_by_source_claim_id_idx" ON "anti_memory_records" USING btree ("invalidated_by_source_claim_id");--> statement-breakpoint
CREATE INDEX "memory_applications_execution_run_id_idx" ON "memory_applications" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "memory_candidates_execution_run_id_idx" ON "memory_candidates" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "memory_candidates_feedback_delta_id_idx" ON "memory_candidates" USING btree ("feedback_delta_id");--> statement-breakpoint
CREATE INDEX "memory_candidates_valid_until_idx" ON "memory_candidates" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "memory_feedback_events_execution_run_id_idx" ON "memory_feedback_events" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "memory_feedback_events_event_type_idx" ON "memory_feedback_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "memory_record_versions_created_from_candidate_id_idx" ON "memory_record_versions" USING btree ("created_from_candidate_id");--> statement-breakpoint
CREATE INDEX "memory_records_current_version_id_idx" ON "memory_records" USING btree ("current_version_id");