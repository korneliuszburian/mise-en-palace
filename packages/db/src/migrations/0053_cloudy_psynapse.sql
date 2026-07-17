ALTER TABLE "memory_candidates" ADD COLUMN "review_assessment_id" uuid;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD COLUMN "usefulness_application_id" text;--> statement-breakpoint
ALTER TABLE "memory_candidates" DROP CONSTRAINT "memory_candidates_execution_run_id_execution_runs_id_fk";--> statement-breakpoint
ALTER TABLE "memory_candidates" DROP CONSTRAINT "memory_candidates_feedback_delta_id_feedback_deltas_id_fk";--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_feedback_delta_id_feedback_deltas_id_fk" FOREIGN KEY ("feedback_delta_id") REFERENCES "public"."feedback_deltas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_review_assessment_id_review_assessments_id_fk" FOREIGN KEY ("review_assessment_id") REFERENCES "public"."review_assessments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_usefulness_application_id_usefulness_applications_application_id_fk" FOREIGN KEY ("usefulness_application_id") REFERENCES "public"."usefulness_applications"("application_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memory_candidates_review_assessment_id_idx" ON "memory_candidates" USING btree ("review_assessment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memory_candidates_usefulness_application_id_unique" ON "memory_candidates" USING btree ("usefulness_application_id");
