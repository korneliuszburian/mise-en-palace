CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."activation_decision_status" AS ENUM('included', 'excluded', 'abstained');--> statement-breakpoint
CREATE TYPE "public"."context_exclusion_reason" AS ENUM('stale', 'invalidated', 'low_trust', 'low_context_roi', 'over_budget', 'duplicate', 'irrelevant', 'unsafe', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."embedding_model_status" AS ENUM('active', 'deprecated', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."retrieval_candidate_kind" AS ENUM('memory', 'anti_memory', 'source', 'search');--> statement-breakpoint
CREATE TYPE "public"."retrieval_candidate_status" AS ENUM('candidate', 'included', 'excluded');--> statement-breakpoint
CREATE TYPE "public"."retrieval_run_status" AS ENUM('running', 'completed', 'abstained', 'failed');--> statement-breakpoint
CREATE TYPE "public"."retrieval_subject_type" AS ENUM('source_artifact', 'source_chunk', 'source_claim', 'memory_record', 'anti_memory_record', 'task_contract', 'search_document');--> statement-breakpoint
CREATE TYPE "public"."retrieval_validity_status" AS ENUM('active', 'expired', 'invalidated');--> statement-breakpoint
CREATE TABLE "activation_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retrieval_run_id" uuid NOT NULL,
	"context_assembly_id" uuid,
	"subject_type" "retrieval_subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"decision" "activation_decision_status" NOT NULL,
	"reason" text NOT NULL,
	"score" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "context_exclusions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"context_assembly_id" uuid NOT NULL,
	"subject_type" "retrieval_subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"reason" "context_exclusion_reason" NOT NULL,
	"explanation" text NOT NULL,
	"score" integer,
	"trust_tier" "source_trust_tier" DEFAULT 'medium' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "context_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"context_assembly_id" uuid NOT NULL,
	"subject_type" "retrieval_subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"reason" text NOT NULL,
	"expected_use" text NOT NULL,
	"token_estimate" integer,
	"trust_tier" "source_trust_tier" DEFAULT 'medium' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embedding_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"dimensions" integer NOT NULL,
	"distance_metric" text NOT NULL,
	"status" "embedding_model_status" DEFAULT 'active' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"embedding_model_id" uuid NOT NULL,
	"subject_type" "retrieval_subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"source_artifact_id" uuid,
	"source_chunk_id" uuid,
	"source_claim_id" uuid,
	"memory_record_id" uuid,
	"anti_memory_record_id" uuid,
	"embedding" vector(1536) NOT NULL,
	"content_hash" text NOT NULL,
	"trust_tier" "source_trust_tier" DEFAULT 'medium' NOT NULL,
	"validity_status" "retrieval_validity_status" DEFAULT 'active' NOT NULL,
	"metadata_filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retrieval_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retrieval_run_id" uuid NOT NULL,
	"kind" "retrieval_candidate_kind" NOT NULL,
	"status" "retrieval_candidate_status" DEFAULT 'candidate' NOT NULL,
	"subject_type" "retrieval_subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"trust_tier" "source_trust_tier" DEFAULT 'medium' NOT NULL,
	"lexical_score" integer,
	"vector_score" integer,
	"graph_score" integer,
	"temporal_score" integer,
	"context_roi_score" integer,
	"total_score" integer,
	"reason" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retrieval_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"task_contract_id" uuid,
	"status" "retrieval_run_status" DEFAULT 'running' NOT NULL,
	"query" text NOT NULL,
	"token_budget" integer,
	"metadata_filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"subject_type" "retrieval_subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"source_artifact_id" uuid,
	"source_chunk_id" uuid,
	"source_claim_id" uuid,
	"memory_record_id" uuid,
	"anti_memory_record_id" uuid,
	"trust_tier" "source_trust_tier" DEFAULT 'medium' NOT NULL,
	"validity_status" "retrieval_validity_status" DEFAULT 'active' NOT NULL,
	"language" text DEFAULT 'english' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"search_vector" "tsvector",
	"metadata_filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activation_decisions" ADD CONSTRAINT "activation_decisions_retrieval_run_id_retrieval_runs_id_fk" FOREIGN KEY ("retrieval_run_id") REFERENCES "public"."retrieval_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activation_decisions" ADD CONSTRAINT "activation_decisions_context_assembly_id_context_assemblies_id_fk" FOREIGN KEY ("context_assembly_id") REFERENCES "public"."context_assemblies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_exclusions" ADD CONSTRAINT "context_exclusions_context_assembly_id_context_assemblies_id_fk" FOREIGN KEY ("context_assembly_id") REFERENCES "public"."context_assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_items" ADD CONSTRAINT "context_items_context_assembly_id_context_assemblies_id_fk" FOREIGN KEY ("context_assembly_id") REFERENCES "public"."context_assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_embedding_model_id_embedding_models_id_fk" FOREIGN KEY ("embedding_model_id") REFERENCES "public"."embedding_models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_source_artifact_id_source_artifacts_id_fk" FOREIGN KEY ("source_artifact_id") REFERENCES "public"."source_artifacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_source_chunk_id_source_chunks_id_fk" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."source_chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_source_claim_id_source_claims_id_fk" FOREIGN KEY ("source_claim_id") REFERENCES "public"."source_claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_memory_record_id_memory_records_id_fk" FOREIGN KEY ("memory_record_id") REFERENCES "public"."memory_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_anti_memory_record_id_anti_memory_records_id_fk" FOREIGN KEY ("anti_memory_record_id") REFERENCES "public"."anti_memory_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_candidates" ADD CONSTRAINT "retrieval_candidates_retrieval_run_id_retrieval_runs_id_fk" FOREIGN KEY ("retrieval_run_id") REFERENCES "public"."retrieval_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_runs" ADD CONSTRAINT "retrieval_runs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_runs" ADD CONSTRAINT "retrieval_runs_task_contract_id_task_contracts_id_fk" FOREIGN KEY ("task_contract_id") REFERENCES "public"."task_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_source_artifact_id_source_artifacts_id_fk" FOREIGN KEY ("source_artifact_id") REFERENCES "public"."source_artifacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_source_chunk_id_source_chunks_id_fk" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."source_chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_source_claim_id_source_claims_id_fk" FOREIGN KEY ("source_claim_id") REFERENCES "public"."source_claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_memory_record_id_memory_records_id_fk" FOREIGN KEY ("memory_record_id") REFERENCES "public"."memory_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_anti_memory_record_id_anti_memory_records_id_fk" FOREIGN KEY ("anti_memory_record_id") REFERENCES "public"."anti_memory_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activation_decisions_retrieval_run_id_idx" ON "activation_decisions" USING btree ("retrieval_run_id");--> statement-breakpoint
CREATE INDEX "activation_decisions_context_assembly_id_idx" ON "activation_decisions" USING btree ("context_assembly_id");--> statement-breakpoint
CREATE INDEX "activation_decisions_subject_idx" ON "activation_decisions" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "activation_decisions_decision_idx" ON "activation_decisions" USING btree ("decision");--> statement-breakpoint
CREATE INDEX "context_exclusions_context_assembly_id_idx" ON "context_exclusions" USING btree ("context_assembly_id");--> statement-breakpoint
CREATE INDEX "context_exclusions_subject_idx" ON "context_exclusions" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "context_exclusions_reason_idx" ON "context_exclusions" USING btree ("reason");--> statement-breakpoint
CREATE INDEX "context_items_context_assembly_id_idx" ON "context_items" USING btree ("context_assembly_id");--> statement-breakpoint
CREATE INDEX "context_items_subject_idx" ON "context_items" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "context_items_position_idx" ON "context_items" USING btree ("position");--> statement-breakpoint
CREATE INDEX "embedding_models_provider_model_idx" ON "embedding_models" USING btree ("provider","model");--> statement-breakpoint
CREATE INDEX "embedding_models_status_idx" ON "embedding_models" USING btree ("status");--> statement-breakpoint
CREATE INDEX "embeddings_project_id_idx" ON "embeddings" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "embeddings_model_id_idx" ON "embeddings" USING btree ("embedding_model_id");--> statement-breakpoint
CREATE INDEX "embeddings_subject_idx" ON "embeddings" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "embeddings_validity_status_idx" ON "embeddings" USING btree ("validity_status");--> statement-breakpoint
CREATE INDEX "embeddings_valid_until_idx" ON "embeddings" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "embeddings_embedding_hnsw_idx" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "retrieval_candidates_retrieval_run_id_idx" ON "retrieval_candidates" USING btree ("retrieval_run_id");--> statement-breakpoint
CREATE INDEX "retrieval_candidates_status_idx" ON "retrieval_candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "retrieval_candidates_subject_idx" ON "retrieval_candidates" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "retrieval_candidates_total_score_idx" ON "retrieval_candidates" USING btree ("total_score");--> statement-breakpoint
CREATE INDEX "retrieval_runs_project_id_idx" ON "retrieval_runs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "retrieval_runs_task_contract_id_idx" ON "retrieval_runs" USING btree ("task_contract_id");--> statement-breakpoint
CREATE INDEX "retrieval_runs_status_idx" ON "retrieval_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "search_documents_project_id_idx" ON "search_documents" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "search_documents_subject_idx" ON "search_documents" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "search_documents_validity_status_idx" ON "search_documents" USING btree ("validity_status");--> statement-breakpoint
CREATE INDEX "search_documents_valid_until_idx" ON "search_documents" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "search_documents_search_vector_idx" ON "search_documents" USING gin ("search_vector");
