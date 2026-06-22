CREATE TYPE "public"."retrieval_run_mode" AS ENUM('lexical', 'vector', 'hybrid', 'graph', 'mixed');--> statement-breakpoint
ALTER TYPE "public"."activation_decision_status" ADD VALUE 'deferred';--> statement-breakpoint
ALTER TYPE "public"."activation_decision_status" ADD VALUE 'conflict';--> statement-breakpoint
ALTER TYPE "public"."activation_decision_status" ADD VALUE 'stale';--> statement-breakpoint
ALTER TYPE "public"."retrieval_subject_type" ADD VALUE 'evidence_bundle';--> statement-breakpoint
ALTER TYPE "public"."retrieval_subject_type" ADD VALUE 'review_assessment';--> statement-breakpoint
ALTER TYPE "public"."retrieval_subject_type" ADD VALUE 'architecture_decision';--> statement-breakpoint
ALTER TYPE "public"."retrieval_subject_type" ADD VALUE 'run_event';--> statement-breakpoint
ALTER TABLE "activation_decisions" ADD COLUMN "retrieval_candidate_id" uuid;--> statement-breakpoint
ALTER TABLE "activation_decisions" ADD COLUMN "context_budget_cost" integer;--> statement-breakpoint
ALTER TABLE "activation_decisions" ADD COLUMN "expected_decision_impact" text;--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "search_document_id" uuid;--> statement-breakpoint
ALTER TABLE "retrieval_candidates" ADD COLUMN "search_document_id" uuid;--> statement-breakpoint
ALTER TABLE "retrieval_candidates" ADD COLUMN "score" integer;--> statement-breakpoint
ALTER TABLE "retrieval_runs" ADD COLUMN "execution_run_id" uuid;--> statement-breakpoint
ALTER TABLE "retrieval_runs" ADD COLUMN "mode" "retrieval_run_mode" DEFAULT 'mixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "retrieval_runs" ADD COLUMN "budget" integer;--> statement-breakpoint
ALTER TABLE "retrieval_runs" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "search_documents" ADD COLUMN "evidence_bundle_id" uuid;--> statement-breakpoint
ALTER TABLE "search_documents" ADD COLUMN "review_assessment_id" uuid;--> statement-breakpoint
ALTER TABLE "search_documents" ADD COLUMN "source_decision_id" uuid;--> statement-breakpoint
ALTER TABLE "search_documents" ADD COLUMN "run_event_id" uuid;--> statement-breakpoint
ALTER TABLE "search_documents" ADD COLUMN "search_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "activation_decisions" ADD CONSTRAINT "activation_decisions_retrieval_candidate_id_retrieval_candidates_id_fk" FOREIGN KEY ("retrieval_candidate_id") REFERENCES "public"."retrieval_candidates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_search_document_id_search_documents_id_fk" FOREIGN KEY ("search_document_id") REFERENCES "public"."search_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_candidates" ADD CONSTRAINT "retrieval_candidates_search_document_id_search_documents_id_fk" FOREIGN KEY ("search_document_id") REFERENCES "public"."search_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_runs" ADD CONSTRAINT "retrieval_runs_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_evidence_bundle_id_evidence_bundles_id_fk" FOREIGN KEY ("evidence_bundle_id") REFERENCES "public"."evidence_bundles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_review_assessment_id_review_assessments_id_fk" FOREIGN KEY ("review_assessment_id") REFERENCES "public"."review_assessments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_source_decision_id_source_decisions_id_fk" FOREIGN KEY ("source_decision_id") REFERENCES "public"."source_decisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_run_event_id_run_events_id_fk" FOREIGN KEY ("run_event_id") REFERENCES "public"."run_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activation_decisions_retrieval_candidate_id_idx" ON "activation_decisions" USING btree ("retrieval_candidate_id");--> statement-breakpoint
CREATE INDEX "embeddings_search_document_id_idx" ON "embeddings" USING btree ("search_document_id");--> statement-breakpoint
CREATE INDEX "retrieval_candidates_search_document_id_idx" ON "retrieval_candidates" USING btree ("search_document_id");--> statement-breakpoint
CREATE INDEX "retrieval_runs_execution_run_id_idx" ON "retrieval_runs" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "search_documents_evidence_bundle_id_idx" ON "search_documents" USING btree ("evidence_bundle_id");--> statement-breakpoint
CREATE INDEX "search_documents_review_assessment_id_idx" ON "search_documents" USING btree ("review_assessment_id");--> statement-breakpoint
CREATE INDEX "search_documents_source_decision_id_idx" ON "search_documents" USING btree ("source_decision_id");--> statement-breakpoint
CREATE INDEX "search_documents_run_event_id_idx" ON "search_documents" USING btree ("run_event_id");