CREATE TYPE "public"."memory_activation_decision" AS ENUM('included', 'excluded', 'abstained');--> statement-breakpoint
CREATE TYPE "public"."memory_candidate_status" AS ENUM('candidate', 'accepted', 'rejected', 'applied');--> statement-breakpoint
CREATE TYPE "public"."memory_edge_kind" AS ENUM('supports', 'contradicts', 'supersedes', 'depends_on', 'duplicates', 'qualifies');--> statement-breakpoint
CREATE TYPE "public"."memory_feedback_direction" AS ENUM('positive', 'negative', 'correction');--> statement-breakpoint
CREATE TYPE "public"."memory_record_kind" AS ENUM('fact', 'preference', 'constraint', 'procedure', 'pattern', 'risk');--> statement-breakpoint
CREATE TYPE "public"."memory_record_status" AS ENUM('active', 'stale', 'invalidated', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."source_artifact_kind" AS ENUM('doc', 'file', 'url', 'paper', 'run', 'operator_input', 'external_doc');--> statement-breakpoint
CREATE TYPE "public"."source_claim_edge_kind" AS ENUM('supports', 'contradicts', 'qualifies', 'depends_on', 'supersedes', 'duplicates');--> statement-breakpoint
CREATE TYPE "public"."source_decision_status" AS ENUM('adopt', 'reject', 'defer', 'lab_test');--> statement-breakpoint
CREATE TYPE "public"."source_support_type" AS ENUM('supports', 'contradicts', 'qualifies', 'background', 'does_not_support');--> statement-breakpoint
CREATE TYPE "public"."source_trust_tier" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TABLE "anti_memory_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"key" text NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"owner" text NOT NULL,
	"confidence" integer NOT NULL,
	"source_lineage" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"invalidation_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_activation_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"context_assembly_id" uuid NOT NULL,
	"memory_record_id" uuid,
	"anti_memory_record_id" uuid,
	"decision" "memory_activation_decision" NOT NULL,
	"reason" text NOT NULL,
	"score" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_record_id" uuid NOT NULL,
	"task_contract_id" uuid,
	"context_assembly_id" uuid,
	"expected_use" text NOT NULL,
	"outcome" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"proposed_by" text NOT NULL,
	"kind" "memory_record_kind" NOT NULL,
	"status" "memory_candidate_status" DEFAULT 'candidate' NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"owner" text NOT NULL,
	"confidence" integer NOT NULL,
	"application_guidance" text NOT NULL,
	"source_lineage" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_user_preference" boolean DEFAULT false NOT NULL,
	"rejection_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_memory_record_id" uuid NOT NULL,
	"to_memory_record_id" uuid NOT NULL,
	"kind" "memory_edge_kind" NOT NULL,
	"strength" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_feedback_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_record_id" uuid NOT NULL,
	"feedback_delta_id" uuid,
	"direction" "memory_feedback_direction" NOT NULL,
	"note" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_record_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_record_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"owner" text NOT NULL,
	"confidence" integer NOT NULL,
	"application_guidance" text NOT NULL,
	"source_lineage" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"key" text NOT NULL,
	"kind" "memory_record_kind" NOT NULL,
	"status" "memory_record_status" DEFAULT 'active' NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"owner" text NOT NULL,
	"confidence" integer NOT NULL,
	"application_guidance" text NOT NULL,
	"source_lineage" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_user_preference" boolean DEFAULT false NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"invalidation_reason" text,
	"positive_feedback_count" integer DEFAULT 0 NOT NULL,
	"negative_feedback_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"kind" "source_artifact_kind" NOT NULL,
	"trust_tier" "source_trust_tier" NOT NULL,
	"uri" text NOT NULL,
	"title" text NOT NULL,
	"content_hash" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_artifact_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"heading" text,
	"content" text NOT NULL,
	"token_count" integer,
	"content_hash" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_claim_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_source_claim_id" uuid NOT NULL,
	"to_source_claim_id" uuid NOT NULL,
	"kind" "source_claim_edge_kind" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_artifact_id" uuid NOT NULL,
	"source_chunk_id" uuid,
	"claim" text NOT NULL,
	"mechanism" text NOT NULL,
	"krn_implication" text NOT NULL,
	"does_not_prove" text NOT NULL,
	"trust_tier" "source_trust_tier" NOT NULL,
	"support_type" "source_support_type" NOT NULL,
	"consumer" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"source_claim_id" uuid,
	"status" "source_decision_status" NOT NULL,
	"decision" text NOT NULL,
	"rationale" text NOT NULL,
	"falsifier" text NOT NULL,
	"consumer" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_rejections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"source_artifact_id" uuid,
	"source_claim_id" uuid,
	"reason" text NOT NULL,
	"does_not_prove" text NOT NULL,
	"consumer" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rejected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_artifact_id" uuid NOT NULL,
	"snapshot_uri" text NOT NULL,
	"content_hash" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD CONSTRAINT "anti_memory_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_activation_traces" ADD CONSTRAINT "memory_activation_traces_context_assembly_id_context_assemblies_id_fk" FOREIGN KEY ("context_assembly_id") REFERENCES "public"."context_assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_activation_traces" ADD CONSTRAINT "memory_activation_traces_memory_record_id_memory_records_id_fk" FOREIGN KEY ("memory_record_id") REFERENCES "public"."memory_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_activation_traces" ADD CONSTRAINT "memory_activation_traces_anti_memory_record_id_anti_memory_records_id_fk" FOREIGN KEY ("anti_memory_record_id") REFERENCES "public"."anti_memory_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_applications" ADD CONSTRAINT "memory_applications_memory_record_id_memory_records_id_fk" FOREIGN KEY ("memory_record_id") REFERENCES "public"."memory_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_applications" ADD CONSTRAINT "memory_applications_task_contract_id_task_contracts_id_fk" FOREIGN KEY ("task_contract_id") REFERENCES "public"."task_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_applications" ADD CONSTRAINT "memory_applications_context_assembly_id_context_assemblies_id_fk" FOREIGN KEY ("context_assembly_id") REFERENCES "public"."context_assemblies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_edges" ADD CONSTRAINT "memory_edges_from_memory_record_id_memory_records_id_fk" FOREIGN KEY ("from_memory_record_id") REFERENCES "public"."memory_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_edges" ADD CONSTRAINT "memory_edges_to_memory_record_id_memory_records_id_fk" FOREIGN KEY ("to_memory_record_id") REFERENCES "public"."memory_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_feedback_events" ADD CONSTRAINT "memory_feedback_events_memory_record_id_memory_records_id_fk" FOREIGN KEY ("memory_record_id") REFERENCES "public"."memory_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_feedback_events" ADD CONSTRAINT "memory_feedback_events_feedback_delta_id_feedback_deltas_id_fk" FOREIGN KEY ("feedback_delta_id") REFERENCES "public"."feedback_deltas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_record_versions" ADD CONSTRAINT "memory_record_versions_memory_record_id_memory_records_id_fk" FOREIGN KEY ("memory_record_id") REFERENCES "public"."memory_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_records" ADD CONSTRAINT "memory_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_artifacts" ADD CONSTRAINT "source_artifacts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_chunks" ADD CONSTRAINT "source_chunks_source_artifact_id_source_artifacts_id_fk" FOREIGN KEY ("source_artifact_id") REFERENCES "public"."source_artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_claim_edges" ADD CONSTRAINT "source_claim_edges_from_source_claim_id_source_claims_id_fk" FOREIGN KEY ("from_source_claim_id") REFERENCES "public"."source_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_claim_edges" ADD CONSTRAINT "source_claim_edges_to_source_claim_id_source_claims_id_fk" FOREIGN KEY ("to_source_claim_id") REFERENCES "public"."source_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_claims" ADD CONSTRAINT "source_claims_source_artifact_id_source_artifacts_id_fk" FOREIGN KEY ("source_artifact_id") REFERENCES "public"."source_artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_claims" ADD CONSTRAINT "source_claims_source_chunk_id_source_chunks_id_fk" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."source_chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_decisions" ADD CONSTRAINT "source_decisions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_decisions" ADD CONSTRAINT "source_decisions_source_claim_id_source_claims_id_fk" FOREIGN KEY ("source_claim_id") REFERENCES "public"."source_claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_rejections" ADD CONSTRAINT "source_rejections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_rejections" ADD CONSTRAINT "source_rejections_source_artifact_id_source_artifacts_id_fk" FOREIGN KEY ("source_artifact_id") REFERENCES "public"."source_artifacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_rejections" ADD CONSTRAINT "source_rejections_source_claim_id_source_claims_id_fk" FOREIGN KEY ("source_claim_id") REFERENCES "public"."source_claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_snapshots" ADD CONSTRAINT "source_snapshots_source_artifact_id_source_artifacts_id_fk" FOREIGN KEY ("source_artifact_id") REFERENCES "public"."source_artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "anti_memory_records_project_key_unique" ON "anti_memory_records" USING btree ("project_id","key");--> statement-breakpoint
CREATE INDEX "anti_memory_records_project_id_idx" ON "anti_memory_records" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "anti_memory_records_valid_until_idx" ON "anti_memory_records" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "memory_activation_traces_context_assembly_id_idx" ON "memory_activation_traces" USING btree ("context_assembly_id");--> statement-breakpoint
CREATE INDEX "memory_activation_traces_memory_record_id_idx" ON "memory_activation_traces" USING btree ("memory_record_id");--> statement-breakpoint
CREATE INDEX "memory_activation_traces_anti_memory_record_id_idx" ON "memory_activation_traces" USING btree ("anti_memory_record_id");--> statement-breakpoint
CREATE INDEX "memory_activation_traces_decision_idx" ON "memory_activation_traces" USING btree ("decision");--> statement-breakpoint
CREATE INDEX "memory_applications_memory_record_id_idx" ON "memory_applications" USING btree ("memory_record_id");--> statement-breakpoint
CREATE INDEX "memory_applications_task_contract_id_idx" ON "memory_applications" USING btree ("task_contract_id");--> statement-breakpoint
CREATE INDEX "memory_applications_context_assembly_id_idx" ON "memory_applications" USING btree ("context_assembly_id");--> statement-breakpoint
CREATE INDEX "memory_candidates_project_id_idx" ON "memory_candidates" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "memory_candidates_status_idx" ON "memory_candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "memory_candidates_kind_idx" ON "memory_candidates" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "memory_edges_from_idx" ON "memory_edges" USING btree ("from_memory_record_id");--> statement-breakpoint
CREATE INDEX "memory_edges_to_idx" ON "memory_edges" USING btree ("to_memory_record_id");--> statement-breakpoint
CREATE INDEX "memory_edges_kind_idx" ON "memory_edges" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "memory_feedback_events_memory_record_id_idx" ON "memory_feedback_events" USING btree ("memory_record_id");--> statement-breakpoint
CREATE INDEX "memory_feedback_events_feedback_delta_id_idx" ON "memory_feedback_events" USING btree ("feedback_delta_id");--> statement-breakpoint
CREATE INDEX "memory_feedback_events_direction_idx" ON "memory_feedback_events" USING btree ("direction");--> statement-breakpoint
CREATE UNIQUE INDEX "memory_record_versions_record_version_unique" ON "memory_record_versions" USING btree ("memory_record_id","version");--> statement-breakpoint
CREATE INDEX "memory_record_versions_memory_record_id_idx" ON "memory_record_versions" USING btree ("memory_record_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memory_records_project_key_unique" ON "memory_records" USING btree ("project_id","key");--> statement-breakpoint
CREATE INDEX "memory_records_project_id_idx" ON "memory_records" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "memory_records_kind_idx" ON "memory_records" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "memory_records_status_idx" ON "memory_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "memory_records_valid_until_idx" ON "memory_records" USING btree ("valid_until");--> statement-breakpoint
CREATE UNIQUE INDEX "source_artifacts_uri_hash_unique" ON "source_artifacts" USING btree ("uri","content_hash");--> statement-breakpoint
CREATE INDEX "source_artifacts_project_id_idx" ON "source_artifacts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "source_artifacts_kind_idx" ON "source_artifacts" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "source_artifacts_trust_tier_idx" ON "source_artifacts" USING btree ("trust_tier");--> statement-breakpoint
CREATE UNIQUE INDEX "source_chunks_artifact_ordinal_unique" ON "source_chunks" USING btree ("source_artifact_id","ordinal");--> statement-breakpoint
CREATE INDEX "source_chunks_source_artifact_id_idx" ON "source_chunks" USING btree ("source_artifact_id");--> statement-breakpoint
CREATE INDEX "source_chunks_content_hash_idx" ON "source_chunks" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "source_claim_edges_from_idx" ON "source_claim_edges" USING btree ("from_source_claim_id");--> statement-breakpoint
CREATE INDEX "source_claim_edges_to_idx" ON "source_claim_edges" USING btree ("to_source_claim_id");--> statement-breakpoint
CREATE INDEX "source_claim_edges_kind_idx" ON "source_claim_edges" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "source_claims_source_artifact_id_idx" ON "source_claims" USING btree ("source_artifact_id");--> statement-breakpoint
CREATE INDEX "source_claims_source_chunk_id_idx" ON "source_claims" USING btree ("source_chunk_id");--> statement-breakpoint
CREATE INDEX "source_claims_trust_tier_idx" ON "source_claims" USING btree ("trust_tier");--> statement-breakpoint
CREATE INDEX "source_claims_support_type_idx" ON "source_claims" USING btree ("support_type");--> statement-breakpoint
CREATE INDEX "source_claims_consumer_idx" ON "source_claims" USING btree ("consumer");--> statement-breakpoint
CREATE INDEX "source_decisions_project_id_idx" ON "source_decisions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "source_decisions_source_claim_id_idx" ON "source_decisions" USING btree ("source_claim_id");--> statement-breakpoint
CREATE INDEX "source_decisions_status_idx" ON "source_decisions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "source_decisions_consumer_idx" ON "source_decisions" USING btree ("consumer");--> statement-breakpoint
CREATE INDEX "source_rejections_project_id_idx" ON "source_rejections" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "source_rejections_source_artifact_id_idx" ON "source_rejections" USING btree ("source_artifact_id");--> statement-breakpoint
CREATE INDEX "source_rejections_source_claim_id_idx" ON "source_rejections" USING btree ("source_claim_id");--> statement-breakpoint
CREATE INDEX "source_rejections_consumer_idx" ON "source_rejections" USING btree ("consumer");--> statement-breakpoint
CREATE UNIQUE INDEX "source_snapshots_artifact_hash_unique" ON "source_snapshots" USING btree ("source_artifact_id","content_hash");--> statement-breakpoint
CREATE INDEX "source_snapshots_source_artifact_id_idx" ON "source_snapshots" USING btree ("source_artifact_id");